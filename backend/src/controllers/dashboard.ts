import { Request, Response } from 'express';
import pool, { executeQuery } from '../db';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // Controlla se l'utente è autenticato
    if (!req.user) {
      console.error("Utente non autenticato");
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

    try {
      // Get total properties with user filter using the wrapper
      const propertiesResult = await executeQuery(async (client) => {
        return client.query(
          'SELECT COUNT(*) as total FROM properties WHERE user_id = $1',
          [userId]
        );
      });
      results.data.totalProperties = parseInt(propertiesResult.rows[0]?.total) || 0;
      console.log("Total properties:", results.data.totalProperties);
    } catch (err: any) {
      console.error("Errore nella query delle proprietà:", err);
      results.errors.push({ query: 'properties', error: err.message });
    }

    try {
      // Get total units with user filter using the wrapper
      const unitsResult = await executeQuery(async (client) => {
        return client.query(
          'SELECT SUM(units) as total FROM properties WHERE user_id = $1',
          [userId]
        );
      });
      results.data.totalUnits = parseInt(unitsResult.rows[0]?.total) || 0;
      console.log("Total units:", results.data.totalUnits);
    } catch (err: any) {
      console.error("Errore nella query delle unità:", err);
      results.errors.push({ query: 'units', error: err.message });
    }

    try {
      // Get total tenants with user filter (via properties)
      const tenantsResult = await executeQuery(async (client) => {
        return client.query(
          `SELECT COUNT(*) as total 
           FROM tenants t
           JOIN properties p ON t.property_id = p.id
           WHERE p.user_id = $1`,
          [userId]
        );
      });
      results.data.totalTenants = parseInt(tenantsResult.rows[0]?.total) || 0;
      console.log("Total tenants:", results.data.totalTenants);
    } catch (err: any) {
      console.error("Errore nella query dei tenant:", err);
      results.errors.push({ query: 'tenants', error: err.message });
    }

    // Calculate occupancy rate (avoid division by zero)
    const totalUnits = results.data.totalUnits || 0;
    const totalTenants = results.data.totalTenants || 0;
    
    results.data.occupancyRate = totalUnits > 0 
      ? ((totalTenants / totalUnits) * 100).toFixed(1) 
      : "0.0";
    console.log("Occupancy rate:", results.data.occupancyRate);

    try {
      // Ottieni il mese corrente in modo che PostgreSQL lo interpreti correttamente
      const currentMonth = new Date();
      const incomeResult = await executeQuery(async (client) => {
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
      results.data.rentIncome = parseFloat(incomeResult.rows[0]?.total || '0');
      console.log("Rent income:", results.data.rentIncome);
    } catch (err: any) {
      console.error("Errore nella query del reddito:", err);
      results.errors.push({ query: 'income', error: err.message });
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
      debug: {
        userId,
        userIdType: typeof userId,
        errors: results.errors,
        success: results.success,
        timestamp: new Date().toISOString()
      }
    };

    res.json(summaryData);
  } catch (error: any) {
    console.error("Error retrieving dashboard summary:", error);
    res.status(500).json({ 
      error: 'Error retrieving dashboard summary',
      message: error.message
    });
  }
}; 