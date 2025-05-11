import { Request, Response } from 'express';
import pool, { executeQuery } from '../db';

export const getProperties = async (req: Request, res: Response) => {
  // Aggiungo un timeout di sicurezza
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout della query al database')), 15000)
  );

  try {
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Controllo se la richiesta è già scaduta
    if (req.timedout) {
      console.log('Richiesta già in timeout, interruzione precoce');
      return;
    }

    // Query con filtro user_id usando il wrapper e race con il timeout
    const queryPromise = executeQuery(async (client) => {
      return client.query(
        'SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
    });
    
    // Utilizzo Promise.race per implementare il timeout
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    // Controllo se la richiesta è scaduta durante l'esecuzione della query
    if (req.timedout) {
      console.log('Richiesta in timeout durante l\'esecuzione della query');
      return;
    }
    
    res.json(result.rows);
  } catch (error) {
    // Controllo se la richiesta è scaduta
    if (req.timedout) {
      console.log('Richiesta in timeout, nessuna risposta necessaria');
      return;
    }
    
    // Verifico se l'errore è dovuto al timeout interno
    if (error instanceof Error && error.message === 'Timeout della query al database') {
      console.error('Timeout interno durante il recupero delle proprietà');
      return res.status(504).json({ error: 'Timeout durante l\'esecuzione della query, riprova più tardi' });
    }
    
    console.error('Errore nel recupero delle proprietà:', error);
    res.status(500).json({ error: 'Error retrieving properties' });
  }
};

export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Query con filtro user_id usando il wrapper
    const result = await executeQuery(async (client) => {
      return client.query(
        'SELECT * FROM properties WHERE id = $1 AND user_id = $2', 
        [id, userId]
      );
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nel recupero della proprietà:', error);
    res.status(500).json({ error: 'Error retrieving property' });
  }
};

export const createProperty = async (req: Request, res: Response) => {
  try {
    const { name, address, city, type, units, unitNames, is_tourism, max_guests } = req.body;
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Preparo i nomi delle unità come array JSON
    let unitNamesJson: string | null = null;
    if (unitNames && Array.isArray(unitNames) && unitNames.length > 0) {
      unitNamesJson = JSON.stringify(unitNames);
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(
        'INSERT INTO properties (name, address, city, type, units, value, image_url, unit_names, user_id, is_tourism, max_guests) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [name, address, city, type, units, 0, null, unitNamesJson, userId, is_tourism || false, max_guests || 0]
      );
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Errore nel server durante la creazione della proprietà:', error);
    res.status(500).json({ error: 'Error creating property' });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, city, type, units, is_tourism, max_guests } = req.body;
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Verifica che la proprietà appartenga all'utente
    const propertyCheck = await pool.query(
      'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found or not owned by user' });
    }
    
    const result = await pool.query(
      'UPDATE properties SET name = $1, address = $2, city = $3, type = $4, units = $5, value = $6, is_tourism = $7, max_guests = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 AND user_id = $10 RETURNING *',
      [name, address, city, type, units, 0, is_tourism || false, max_guests || 0, id, userId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nel server durante l\'aggiornamento della proprietà:', error);
    res.status(500).json({ error: 'Error updating property' });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    const result = await executeQuery(async (client) => {
      return client.query(
        'DELETE FROM properties WHERE id = $1 AND user_id = $2::uuid RETURNING *', 
        [id, userId]
      );
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found or not owned by user' });
    }
    
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Errore durante l\'eliminazione della proprietà:', error);
    res.status(500).json({ error: 'Error deleting property' });
  }
};

export const deleteAllProperties = async (req: Request, res: Response) => {
  try {
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    const result = await executeQuery(async (client) => {
      return client.query(
        'DELETE FROM properties WHERE user_id = $1::uuid RETURNING id', 
        [userId]
      );
    });
    
    const deletedCount = result.rows.length;
    
    res.json({ 
      message: `${deletedCount} proprietà eliminate con successo`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Errore durante l\'eliminazione di tutte le proprietà:', error);
    res.status(500).json({ error: 'Error deleting all properties' });
  }
}; 