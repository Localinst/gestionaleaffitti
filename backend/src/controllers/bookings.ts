import { Request, Response } from 'express';
import pool, { executeQuery } from '../db';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * Ottiene tutte le prenotazioni dell'utente.
 */
export const getAllBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Controllo se è specificato un ID proprietà nella query
    const propertyId = req.query.propertyId as string;
    const status = req.query.status as string;
    
    let query = `
      SELECT b.*, p.name as property_name 
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.user_id = $1
    `;
    
    const params: any[] = [userId];
    let paramCount = 1;
    
    if (propertyId) {
      paramCount++;
      query += ` AND b.property_id = $${paramCount}`;
      params.push(propertyId);
    }
    
    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ` ORDER BY b.check_in_date ASC`;
    
    const result = await executeQuery(async (client) => {
      return client.query(query, params);
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero delle prenotazioni:', error);
    res.status(500).json({ error: 'Errore nel recupero delle prenotazioni' });
  }
};

/**
 * Ottiene una prenotazione specifica per ID.
 */
export const getBookingById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(`
        SELECT b.*, p.name as property_name 
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        WHERE b.id = $1 AND b.user_id = $2
      `, [id, userId]);
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }
    
    // Recupera anche i servizi aggiuntivi associati alla prenotazione
    const servicesResult = await executeQuery(async (client) => {
      return client.query(`
        SELECT bs.*, serv.name, serv.description, serv.price_type
        FROM booking_services bs
        JOIN additional_services serv ON bs.service_id = serv.id
        WHERE bs.booking_id = $1
      `, [id]);
    });
    
    const bookingData = result.rows[0];
    bookingData.services = servicesResult.rows;
    
    res.json(bookingData);
  } catch (error) {
    console.error('Errore nel recupero della prenotazione:', error);
    res.status(500).json({ error: 'Errore nel recupero della prenotazione' });
  }
};

/**
 * Crea una nuova prenotazione.
 */
