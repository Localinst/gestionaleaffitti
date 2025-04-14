import { Request, Response } from 'express';
import pool, { executeQuery } from '../db';

export const getDashboardSummary = async (req: Request, res: Response) => {
  // Variabile per tenere traccia se la risposta è già stata inviata
  let responseAlreadySent = false;
  
  try {
    // Controlla se l'utente è autenticato
    if (!req.user) {
      console.error("Utente non autenticato");
      responseAlreadySent = true;
      return res.status(401).json({ 
        error: 'Utente non autenticato',
        debug: { headers: req.headers }
      });
    }

    // Stampa info sull'utente
    console.log("User in request:", req.user);
    const userId = req.user.id;
    console.log("User ID:", userId, "Type:", typeof userId);

    // Creo un oggetto per i risultati e errori
    const results: Record<string, any> = {
      success: false,
      errors: [],
      data: {}
    };

    // Funzione di utilità per gestire le query al database in modo sicuro
    const safeQuery = async (queryName: string, queryFn: () => Promise<any>) => {
      try {
        const result = await queryFn();
        return result;
      } catch (err: any) {
        console.error(`Errore nella query ${queryName}:`, err);
        results.errors.push({ query: queryName, error: err.message });
        return null;
      }
    };

    // Ottieni le proprietà
    const propertiesResult = await safeQuery('properties', async () => {
      return executeQuery(async (client) => {
        return client.query(
          'SELECT COUNT(*) as total FROM properties WHERE user_id = $1',
          [userId]
        );
      });
    });
    
    if (propertiesResult) {
      results.data.totalProperties = parseInt(propertiesResult.rows[0]?.total) || 0;
      console.log("Total properties:", results.data.totalProperties);
    }

    // Ottieni le unità
    const unitsResult = await safeQuery('units', async () => {
      return executeQuery(async (client) => {
        return client.query(
          'SELECT SUM(units) as total FROM properties WHERE user_id = $1',
          [userId]
        );
      });
    });
    
    if (unitsResult) {
      results.data.totalUnits = parseInt(unitsResult.rows[0]?.total) || 0;
      console.log("Total units:", results.data.totalUnits);
    }

    // Ottieni i tenants
    const tenantsResult = await safeQuery('tenants', async () => {
      return executeQuery(async (client) => {
        return client.query(
          `SELECT COUNT(*) as total 
           FROM tenants t
           JOIN properties p ON t.property_id = p.id
           WHERE p.user_id = $1`,
          [userId]
        );
      });
    });
    
    if (tenantsResult) {
      results.data.totalTenants = parseInt(tenantsResult.rows[0]?.total) || 0;
      console.log("Total tenants:", results.data.totalTenants);
    }

    // Calculate occupancy rate (avoid division by zero)
    const totalUnits = results.data.totalUnits || 0;
    const totalTenants = results.data.totalTenants || 0;
    
    results.data.occupancyRate = totalUnits > 0 
      ? ((totalTenants / totalUnits) * 100).toFixed(1) 
      : "0.0";
    console.log("Occupancy rate:", results.data.occupancyRate);

    // Ottieni il reddito
    const incomeResult = await safeQuery('income', async () => {
      const currentMonth = new Date();
      return executeQuery(async (client) => {
        return client.query(
          `SELECT COALESCE(SUM(amount), 0) as total 
           FROM transactions t
           JOIN properties p ON t.property_id = p.id
           WHERE t.type = 'income' AND t.category = 'Rent' 
           AND date_trunc('month', t.date) = date_trunc('month', $1::timestamp)
           AND p.user_id = $2`,
          [currentMonth, userId]
        );
      });
    });
    
    if (incomeResult) {
      results.data.rentIncome = parseFloat(incomeResult.rows[0]?.total || '0');
      console.log("Rent income:", results.data.rentIncome);
    }

    // Imposta il flag di successo se almeno alcune query hanno funzionato
    results.success = results.data && Object.keys(results.data).length > 0;
    console.log("Dashboard data:", results);

    // Prepara il riepilogo da restituire al frontend
    const summaryData = {
      totalProperties: results.data.totalProperties || 0,
      totalUnits: results.data.totalUnits || 0, 
      totalTenants: results.data.totalTenants || 0,
      occupancyRate: results.data.occupancyRate || "0.0",
      rentIncome: results.data.rentIncome || 0,
      errors: results.errors.length > 0 ? results.errors : undefined,
      success: results.success
    };

    // Verifica se la risposta è già stata inviata prima di inviarla
    if (!responseAlreadySent) {
      responseAlreadySent = true;
      return res.json(summaryData);
    }
  } catch (error: any) {
    console.error("Error retrieving dashboard summary:", error);
    
    // Verifica se la risposta è già stata inviata prima di inviarla
    if (!responseAlreadySent) {
      responseAlreadySent = true;
      return res.status(500).json({ 
        error: 'Error retrieving dashboard summary',
        message: error.message
      });
    }
  }
}; 