import { Request, Response } from 'express';
import pool from '../db';
import { executeQuery } from '../db';

// Definiamo in modo più semplice l'interfaccia con il campo user opzionale
type AuthRequest = Request & {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
};

/**
 * Ottiene tutti i contratti.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const getAllContracts = async (req: AuthRequest, res: Response) => {
  try {
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;

    // Verifico se l'utente è autenticato
    if (!userId) {
      console.log('Utente non autenticato');
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const propertyId = req.query.propertyId as string | undefined;
    // Leggiamo il tipo di ID passato dal frontend (se presente)
    const idType = req.query.idType as string | undefined; 

    console.log('getAllContracts - userId:', userId, 'propertyId:', propertyId, 'idType:', idType);

    // Approccio più semplice: una query SQL unica che gestisce entrambi i casi
    let query;
    let params;

    if (propertyId) {
      // Query per filtrare per propertyId (tipi corretti!)
      query = `
        SELECT c.*, p.name AS property_name, t.name AS tenant_name
        FROM contracts c
        LEFT JOIN properties p ON c.property_id = p.id -- UUID = UUID (OK)
        LEFT JOIN tenants t ON c.tenant_id = t.id   -- UUID = UUID (OK)
        WHERE c.user_id = $1::text                 -- Confronta TEXT (c.user_id) con UUID castato a TEXT ($1)
          AND c.property_id = $2::uuid             -- Confronta UUID (c.property_id) con TEXT castato a UUID ($2)
        ORDER BY c.start_date DESC
      `;
      params = [userId, propertyId];
    } else {
      // Query per tutti i contratti dell'utente (tipi corretti!)
      query = `
        SELECT c.*, p.name AS property_name, t.name AS tenant_name
        FROM contracts c
        LEFT JOIN properties p ON c.property_id = p.id -- UUID = UUID (OK)
        LEFT JOIN tenants t ON c.tenant_id = t.id   -- UUID = UUID (OK)
        WHERE c.user_id = $1::text                 -- Confronta TEXT (c.user_id) con UUID castato a TEXT ($1)
        ORDER BY c.start_date DESC
      `;
      params = [userId];
    }

    console.log('Query eseguita:', query);
    console.log('Parametri:', params);

    // Esecuzione della query
    const result = await executeQuery(async (client) => {
      return client.query(query, params);
    });

    console.log('Numero di contratti trovati:', result.rows.length);

    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero dei contratti:', error);
    res.status(500).json({ error: 'Error retrieving contracts', message: error.message });
  }
};

/**
 * Ottiene un contratto specifico tramite ID.
 * 
 * @param req Richiesta Express
 * @param res Risposta Express
 */
export const getContractById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const contract = await pool.query('SELECT * FROM contracts WHERE id = $1 AND user_id = $2::uuid', [id, userId]);
    
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
export const createContract = async (req: AuthRequest, res: Response) => {
  try {
    const { property_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, status } = req.body;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Validazione dei campi obbligatori
    if (!start_date || !end_date || !rent_amount || !deposit_amount) {
      return res.status(400).json({ error: 'I campi data inizio, data fine, importo affitto e importo deposito sono obbligatori' });
    }
    
    // Se property_id è presente, verifica che appartenga all'utente
    if (property_id) {
      const propertyCheck = await pool.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2::uuid',
        [property_id, userId]
      );
      
      if (propertyCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Property not found or not owned by user' });
      }
    }
    
    // Inserimento del nuovo contratto
    const fields = ['start_date', 'end_date', 'rent_amount', 'deposit_amount', 'status', 'user_id'];
    const values = [start_date, end_date, rent_amount, deposit_amount, status || 'active', userId];
    const placeholders = ['$1', '$2', '$3', '$4', '$5', '$6::uuid'];
    let paramIndex = 7;
    
    // Aggiungi property_id e tenant_id solo se presenti
    if (property_id) {
      fields.push('property_id');
      values.push(property_id);
      placeholders.push(`$${paramIndex++}`);
    }
    
    if (tenant_id) {
      fields.push('tenant_id');
      values.push(tenant_id);
      placeholders.push(`$${paramIndex++}`);
    }
    
    const query = `
      INSERT INTO contracts (${fields.join(', ')}) 
      VALUES (${placeholders.join(', ')}) 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
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
export const updateContract = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { property_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, status } = req.body;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che il contratto esista ed appartenga all'utente
    const existingContract = await pool.query('SELECT * FROM contracts WHERE id = $1 AND user_id = $2::uuid', [id, userId]);
    
    if (existingContract.rows.length === 0) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    // Aggiornamento del contratto (sintassi PostgreSQL)
    const updatedContract = await pool.query(
      `UPDATE contracts 
       SET property_id = $1, tenant_id = $2, start_date = $3, end_date = $4, 
           rent_amount = $5, deposit_amount = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9::uuid
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
export const deleteContract = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Verifica se l'utente è autenticato
    if (!userId) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    // Verifica che il contratto esista ed appartenga all'utente
    const existingContract = await pool.query('SELECT * FROM contracts WHERE id = $1 AND user_id = $2::uuid', [id, userId]);
    
    if (existingContract.rows.length === 0) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }
    
    // Eliminazione del contratto (sintassi PostgreSQL)
    await pool.query('DELETE FROM contracts WHERE id = $1 AND user_id = $2::uuid', [id, userId]);
    
    res.json({ message: 'Contratto eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione del contratto:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione del contratto' });
  }
}; 