export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      property_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in_date,
      check_out_date,
      num_guests,
      total_price,
      deposit_amount,
      status,
      booking_source,
      booking_reference,
      notes,
      services = []
    } = req.body;
    
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che la proprietà appartenga all'utente
    const propertyCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2 AND is_tourism = TRUE',
        [property_id, userId]
      );
    });
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Proprietà non trovata o non è una locazione turistica' });
    }
    
    // Verifica se ci sono sovrapposizioni di date
    const overlapCheck = await executeQuery(async (client) => {
      return client.query(`
        SELECT id FROM bookings 
        WHERE property_id = $1 
        AND status IN ('pending', 'confirmed')
        AND (
          (check_in_date <= $2 AND check_out_date > $2) OR
          (check_in_date < $3 AND check_out_date >= $3) OR
          (check_in_date >= $2 AND check_out_date <= $3)
        )
      `, [property_id, check_in_date, check_out_date]);
    });
    
    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Il periodo selezionato è già occupato da un\'altra prenotazione' });
    }
    
    // Utilizza una transazione per inserire la prenotazione e i servizi
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Inserisci la prenotazione
      const bookingResult = await client.query(`
        INSERT INTO bookings (
          property_id, user_id, guest_name, guest_email, guest_phone,
          check_in_date, check_out_date, num_guests, total_price,
          deposit_amount, status, booking_source, booking_reference, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        property_id, userId, guest_name, guest_email, guest_phone,
        check_in_date, check_out_date, num_guests, total_price,
        deposit_amount || 0, status || 'pending', booking_source || 'direct', booking_reference || null, notes || null
      ]);
      
      const bookingId = bookingResult.rows[0].id;
      
      // Inserisci i servizi aggiuntivi
      if (services && services.length > 0) {
        for (const service of services) {
          await client.query(`
            INSERT INTO booking_services (
              booking_id, service_id, quantity, price, notes
            ) VALUES ($1, $2, $3, $4, $5)
          `, [bookingId, service.service_id, service.quantity, service.price, service.notes || null]);
        }
      }
      
      // Crea automaticamente un task di pulizia per dopo il check-out
      await client.query(`
        INSERT INTO cleaning_tasks (
          property_id, booking_id, user_id, scheduled_date, status
        ) VALUES ($1, $2, $3, $4, 'pending')
      `, [property_id, bookingId, userId, check_out_date]);
      
      await client.query('COMMIT');
      
      // Recupera la prenotazione appena creata con tutti i dettagli
      const completeBooking = await getCompleteBookingById(bookingId, userId);
      
      res.status(201).json(completeBooking);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Errore nella creazione della prenotazione:', error);
    res.status(500).json({ error: 'Errore nella creazione della prenotazione' });
  }
};

/**
 * Aggiorna una prenotazione esistente.
 */
export const updateBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      guest_name,
      guest_email,
      guest_phone,
      check_in_date,
      check_out_date,
      num_guests,
      total_price,
      deposit_amount,
      status,
      booking_source,
      booking_reference,
      notes,
      cleaning_status,
      is_paid
    } = req.body;
    
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che la prenotazione appartenga all'utente
    const bookingCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id, property_id FROM bookings WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
    });
    
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }
    
    const propertyId = bookingCheck.rows[0].property_id;
    
    // Verifica sovrapposizioni di date solo se le date vengono cambiate
    if (check_in_date && check_out_date) {
      const overlapCheck = await executeQuery(async (client) => {
        return client.query(`
          SELECT id FROM bookings 
          WHERE property_id = $1 
          AND id != $2
          AND status IN ('pending', 'confirmed')
          AND (
            (check_in_date <= $3 AND check_out_date > $3) OR
            (check_in_date < $4 AND check_out_date >= $4) OR
            (check_in_date >= $3 AND check_out_date <= $4)
          )
        `, [propertyId, id, check_in_date, check_out_date]);
      });
      
      if (overlapCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Il periodo selezionato è già occupato da un\'altra prenotazione' });
      }
    }
    
    // Costruisci la query di aggiornamento in modo dinamico
    let updateQuery = 'UPDATE bookings SET ';
    const updateParams: any[] = [];
    const updateFields = [];
    let paramCount = 1;
    
    // Costruisci in modo dinamico la query con i campi da aggiornare
    if (guest_name !== undefined) {
      updateFields.push(`guest_name = $${paramCount++}`);
      updateParams.push(guest_name);
    }
    
    if (guest_email !== undefined) {
      updateFields.push(`guest_email = $${paramCount++}`);
      updateParams.push(guest_email);
    }
    
    if (guest_phone !== undefined) {
      updateFields.push(`guest_phone = $${paramCount++}`);
      updateParams.push(guest_phone);
    }
    
    if (check_in_date !== undefined) {
      updateFields.push(`check_in_date = $${paramCount++}`);
      updateParams.push(check_in_date);
    }
    
    if (check_out_date !== undefined) {
      updateFields.push(`check_out_date = $${paramCount++}`);
      updateParams.push(check_out_date);
    }
    
    if (num_guests !== undefined) {
      updateFields.push(`num_guests = $${paramCount++}`);
      updateParams.push(num_guests);
    }
    
    if (total_price !== undefined) {
      updateFields.push(`total_price = $${paramCount++}`);
      updateParams.push(total_price);
    }
    
    if (deposit_amount !== undefined) {
      updateFields.push(`deposit_amount = $${paramCount++}`);
      updateParams.push(deposit_amount);
    }
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateParams.push(status);
    }
    
    if (booking_source !== undefined) {
      updateFields.push(`booking_source = $${paramCount++}`);
      updateParams.push(booking_source);
    }
    
    if (booking_reference !== undefined) {
      updateFields.push(`booking_reference = $${paramCount++}`);
      updateParams.push(booking_reference);
    }
    
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      updateParams.push(notes);
    }
    
    if (cleaning_status !== undefined) {
      updateFields.push(`cleaning_status = $${paramCount++}`);
      updateParams.push(cleaning_status);
    }
    
    if (is_paid !== undefined) {
      updateFields.push(`is_paid = $${paramCount++}`);
      updateParams.push(is_paid);
    }
    
    // Se non ci sono campi da aggiornare, restituisci la prenotazione originale
    if (updateFields.length === 0) {
      const booking = await getCompleteBookingById(id, userId);
      return res.json(booking);
    }
    
    // Completa la query di aggiornamento
    updateQuery += updateFields.join(', ');
    updateQuery += ` WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`;
    updateParams.push(id, userId);
    
    // Esegui l'aggiornamento
    const result = await executeQuery(async (client) => {
      return client.query(updateQuery, updateParams);
    });
    
    // Aggiorna anche il task di pulizia se le date sono cambiate
    if (check_out_date) {
      await executeQuery(async (client) => {
        return client.query(
          'UPDATE cleaning_tasks SET scheduled_date = $1 WHERE booking_id = $2',
          [check_out_date, id]
        );
      });
    }
    
    // Recupera la prenotazione aggiornata con tutti i dettagli
    const updatedBooking = await getCompleteBookingById(id, userId);
    
    res.json(updatedBooking);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della prenotazione:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della prenotazione' });
  }
};

/**
 * Elimina una prenotazione.
 */
export const deleteBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Utilizza una transazione per eliminare in modo sicuro
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Elimina prima i servizi associati alla prenotazione
      await client.query('DELETE FROM booking_services WHERE booking_id = $1', [id]);
      
      // Elimina i task di pulizia associati alla prenotazione
      await client.query('DELETE FROM cleaning_tasks WHERE booking_id = $1', [id]);
      
      // Elimina la prenotazione
      const result = await client.query(
        'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Prenotazione non trovata' });
      }
      
      await client.query('COMMIT');
      
      res.json({ success: true, message: 'Prenotazione eliminata con successo' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Errore nell\'eliminazione della prenotazione:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione della prenotazione' });
  }
};

/**
 * Ottiene il calendario delle disponibilità per una proprietà.
 */
export const getAvailabilityCalendar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const startDate = req.query.start_date as string || new Date().toISOString().split('T')[0];
    const endDate = req.query.end_date as string || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0];
    
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che la proprietà appartenga all'utente
    const propertyCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2 AND is_tourism = TRUE',
        [propertyId, userId]
      );
    });
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Proprietà non trovata o non è una locazione turistica' });
    }
    
    // Recupera tutte le prenotazioni nel periodo specificato
    const bookingsResult = await executeQuery(async (client) => {
      return client.query(`
        SELECT id, guest_name, check_in_date, check_out_date, status
        FROM bookings 
        WHERE property_id = $1 
        AND (
          (check_in_date <= $3 AND check_out_date >= $2) OR
          (check_in_date BETWEEN $2 AND $3)
        )
      `, [propertyId, startDate, endDate]);
    });
    
    // Recupera le tariffe stagionali nel periodo specificato
    const ratesResult = await executeQuery(async (client) => {
      return client.query(`
        SELECT id, name, start_date, end_date, daily_rate, weekend_rate, min_stay
        FROM seasonal_rates 
        WHERE property_id = $1 
        AND is_active = TRUE
        AND (
          (start_date <= $3 AND end_date >= $2) OR
          (start_date BETWEEN $2 AND $3)
        )
      `, [propertyId, startDate, endDate]);
    });
    
    // Recupera i task di pulizia nel periodo specificato
    const cleaningResult = await executeQuery(async (client) => {
      return client.query(`
        SELECT id, scheduled_date, status
        FROM cleaning_tasks 
        WHERE property_id = $1 
        AND scheduled_date BETWEEN $2 AND $3
      `, [propertyId, startDate, endDate]);
    });
    
    const calendar = {
      bookings: bookingsResult.rows,
      rates: ratesResult.rows,
      cleaning_tasks: cleaningResult.rows
    };
    
    res.json(calendar);
  } catch (error) {
    console.error('Errore nel recupero del calendario:', error);
    res.status(500).json({ error: 'Errore nel recupero del calendario' });
  }
};

/**
 * Funzione helper per recuperare una prenotazione completa
 */
async function getCompleteBookingById(bookingId: string, userId: string) {
  const bookingResult = await executeQuery(async (client) => {
    return client.query(`
      SELECT b.*, p.name as property_name 
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.id = $1 AND b.user_id = $2
    `, [bookingId, userId]);
  });
  
  if (bookingResult.rows.length === 0) {
    return null;
  }
  
  const booking = bookingResult.rows[0];
  
  // Recupera i servizi aggiuntivi associati
  const servicesResult = await executeQuery(async (client) => {
    return client.query(`
      SELECT bs.*, serv.name, serv.description, serv.price_type
      FROM booking_services bs
      JOIN additional_services serv ON bs.service_id = serv.id
      WHERE bs.booking_id = $1
    `, [bookingId]);
  });
  
  booking.services = servicesResult.rows;
  
  // Recupera il task di pulizia associato
  const cleaningResult = await executeQuery(async (client) => {
    return client.query(`
      SELECT id, scheduled_date, scheduled_time, cleaner_name, status, cost
      FROM cleaning_tasks
      WHERE booking_id = $1
    `, [bookingId]);
  });
  
  if (cleaningResult.rows.length > 0) {
    booking.cleaning_task = cleaningResult.rows[0];
  }
  
  return booking;
} 