import { Request, Response } from 'express';
import pool, { executeQuery } from '../db';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    console.log('Recupero transazioni per user_id:', userId);
    
    // Query con join a properties e filtro user_id in properties
    const query = `
      SELECT t.*, p.name as property_name, tn.name as tenant_name
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      LEFT JOIN tenants tn ON t.tenant_id = tn.id
      WHERE p.user_id = $1
      ORDER BY t.date DESC
    `;
    console.log('Query eseguita:', query);
    
    const result = await executeQuery(async (client) => {
      return client.query(query, [userId]);
    });
    
    console.log('Numero di transazioni trovate:', result.rows.length);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero delle transazioni:', error);
    res.status(500).json({ error: 'Error retrieving transactions' });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Query con join a properties e filtro user_id in properties
    const result = await pool.query(`
      SELECT t.*
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      WHERE t.id = $1 AND p.user_id = $2
    `, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nel recupero della transazione:', error);
    res.status(500).json({ error: 'Error retrieving transaction' });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { 
      date,
      amount,
      type,
      category,
      description,
      property_id,
      tenant_id
    } = req.body;
    
    console.log("Creazione transazione con dati:", { 
      date, amount, type, category, description, property_id, 
      tenant_id: tenant_id || "null", 
      tenant_id_type: tenant_id ? typeof tenant_id : "null" 
    });
    
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Verifica che la proprietà appartenga all'utente
    const propertyCheck = await pool.query(
      'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
      [property_id, userId]
    );
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Property not found or not owned by user' });
    }
    
    // Se tenant_id è una stringa "none" o vuota, impostiamo a null
    const finalTenantId = tenant_id && tenant_id !== "none" && tenant_id !== "" ? tenant_id : null;
    
    console.log("tenant_id finale per la transazione:", finalTenantId);
    
    // Procedi con l'inserimento
    const result = await pool.query(
      `INSERT INTO transactions (
        date, amount, type, category, description, 
        property_id, tenant_id, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [date, amount, type, category, description, property_id, finalTenantId, userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Errore nella creazione della transazione:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      date,
      amount,
      type,
      category,
      description,
      property_id,
      tenant_id
    } = req.body;
    
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Verifica che la transazione appartenga all'utente
    const transactionCheck = await pool.query(`
      SELECT t.id
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      WHERE t.id = $1 AND p.user_id = $2
    `, [id, userId]);
    
    if (transactionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or not accessible' });
    }
    
    // Verifica che la nuova proprietà appartenga all'utente
    const propertyCheck = await pool.query(
      'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
      [property_id, userId]
    );
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Property not found or not owned by user' });
    }
    
    const result = await pool.query(
      `UPDATE transactions SET 
        date = $1, amount = $2, type = $3, category = $4,
        description = $5, property_id = $6, tenant_id = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 RETURNING *`,
      [date, amount, type, category, description, property_id, tenant_id, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della transazione:', error);
    res.status(500).json({ error: 'Error updating transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Verifica che la transazione appartenga all'utente
    const transactionCheck = await pool.query(`
      SELECT t.id
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      WHERE t.id = $1 AND p.user_id = $2
    `, [id, userId]);
    
    if (transactionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or not accessible' });
    }
    
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Errore nell\'eliminazione della transazione:', error);
    res.status(500).json({ error: 'Error deleting transaction' });
  }
}; 