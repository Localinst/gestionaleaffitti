import { Request, Response } from 'express';
import pool from '../db/index';

// La richiesta autenticata è estesa da Request standard
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Ottiene tutte le attività.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const getAllActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Ottieni tutte le attività per l'utente corrente
    const result = await pool.query(
      `SELECT a.*, p.name as property_name, t.name as tenant_name 
       FROM activities a
       LEFT JOIN properties p ON a.property_id = p.id
       LEFT JOIN tenants t ON a.tenant_id = t.id
       WHERE p.user_id = $1
       ORDER BY a.date DESC
      `,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero delle attività:', error);
    res.status(500).json({ error: 'Errore nel recupero delle attività' });
  }
};

/**
 * Crea una nuova attività.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const createActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      description, 
      property_id, 
      tenant_id, 
      date, 
      type, 
      priority, 
      status, 
      related_id 
    } = req.body;
    
    // Validazione
    if (!property_id || !description || !date || !type || !priority || !status) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }
    
    // Verifica che la proprietà appartenga all'utente
    const userId = req.user?.id;
    const propertyCheck = await pool.query(
      'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
      [property_id, userId]
    );
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Proprietà non trovata o non autorizzata' });
    }
    
    // Inserimento dell'attività
    const result = await pool.query(
      `INSERT INTO activities (
        description, property_id, tenant_id, date, type, 
        priority, status, related_id, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        description, 
        property_id, 
        tenant_id || null, 
        date, 
        type, 
        priority, 
        status, 
        related_id || null,
        userId
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Errore nella creazione dell\'attività:', error);
    res.status(500).json({ error: 'Errore nella creazione dell\'attività' });
  }
};

/**
 * Aggiorna lo stato di un'attività.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const updateActivityStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validazione
    if (!status) {
      return res.status(400).json({ error: 'Stato mancante' });
    }
    
    // Verifica che l'attività appartenga all'utente
    const userId = req.user?.id;
    const activityCheck = await pool.query(
      `SELECT a.id FROM activities a 
       JOIN properties p ON a.property_id = p.id 
       WHERE a.id = $1 AND p.user_id = $2`,
      [id, userId]
    );
    
    if (activityCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Attività non trovata o non autorizzata' });
    }
    
    // Aggiornamento dell'attività
    const result = await pool.query(
      'UPDATE activities SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato dell\'attività:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato dell\'attività' });
  }
}; 