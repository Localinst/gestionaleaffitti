import { Request, Response } from 'express';
import pool, { executeQuery } from '../db';

// Interfaccia per la richiesta autenticata
type AuthRequest = Request & {
  user?: {
    id?: string; // L'ID utente dal token (UUID)
  };
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id; // UUID

  if (!userId) {
    return res.status(401).json({ error: 'Utente non autenticato' });
  }

  try {
    console.log('Recupero transazioni per user_id (UUID):', userId);
    // La query ora usa LEFT JOIN e filtra solo su t.user_id
    const query = `
      SELECT t.*, p.name AS property_name
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id -- LEFT JOIN per gestire property_id NULL
      WHERE t.user_id = $1::uuid -- Filtra per user_id (UUID) della transazione
      ORDER BY t.date DESC
    `;

    console.log('Query getTransactions eseguita:', query);

    const result = await executeQuery(async (client) => {
      return client.query(query, [userId]);
    });

    console.log('Numero di transazioni trovate:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero delle transazioni:', error);
    res.status(500).json({ error: 'Errore nel recupero delle transazioni' });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id; // UUID
  const { id } = req.params; // transaction ID (UUID)

  if (!userId) {
    return res.status(401).json({ error: 'Utente non autenticato' });
  }

  try {
    // La query ora filtra su t.id e t.user_id
    const query = `
      SELECT t.*, p.name as property_name
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id -- LEFT JOIN per gestire property_id NULL
      WHERE t.id = $1::uuid AND t.user_id = $2::uuid -- Filtra per ID transazione e ID utente
    `;
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transazione non trovata o non accessibile' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nel recupero della transazione:', error);
    res.status(500).json({ error: 'Errore nel recupero della transazione' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  // LOG AGGIUNTIVO ALL'INGRESSO
  console.log('>>> Entrato in createTransaction controller'); 
  
  const userId = req.user?.id; // UUID

  if (!userId) {
    return res.status(401).json({ error: 'Utente non autenticato' });
  }

  try {
    const {
      date,
      amount,
      type,
      category,
      description,
      property_id, // Può essere null o un UUID valido
      tenant_id    // Può essere null o un UUID valido
    } = req.body;

    // Validazione base - Rimosso controllo per category
    if (!date || amount === undefined || amount === null || !type) { 
        return res.status(400).json({ error: 'Campi date, amount, type sono obbligatori' });
    }

    console.log("Creazione transazione con dati:", {
      date, amount, type, category, description, // category può essere undefined ora
      property_id: property_id || null, 
      tenant_id: tenant_id || null      
    });

    // Rimosso il controllo sull'esistenza della proprietà
    // const propertyCheck = await pool.query(...)

    // Se tenant_id è una stringa vuota o "none", impostiamo a null (anche se il || null sopra dovrebbe già bastare)
    const finalTenantId = tenant_id && tenant_id !== "none" && tenant_id !== "" ? tenant_id : null;
    const finalPropertyId = property_id && property_id !== "none" && property_id !== "" ? property_id : null;

    console.log("ID finale per la transazione:", { finalPropertyId, finalTenantId });

    // Procedi con l'inserimento, usando user_id (UUID)
    const result = await pool.query(
      `INSERT INTO transactions (
        date, amount, type, category, description,
        property_id, tenant_id, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6::uuid, $7::uuid, $8::uuid) RETURNING *`,
      [
        date,
        amount,
        type,
        category || null, // Assicura null se category è omesso o non fornito
        description || null, 
        finalPropertyId,     
        finalTenantId,       
        userId               
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Errore nella creazione della transazione:', error);
    let errorMessage = 'Errore sconosciuto nella creazione della transazione';
    let errorCode: string | undefined;

    // Verifica se è un errore standard
    if (error instanceof Error) {
      errorMessage = error.message;
      // Verifica se ha una proprietà 'code'
       if (typeof error === 'object' && error !== null && 'code' in error) {
         errorCode = (error as any).code; 
      }
    }
    
    // Controlla se l'errore è dovuto a una violazione di chiave esterna
    if (errorCode === '23503') { // Usiamo la variabile verificata
         return res.status(400).json({ error: 'ID Proprietà o Inquilino non valido.' });
    }
    res.status(500).json({ error: 'Errore nella creazione della transazione', details: errorMessage });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id; // UUID
  const { id } = req.params; // transaction ID (UUID)

  if (!userId) {
    return res.status(401).json({ error: 'Utente non autenticato' });
  }

  try {
    const {
      date,
      amount,
      type,
      category,
      description,
      property_id, // Può essere null o UUID
      tenant_id    // Può essere null o UUID
    } = req.body;

     // Validazione base
     if (!date || amount === undefined || amount === null || !type || !category) {
      return res.status(400).json({ error: 'Campi date, amount, type, category sono obbligatori' });
    }

    // Verifica che la transazione esista e appartenga all'utente usando t.user_id
    const transactionCheck = await pool.query(`
      SELECT t.id
      FROM transactions t
      WHERE t.id = $1::uuid AND t.user_id = $2::uuid
    `, [id, userId]);

    if (transactionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Transazione non trovata o non accessibile' });
    }

    // Rimosso il controllo sull'esistenza della nuova proprietà

    const finalTenantId = tenant_id && tenant_id !== "none" && tenant_id !== "" ? tenant_id : null;
    const finalPropertyId = property_id && property_id !== "none" && property_id !== "" ? property_id : null;

    const result = await pool.query(
      `UPDATE transactions SET
        date = $1, amount = $2, type = $3, category = $4,
        description = $5, property_id = $6::uuid, tenant_id = $7::uuid,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8::uuid AND user_id = $9::uuid RETURNING *`,
      [
        date, amount, type, category, description || null,
        finalPropertyId, // UUID o null
        finalTenantId,   // UUID o null
        id,              // transaction ID (UUID)
        userId           // user ID (UUID)
      ]
    );

     if (result.rows.length === 0) {
      // Questo non dovrebbe accadere se il check iniziale ha funzionato, ma per sicurezza
      return res.status(404).json({ error: 'Aggiornamento fallito, transazione non trovata.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Errore nell'aggiornamento della transazione:", error);
    let errorMessage = "Errore sconosciuto nell'aggiornamento della transazione";
    let errorCode: string | undefined;

    // Verifica se è un errore standard
    if (error instanceof Error) {
      errorMessage = error.message;
      // Verifica se ha una proprietà 'code'
       if (typeof error === 'object' && error !== null && 'code' in error) {
         errorCode = (error as any).code; 
      }
    }

     if (errorCode === '23503') { // Usiamo la variabile verificata
      return res.status(400).json({ error: "ID Proprietà o Inquilino fornito non valido." });
    }
    res.status(500).json({ error: "Errore nell'aggiornamento della transazione", details: errorMessage });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id; // UUID
  const { id } = req.params; // transaction ID (UUID)

  if (!userId) {
    return res.status(401).json({ error: 'Utente non autenticato' });
  }

  try {
    // Verifica che la transazione esista e appartenga all'utente usando t.user_id
    // Esegui direttamente DELETE con clausola WHERE per id e user_id
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1::uuid AND user_id = $2::uuid RETURNING id',
      [id, userId]
    );

    // Controlla se una riga è stata effettivamente eliminata
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Transazione non trovata o non accessibile" });
    }

    res.json({ message: "Transazione eliminata con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione della transazione:", error);
    res.status(500).json({ error: "Errore nell'eliminazione della transazione" });
  }
}; 