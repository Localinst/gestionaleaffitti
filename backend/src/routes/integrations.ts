import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { Response } from 'express';
import { executeQuery } from '../db';
import ical from 'node-ical';
import * as icalGenerator from 'ical-generator';
import crypto from 'crypto';

const router = Router();
router.use(authenticate);

/**
 * Ottiene tutte le integrazioni dell'utente autenticato.
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(
        `SELECT ei.*, p.name as property_name 
         FROM external_integrations ei
         JOIN properties p ON ei.property_id = p.id
         WHERE ei.user_id = $1
         ORDER BY ei.created_at DESC`,
        [userId]
      );
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero delle integrazioni:', error);
    res.status(500).json({ error: 'Errore nel recupero delle integrazioni' });
  }
});

/**
 * Ottiene le integrazioni per una specifica proprietà.
 */
router.get('/property/:propertyId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che la proprietà appartenga all'utente
    const propertyCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
        [propertyId, userId]
      );
    });
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Proprietà non trovata o non autorizzata' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(
        `SELECT * FROM external_integrations 
         WHERE property_id = $1 AND user_id = $2
         ORDER BY created_at DESC`,
        [propertyId, userId]
      );
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero delle integrazioni per la proprietà:', error);
    res.status(500).json({ error: 'Errore nel recupero delle integrazioni' });
  }
});

/**
 * Aggiunge una nuova integrazione iCal.
 */
router.post('/ical', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { property_id, sync_url, name } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    if (!property_id || !sync_url) {
      return res.status(400).json({ error: 'ID proprietà e URL di sincronizzazione sono obbligatori' });
    }
    
    // Verifica che la proprietà appartenga all'utente
    const propertyCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2 AND is_tourism = TRUE',
        [property_id, userId]
      );
    });
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Proprietà non trovata o non autorizzata' });
    }
    
    // Tenta di scaricare e validare l'URL iCal
    try {
      const events = await ical.fromURL(sync_url);
      if (!events || Object.keys(events).length === 0) {
        return res.status(400).json({ error: 'URL iCal non valido o calendario vuoto' });
      }
    } catch (icalError) {
      console.error('Errore nel download del calendario:', icalError);
      return res.status(400).json({ error: 'Impossibile scaricare il calendario iCal' });
    }
    
    // Aggiungi l'integrazione
    const result = await executeQuery(async (client) => {
      return client.query(
        `INSERT INTO external_integrations 
         (user_id, property_id, integration_type, sync_url, credentials, last_sync) 
         VALUES ($1, $2, 'ical', $3, $4, NOW())
         RETURNING *`,
        [userId, property_id, sync_url, JSON.stringify({ name: name || 'Calendario esterno' })]
      );
    });
    
    // Sincronizza immediatamente il calendario
    syncIcalCalendar(userId, property_id, sync_url)
      .then(() => console.log(`Calendario sincronizzato con successo: ${name || 'Calendario esterno'}`))
      .catch(err => console.error('Errore nella sincronizzazione iniziale:', err));
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Errore nell\'aggiunta dell\'integrazione iCal:', error);
    res.status(500).json({ error: 'Errore nell\'aggiunta dell\'integrazione' });
  }
});

/**
 * Sincronizza manualmente un'integrazione specifica.
 */
router.post('/sync/:integrationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Recupera i dettagli dell'integrazione
    const integration = await executeQuery(async (client) => {
      return client.query(
        `SELECT * FROM external_integrations 
         WHERE id = $1 AND user_id = $2`,
        [integrationId, userId]
      );
    });
    
    if (integration.rows.length === 0) {
      return res.status(404).json({ error: 'Integrazione non trovata' });
    }
    
    const { property_id, sync_url, integration_type } = integration.rows[0];
    
    // Verifica il tipo di integrazione e sincronizza di conseguenza
    if (integration_type === 'ical') {
      await syncIcalCalendar(userId, property_id, sync_url);
      
      // Aggiorna il timestamp dell'ultima sincronizzazione
      await executeQuery(async (client) => {
        return client.query(
          `UPDATE external_integrations 
           SET last_sync = NOW() 
           WHERE id = $1`,
          [integrationId]
        );
      });
      
      res.json({ success: true, message: 'Calendario sincronizzato con successo' });
    } else {
      res.status(400).json({ error: 'Tipo di integrazione non supportato' });
    }
  } catch (error) {
    console.error('Errore nella sincronizzazione:', error);
    res.status(500).json({ error: 'Errore nella sincronizzazione' });
  }
});

/**
 * Elimina un'integrazione.
 */
