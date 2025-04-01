import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest, ICalEvent } from '../types';
import { Response } from 'express';
import { executeQuery } from '../db';
import ical from 'node-ical';
import * as icalGenerator from 'ical-generator';
import crypto from 'crypto';
import { format } from 'date-fns';

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
    
    // Verifica se esiste già un'integrazione iCal per questa proprietà
    const existingIntegration = await executeQuery(async (client) => {
      return client.query(
        `SELECT id FROM external_integrations 
         WHERE property_id = $1 AND integration_type = 'ical'`,
        [property_id]
      );
    });
    
    let result;
    
    if (existingIntegration.rows.length > 0) {
      // Aggiorna l'integrazione esistente
      const integrationId = existingIntegration.rows[0].id;
      
      // Log dettagliato per debug
      console.log(`Aggiornamento integrazione esistente ID ${integrationId} per proprietà ${property_id}`);
      
      result = await executeQuery(async (client) => {
        return client.query(
          `UPDATE external_integrations 
           SET sync_url = $1, credentials = $2, last_sync = NOW(), user_id = $3
           WHERE id = $4
           RETURNING *`,
          [sync_url, JSON.stringify({ name: name || 'Calendario esterno' }), userId, integrationId]
        );
      });
      
      console.log(`Integrazione iCal aggiornata per la proprietà ${property_id}`);
    } else {
      // Aggiungi una nuova integrazione
      console.log(`Creazione nuova integrazione per proprietà ${property_id}`);
      
      try {
        result = await executeQuery(async (client) => {
          return client.query(
            `INSERT INTO external_integrations 
             (user_id, property_id, integration_type, sync_url, credentials, last_sync) 
             VALUES ($1, $2, 'ical', $3, $4, NOW())
             RETURNING *`,
            [userId, property_id, sync_url, JSON.stringify({ name: name || 'Calendario esterno' })]
          );
        });
        
        console.log(`Nuova integrazione iCal creata per la proprietà ${property_id}`);
      } catch (insertError: any) {
        console.error('Errore specifico durante l\'inserimento:', insertError);
        
        // Fallback: se c'è un errore di chiave duplicata, tenta un aggiornamento forzato
        if (insertError.code === '23505') { // PostgreSQL unique violation error code
          console.log('Rilevata violazione di unicità, tentativo di aggiornamento forzato');
          
          result = await executeQuery(async (client) => {
            return client.query(
              `UPDATE external_integrations 
               SET sync_url = $1, credentials = $2, last_sync = NOW(), user_id = $3
               WHERE property_id = $4 AND integration_type = 'ical'
               RETURNING *`,
              [sync_url, JSON.stringify({ name: name || 'Calendario esterno' }), userId, property_id]
            );
          });
          
          console.log('Aggiornamento forzato completato');
        } else {
          // Se non è un errore di unicità, rilancia l'eccezione
          throw insertError;
        }
      }
    }
    
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
    bookings.rows.forEach((booking: any) => {
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
          // Utilizza type assertion per gestire il tipo unknown
          const typedEvent = event as ICalEvent;
          
          if (typedEvent.type === 'VEVENT' && typedEvent.start && typedEvent.end) {
            syncedEvents++;
            
            // Estrai le date dell'evento
            const startDate = new Date(typedEvent.start);
            const endDate = new Date(typedEvent.end);

            console.log(`Evento originale: inizio=${startDate.toISOString()}, fine=${endDate.toISOString()}`);
            
            // Imposta le ore alle 18:00 (6 PM) per evitare problemi di fuso orario
            startDate.setHours(18, 0, 0, 0);
            endDate.setHours(18, 0, 0, 0);
            
            console.log(`Evento con correzione: inizio=${startDate.toISOString()}, fine=${endDate.toISOString()}`);
            
            // Converti le date in formato YYYY-MM-DD
            let checkInDate = format(startDate, 'yyyy-MM-dd');
            let checkOutDate = format(endDate, 'yyyy-MM-dd');
            
            // NUOVA LOGICA: distinguere tra prenotazioni e blocchi in base al summary e status
            // come fa Google Calendar
            let isRealBooking = false;
            let guestName = 'Blocco date';
            let bookingSource = uid.includes('airbnb') ? 'airbnb' : 
                             (uid.includes('booking') ? 'booking' : 'ical');
            
            // Analisi del titolo dell'evento come fa Google Calendar
            if (typedEvent.summary) {
              const summaryText = typedEvent.summary.toString();
              const summaryLower = summaryText.toLowerCase();
              
              console.log(`  Analisi titolo evento: "${summaryText}"`);
              
              // Google Calendar distingue "Reserved" da "not available"
              if (summaryLower.includes('reserved') || 
                 summaryLower.includes('booked') || 
                 summaryLower.includes('prenotato') ||
                 summaryLower.includes('confirmed')) {
                // Se contiene una di queste parole chiave, è una prenotazione
                isRealBooking = true;
                console.log(`  Identificato come PRENOTAZIONE dal titolo`);
                
                if (bookingSource === 'airbnb') {
                  guestName = 'Prenotazione Airbnb';
                } else if (bookingSource === 'booking') {
                  guestName = 'Prenotazione Booking';
                } else {
                  guestName = 'Prenotazione esterna';
                }
              }
              // Identifica esplicitamente i blocchi
              else if (summaryLower.includes('not available') || 
                      summaryLower.includes('unavailable') || 
                      summaryLower.includes('blocked') ||
                      summaryLower.includes('closed')) {
                // Questo è un blocco manuale
                isRealBooking = false;
                guestName = 'Blocco date';
                console.log(`  Identificato come BLOCCO dal titolo`);
              }
              // Se il titolo non contiene parole chiave specifiche ma ha un testo personalizzato
              else if (summaryText.trim() !== '') {
                // Probabilmente è una prenotazione con titolo personalizzato
                isRealBooking = true;
                guestName = summaryText.trim();
                console.log(`  Identificato come PRENOTAZIONE con titolo personalizzato: ${guestName}`);
              }
            }
            
            // Ulteriore analisi in base allo status
            if (typedEvent.status && typedEvent.status === 'CONFIRMED' && !isRealBooking) {
              // Lo status CONFIRMED è un forte indicatore di prenotazione
              console.log(`  Status CONFIRMED rilevato, considerato come prenotazione`);
              isRealBooking = true;
              
              if (guestName === 'Blocco date') {
                if (bookingSource === 'airbnb') {
                  guestName = 'Prenotazione Airbnb';
                } else if (bookingSource === 'booking') {
                  guestName = 'Prenotazione Booking';
                } else {
                  guestName = 'Prenotazione esterna';
                }
              }
            }
            
            const eventType = isRealBooking ? 'reservation' : 'block';
            
            // Log della decisione finale
            console.log(`  DECISIONE FINALE: ${isRealBooking ? 'PRENOTAZIONE' : 'BLOCCO'}`);
            console.log(`  Nome visualizzato: ${guestName}`);
            
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
                     guest_name = $3, status = 'confirmed', updated_at = NOW(),
                     booking_source = $4, notes = $5
                 WHERE id = $6`,
                [
                  checkInDate, 
                  checkOutDate,
                  guestName,
                  bookingSource,
                  `Importato da iCal: ${icalUrl} (${eventType})`,
                  existingBooking.rows[0].id
                ]
              );
              updatedEvents++;
            } else {
              // Crea una nuova prenotazione
              await client.query(
                `INSERT INTO bookings 
                 (property_id, user_id, guest_name, check_in_date, check_out_date, 
                  status, booking_source, external_id, notes, total_price)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  propertyId,
                  userId,
                  guestName,
                  checkInDate,
                  checkOutDate,
                  'confirmed',
                  bookingSource,
                  uid,
                  `Importato da iCal: ${icalUrl} (${eventType})`,
                  0 // Valore di default per total_price
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