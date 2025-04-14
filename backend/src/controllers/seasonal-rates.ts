import { Request, Response } from 'express';
import pool, { executeQuery } from '../db';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * Ottiene tutte le tariffe stagionali dell'utente.
 */
export const getAllSeasonalRates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Controllo se è specificato un ID proprietà nella query
    const propertyId = req.query.propertyId as string;
    const activeOnly = req.query.active === 'true';
    
    let query = `
      SELECT sr.*, p.name as property_name 
      FROM seasonal_rates sr
      JOIN properties p ON sr.property_id = p.id
      WHERE sr.user_id = $1
    `;
    
    const params: any[] = [userId];
    let paramCount = 1;
    
    if (propertyId) {
      paramCount++;
      query += ` AND sr.property_id = $${paramCount}`;
      params.push(propertyId);
    }
    
    if (activeOnly) {
      paramCount++;
      query += ` AND sr.is_active = $${paramCount}`;
      params.push(true);
    }
    
    query += ` ORDER BY sr.start_date ASC`;
    
    const result = await executeQuery(async (client) => {
      return client.query(query, params);
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero delle tariffe stagionali:', error);
    res.status(500).json({ error: 'Errore nel recupero delle tariffe stagionali' });
  }
};

/**
 * Ottiene una tariffa stagionale specifica per ID.
 */
export const getSeasonalRateById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(`
        SELECT sr.*, p.name as property_name 
        FROM seasonal_rates sr
        JOIN properties p ON sr.property_id = p.id
        WHERE sr.id = $1 AND sr.user_id = $2
      `, [id, userId]);
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tariffa stagionale non trovata' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nel recupero della tariffa stagionale:', error);
    res.status(500).json({ error: 'Errore nel recupero della tariffa stagionale' });
  }
};

/**
 * Crea una nuova tariffa stagionale.
 */
export const createSeasonalRate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      property_id,
      name,
      start_date,
      end_date,
      daily_rate,
      min_stay,
      weekend_rate,
      weekly_discount_percent,
      monthly_discount_percent,
      is_active
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
    
    // Verifica se ci sono sovrapposizioni di date con altre tariffe stagionali attive
    const overlapCheck = await executeQuery(async (client) => {
      return client.query(`
        SELECT id FROM seasonal_rates 
        WHERE property_id = $1 
        AND is_active = TRUE
        AND (
          (start_date <= $2 AND end_date >= $2) OR
          (start_date <= $3 AND end_date >= $3) OR
          (start_date >= $2 AND end_date <= $3)
        )
      `, [property_id, start_date, end_date]);
    });
    
    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Il periodo selezionato si sovrappone con un\'altra tariffa stagionale attiva' });
    }
    
    // Inserisci la nuova tariffa stagionale
    const result = await executeQuery(async (client) => {
      return client.query(`
        INSERT INTO seasonal_rates (
          property_id, user_id, name, start_date, end_date,
          daily_rate, min_stay, weekend_rate,
          weekly_discount_percent, monthly_discount_percent, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        property_id, 
        userId, 
        name, 
        start_date, 
        end_date,
        daily_rate, 
        min_stay || 1, 
        weekend_rate || null,
        weekly_discount_percent || 0, 
        monthly_discount_percent || 0, 
        is_active !== undefined ? is_active : true
      ]);
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Errore nella creazione della tariffa stagionale:', error);
    res.status(500).json({ error: 'Errore nella creazione della tariffa stagionale' });
  }
};

/**
 * Aggiorna una tariffa stagionale esistente.
 */
export const updateSeasonalRate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      start_date,
      end_date,
      daily_rate,
      min_stay,
      weekend_rate,
      weekly_discount_percent,
      monthly_discount_percent,
      is_active
    } = req.body;
    
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che la tariffa stagionale appartenga all'utente
    const rateCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id, property_id FROM seasonal_rates WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
    });
    
    if (rateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tariffa stagionale non trovata' });
    }
    
    const propertyId = rateCheck.rows[0].property_id;
    
    // Verifica sovrapposizioni di date solo se le date vengono cambiate e la tariffa è attiva
    if (start_date && end_date && is_active !== false) {
      const overlapCheck = await executeQuery(async (client) => {
        return client.query(`
          SELECT id FROM seasonal_rates 
          WHERE property_id = $1 
          AND id != $2
          AND is_active = TRUE
          AND (
            (start_date <= $3 AND end_date >= $3) OR
            (start_date <= $4 AND end_date >= $4) OR
            (start_date >= $3 AND end_date <= $4)
          )
        `, [propertyId, id, start_date, end_date]);
      });
      
      if (overlapCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Il periodo selezionato si sovrappone con un\'altra tariffa stagionale attiva' });
      }
    }
    
    // Costruisci la query di aggiornamento in modo dinamico
    let updateQuery = 'UPDATE seasonal_rates SET ';
    const updateParams: any[] = [];
    const updateFields = [];
    let paramCount = 1;
    
    // Costruisci in modo dinamico la query con i campi da aggiornare
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      updateParams.push(name);
    }
    
    if (start_date !== undefined) {
      updateFields.push(`start_date = $${paramCount++}`);
      updateParams.push(start_date);
    }
    
    if (end_date !== undefined) {
      updateFields.push(`end_date = $${paramCount++}`);
      updateParams.push(end_date);
    }
    
    if (daily_rate !== undefined) {
      updateFields.push(`daily_rate = $${paramCount++}`);
      updateParams.push(daily_rate);
    }
    
    if (min_stay !== undefined) {
      updateFields.push(`min_stay = $${paramCount++}`);
      updateParams.push(min_stay);
    }
    
    if (weekend_rate !== undefined) {
      updateFields.push(`weekend_rate = $${paramCount++}`);
      updateParams.push(weekend_rate);
    }
    
    if (weekly_discount_percent !== undefined) {
      updateFields.push(`weekly_discount_percent = $${paramCount++}`);
      updateParams.push(weekly_discount_percent);
    }
    
    if (monthly_discount_percent !== undefined) {
      updateFields.push(`monthly_discount_percent = $${paramCount++}`);
      updateParams.push(monthly_discount_percent);
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      updateParams.push(is_active);
    }
    
    // Se non ci sono campi da aggiornare, restituisci la tariffa stagionale originale
    if (updateFields.length === 0) {
      const result = await executeQuery(async (client) => {
        return client.query(
          'SELECT * FROM seasonal_rates WHERE id = $1 AND user_id = $2',
          [id, userId]
        );
      });
      
      return res.json(result.rows[0]);
    }
    
    // Completa la query di aggiornamento
    updateQuery += updateFields.join(', ');
    updateQuery += ` WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`;
    updateParams.push(id, userId);
    
    // Esegui l'aggiornamento
    const result = await executeQuery(async (client) => {
      return client.query(updateQuery, updateParams);
    });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della tariffa stagionale:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della tariffa stagionale' });
  }
};

/**
 * Elimina una tariffa stagionale.
 */
export const deleteSeasonalRate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(
        'DELETE FROM seasonal_rates WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tariffa stagionale non trovata' });
    }
    
    res.json({ success: true, message: 'Tariffa stagionale eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione della tariffa stagionale:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione della tariffa stagionale' });
  }
}; 