router.delete('/:integrationId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(
        `DELETE FROM external_integrations 
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [integrationId, userId]
      );
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integrazione non trovata' });
    }
    
    res.json({ success: true, message: 'Integrazione eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'integrazione:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'integrazione' });
  }
});

/**
 * Genera un token sicuro per il feed iCal pubblico.
 */
router.post('/token/:propertyId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che la proprietà appartenga all'utente
    const propertyCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
        [propertyId, userId]
      );
    });
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Proprietà non trovata o non autorizzata' });
    }
    
    // Genera un token unico
    const token = crypto.randomBytes(32).toString('hex');
    
    // Salva il token nel database (potrebbe essere in una tabella separata)
    await executeQuery(async (client) => {
      // Verifica se esiste già un'integrazione di tipo 'export'
      const existing = await client.query(
        `SELECT id FROM external_integrations 
         WHERE property_id = $1 AND user_id = $2 AND integration_type = 'ical' AND external_id = 'export'`,
        [propertyId, userId]
      );
      
      if (existing.rows.length > 0) {
        // Aggiorna il token esistente
        await client.query(
          `UPDATE external_integrations 
           SET credentials = $1, last_sync = NOW() 
           WHERE id = $2`,
          [JSON.stringify({ token }), existing.rows[0].id]
        );
      } else {
        // Crea un nuovo record
        await client.query(
          `INSERT INTO external_integrations 
           (user_id, property_id, integration_type, external_id, sync_url, credentials) 
           VALUES ($1, $2, 'ical', 'export', '', $3)`,
          [userId, propertyId, JSON.stringify({ token })]
        );
      }
    });
    
    res.json({ token });
  } catch (error) {
    console.error('Errore nella generazione del token:', error);
    res.status(500).json({ error: 'Errore nella generazione del token' });
  }
});

/**
 * Genera feed iCal pubblico per una proprietà.
 */
router.get('/export/:propertyId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const token = req.query.token as string;
    
    // Verifica il token
    if (!token) {
      return res.status(401).json({ error: 'Token di accesso richiesto' });
    }
    
    // Recupera i dati della proprietà e verifica il token
    const tokenCheck = await executeQuery(async (client) => {
      return client.query(
        `SELECT ei.*, p.name as property_name, p.address, u.id as user_id
         FROM external_integrations ei
         JOIN properties p ON ei.property_id = p.id
         JOIN users u ON ei.user_id = u.id
         WHERE ei.property_id = $1 
         AND ei.integration_type = 'ical'
         AND ei.external_id = 'export'
         AND ei.credentials->>'token' = $2`,
        [propertyId, token]
      );
    });
    
    if (tokenCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Token non valido' });
    }
    
    const property = tokenCheck.rows[0];
    
    // Recupera le prenotazioni
    const bookings = await executeQuery(async (client) => {
      return client.query(
        `SELECT * FROM bookings
         WHERE property_id = $1 AND status != 'cancelled'`,
        [propertyId]
      );
    });
    
    // Crea il feed iCal
    const calendar = icalGenerator.default({
      name: `Prenotazioni - ${property.property_name || 'Proprietà'}`,
      timezone: 'Europe/Rome',
      prodId: { company: 'Gestionale Affitti', product: 'Calendario Prenotazioni' }
    });
    
    // Aggiungi gli eventi per ogni prenotazione
    bookings.rows.forEach(booking => {
      calendar.createEvent({
        uid: `booking-${booking.id}@gestionale-affitti`,
        start: new Date(booking.check_in_date),
        end: new Date(booking.check_out_date),
        summary: `Prenotazione: ${booking.guest_name || 'Ospite'}`,
        description: `Prenotazione #${booking.id}${booking.notes ? `\n\nNote: ${booking.notes}` : ''}`,
        location: property.address || '',
        status: booking.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'
      });
    });
    
    // Invia il calendario come risposta
    res.set('Content-Type', 'text/calendar');
    res.set('Content-Disposition', `attachment; filename="${property.property_name || 'calendar'}-bookings.ics"`);
    res.send(calendar.toString());
  } catch (error) {
    console.error('Errore nella generazione del calendario:', error);
    res.status(500).json({ error: 'Errore nella generazione del calendario' });
  }
});

/**
 * Funzione di utilità per sincronizzare un calendario iCal.
 */
export async function syncIcalCalendar(userId: string, propertyId: number, icalUrl: string) {
  try {
    console.log(`Sincronizzazione calendario per proprietà ${propertyId}, URL: ${icalUrl}`);
    const events = await ical.fromURL(icalUrl);
    
    // Inizia una transazione
    let syncedEvents = 0;
    let newEvents = 0;
    let updatedEvents = 0;
    
    await executeQuery(async (client) => {
      await client.query('BEGIN');
      
      try {
        // Per ogni evento nel calendario
        for (const [uid, event] of Object.entries(events)) {
          if (event.type === 'VEVENT' && event.start && event.end) {
            syncedEvents++;
            
            // Assicurati che le date siano in formato ISO
            const checkInDate = new Date(event.start).toISOString().split('T')[0];
            const checkOutDate = new Date(event.end).toISOString().split('T')[0];
            
            // Verifica se la prenotazione esiste già
            const existingBooking = await client.query(
              `SELECT id FROM bookings 
               WHERE property_id = $1 AND external_id = $2`,
              [propertyId, uid]
            );
            
            if (existingBooking.rows.length > 0) {
              // Aggiorna la prenotazione esistente
              await client.query(
                `UPDATE bookings 
                 SET check_in_date = $1, check_out_date = $2, 
                     guest_name = $3, status = 'confirmed', updated_at = NOW()
                 WHERE id = $4`,
                [
                  checkInDate, 
                  checkOutDate,
                  event.summary || 'Prenotazione esterna',
                  existingBooking.rows[0].id
                ]
              );
              updatedEvents++;
            } else {
              // Crea una nuova prenotazione
              await client.query(
                `INSERT INTO bookings 
                 (property_id, user_id, guest_name, check_in_date, check_out_date, 
                  status, booking_source, external_id, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  propertyId,
                  userId,
                  event.summary || 'Prenotazione esterna',
                  checkInDate,
                  checkOutDate,
                  'confirmed',
                  'ical',
                  uid,
                  `Importato da iCal: ${icalUrl}`
                ]
              );
              newEvents++;
            }
          }
        }
        
        await client.query('COMMIT');
        console.log(`Sincronizzazione completata: ${syncedEvents} eventi trovati, ${newEvents} nuovi, ${updatedEvents} aggiornati`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
    
    return {
      success: true,
      totalEvents: syncedEvents,
      newEvents,
      updatedEvents
    };
  } catch (error) {
    console.error('Errore nella sincronizzazione del calendario:', error);
    throw error;
  }
}

export default router; 