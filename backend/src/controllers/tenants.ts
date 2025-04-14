import { Request, Response } from 'express';
import pool, { executeQuery } from '../db';

export const getTenants = async (req: Request, res: Response) => {
  try {
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Controllo se è specificato un ID proprietà nella query
    const propertyId = req.query.propertyId;
    
    // Se è stato fornito un ID proprietà, richiama la funzione specifica
    if (propertyId) {
      return getTenantsByProperty(req, res);
    }
    
    // Query con join a properties e filtro user_id in properties
    const result = await executeQuery(async (client) => {
      return client.query(`
        SELECT t.*, p.name as property_name 
        FROM tenants t 
        JOIN properties p ON t.property_id = p.id 
        WHERE p.user_id = $1
        ORDER BY t.created_at DESC
      `, [userId]);
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Errore nel recupero degli inquilini:', error);
    res.status(500).json({ error: 'Error retrieving tenants' });
  }
};

export const getTenantsByProperty = async (req: Request, res: Response) => {
  try {
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    const propertyId = req.query.propertyId as string;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }
    
    // Validazione UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(propertyId)) {
      console.error(`ID proprietà non valido: ${propertyId}`);
      return res.status(400).json({ error: 'Invalid property ID format. Expected UUID format.' });
    }
    
    // Verifica che la proprietà appartenga all'utente
    console.log("Cerco proprietà con ID:", propertyId, "di tipo:", typeof propertyId);
    const propertyCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
        [propertyId, userId]
      );
    });
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Property not found or not owned by user' });
    }
    
    // Query per ottenere gli inquilini della proprietà specificata
    console.log("Cerco inquilini per proprietà ID:", propertyId);
    const result = await executeQuery(async (client) => {
      return client.query(`
        SELECT 
          t.id, 
          t.name, 
          t.email, 
          t.phone, 
          t.lease_start, 
          t.lease_end, 
          t.rent, 
          t.property_id,
          p.name as property_name 
        FROM tenants t 
        JOIN properties p ON t.property_id = p.id 
        WHERE p.id = $1 AND p.user_id = $2
        ORDER BY t.name ASC
      `, [propertyId, userId]);
    });
    
    console.log("Inquilini trovati:", result.rows.length);
    
    // Verifica e formatta ogni inquilino
    const formattedTenants = result.rows.map((tenant: any) => {
      return {
        ...tenant,
        id: tenant.id || 0, // Assicura che l'ID sia sempre presente
        name: tenant.name || `Inquilino #${tenant.id}` // Assicura che il nome sia sempre presente
      };
    });
    
    // Debug dei primi inquilini per vedere i dati
    if (formattedTenants.length > 0) {
      console.log("Primo inquilino:", {
        id: formattedTenants[0].id,
        name: formattedTenants[0].name,
        property_id: formattedTenants[0].property_id
      });
    }
    
    res.json(formattedTenants);
  } catch (error) {
    console.error('Errore nel recupero degli inquilini per proprietà:', error);
    res.status(500).json({ error: 'Error retrieving tenants for property' });
  }
};

export const getTenantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Query con join a properties e filtro user_id in properties
    const result = await executeQuery(async (client) => {
      return client.query(`
        SELECT t.*
        FROM tenants t
        JOIN properties p ON t.property_id = p.id
        WHERE t.id = $1 AND p.user_id = $2
      `, [id, userId]);
    });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nel recupero dell\'inquilino:', error);
    res.status(500).json({ error: 'Error retrieving tenant' });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      property_id, 
      unit = "EMPTY",  // Valore di default aggiornato a "EMPTY"
      status = "active"  // Valore di default se non specificato
    } = req.body;
    
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Verifica che la proprietà appartenga all'utente
    const propertyCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
        [property_id, userId]
      );
    });
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Property not found or not owned by user' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(
        `INSERT INTO tenants (
          name, email, phone, property_id, unit, status, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, email, phone, property_id, unit, status, userId]
      );
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Errore nella creazione dell\'inquilino:', error);
    res.status(500).json({ error: 'Error creating tenant' });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      phone, 
      lease_start, 
      lease_end, 
      rent, 
      property_id, 
      unit, 
      status 
    } = req.body;
    
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Verifica che l'inquilino appartenga all'utente
    const tenantCheck = await executeQuery(async (client) => {
      return client.query(`
        SELECT t.id
        FROM tenants t
        JOIN properties p ON t.property_id = p.id
        WHERE t.id = $1 AND p.user_id = $2
      `, [id, userId]);
    });
    
    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found or not accessible' });
    }
    
    // Verifica che la nuova proprietà appartenga all'utente
    const propertyCheck = await executeQuery(async (client) => {
      return client.query(
        'SELECT id FROM properties WHERE id = $1 AND user_id = $2',
        [property_id, userId]
      );
    });
    
    if (propertyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Property not found or not owned by user' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query(
        `UPDATE tenants SET 
          name = $1, email = $2, phone = $3, lease_start = $4, 
          lease_end = $5, rent = $6, property_id = $7, unit = $8, 
          status = $9, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $10 RETURNING *`,
        [name, email, phone, lease_start, lease_end, rent, property_id, unit, status, id]
      );
    });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'inquilino:', error);
    res.status(500).json({ error: 'Error updating tenant' });
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Ottengo l'user_id dall'utente autenticato
    const userId = req.user?.id;
    
    // Verifica che l'inquilino appartenga all'utente
    const tenantCheck = await executeQuery(async (client) => {
      return client.query(`
        SELECT t.id
        FROM tenants t
        JOIN properties p ON t.property_id = p.id
        WHERE t.id = $1 AND p.user_id = $2
      `, [id, userId]);
    });
    
    if (tenantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found or not accessible' });
    }
    
    const result = await executeQuery(async (client) => {
      return client.query('DELETE FROM tenants WHERE id = $1 RETURNING *', [id]);
    });
    
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'inquilino:', error);
    res.status(500).json({ error: 'Error deleting tenant' });
  }
}; 