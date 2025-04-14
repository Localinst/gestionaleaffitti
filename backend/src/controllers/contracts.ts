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
 * Ottiene tutti i contratti.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const getAllContracts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    let query = 'SELECT * FROM contracts WHERE user_id = $1';
    const params: any[] = [userId];
    
    if (propertyId) {
      query += ' AND property_id = $2';
      params.push(propertyId);
    }
    
    const contracts = await pool.query(query, params);
    res.json(contracts.rows);
  } catch (error) {
    console.error('Errore nel recupero dei contratti:', error);
    res.status(500).json({ error: 'Errore nel recupero dei contratti' });
  }
};

/**
 * Ottiene un contratto specifico tramite ID.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const getContractById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const contract = await pool.query('SELECT * FROM contracts WHERE id = $1 AND user_id = $2', [id, userId]);
    
    if (contract.rows.length === 0) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    res.json(contract.rows[0]);
  } catch (error) {
    console.error('Errore nel recupero del contratto:', error);
    res.status(500).json({ error: 'Errore nel recupero del contratto' });
  }
};

/**
 * Crea un nuovo contratto.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const createContract = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { property_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, status } = req.body;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Validazione dei campi obbligatori
    if (!property_id || !tenant_id || !start_date || !end_date || !rent_amount || !deposit_amount) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }
    
    // Inserimento del nuovo contratto (sintassi PostgreSQL)
    const result = await pool.query(
      `INSERT INTO contracts (property_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, status, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [property_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, status || 'active', userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Errore nella creazione del contratto:', error);
    res.status(500).json({ error: 'Errore nella creazione del contratto' });
  }
};

/**
 * Aggiorna un contratto esistente.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const updateContract = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { property_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, status } = req.body;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che il contratto esista ed appartenga all'utente
    const existingContract = await pool.query('SELECT * FROM contracts WHERE id = $1 AND user_id = $2', [id, userId]);
    
    if (existingContract.rows.length === 0) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    // Aggiornamento del contratto (sintassi PostgreSQL)
    const updatedContract = await pool.query(
      `UPDATE contracts 
       SET property_id = $1, tenant_id = $2, start_date = $3, end_date = $4, 
           rent_amount = $5, deposit_amount = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [property_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, status, id, userId]
    );
    
    res.json(updatedContract.rows[0]);
  } catch (error) {
    console.error('Errore nell\'aggiornamento del contratto:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del contratto' });
  }
};

/**
 * Elimina un contratto.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const deleteContract = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che il contratto esista ed appartenga all'utente
    const existingContract = await pool.query('SELECT * FROM contracts WHERE id = $1 AND user_id = $2', [id, userId]);
    
    if (existingContract.rows.length === 0) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    // Eliminazione del contratto (sintassi PostgreSQL)
    await pool.query('DELETE FROM contracts WHERE id = $1 AND user_id = $2', [id, userId]);
    
    res.json({ message: 'Contratto eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione del contratto:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione del contratto' });
  }
}; 