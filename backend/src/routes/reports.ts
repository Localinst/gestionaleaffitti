import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';
import pool from '../db';

const router = Router();

// Applico il middleware di autenticazione a tutte le rotte
router.use(authenticate);

// Endpoint per ottenere i dati finanziari
router.get('/financial', async (req: Request, res: Response) => {
  try {
    // Parametri dalla query
    const { startDate, endDate, propertyId } = req.query;
    const userId = req.user?.id;
    
    // Log per debug
    console.log('Richiesta dati finanziari con parametri:', { startDate, endDate, propertyId, userId });
    
    // Query per recuperare i dati finanziari dal database
    let query = `
      SELECT 
        DATE_TRUNC('month', t.date) AS date_month,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS income,
        SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expenses
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      WHERE p.user_id = $1
    `;
    
    const queryParams: any[] = [userId];
    let paramIndex = 2;
    
    // Aggiungi filtri se forniti
    if (startDate) {
      query += ` AND t.date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND t.date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    if (propertyId && propertyId !== 'all') {
      query += ` AND p.id = $${paramIndex}`;
      queryParams.push(propertyId);
    }
    
    query += `
      GROUP BY date_month
      ORDER BY date_month ASC
    `;
    
    console.log('Esecuzione query finanziaria:', query);
    console.log('Parametri query:', queryParams);
    
    const result = await pool.query(query, queryParams);
    
    // Formatta i risultati
    const data = result.rows.map(row => {
      const date = new Date(row.date_month);
      const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
      
      return {
        date: `${months[date.getMonth()]} ${date.getFullYear()}`,
        income: parseFloat(row.income) || 0,
        expenses: parseFloat(row.expenses) || 0,
        net: parseFloat(row.income) - parseFloat(row.expenses)
      };
    });
    
    // Invia i dati
    res.json(data);
  } catch (error: any) {
    console.error('Errore durante il recupero dei dati finanziari:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero dei dati finanziari',
      message: error.message 
    });
  }
});

// Endpoint per ottenere i dati di sommario
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Parametri dalla query
    const { startDate, endDate, propertyId } = req.query;
    const userId = req.user?.id;
    
    // Log per debug
    console.log('Richiesta dati di riepilogo con parametri:', { startDate, endDate, propertyId, userId });
    
    // Query per recuperare numero di proprietà e inquilini
    let propertyQuery = `
      SELECT COUNT(*) as property_count, SUM(units) as total_units
      FROM properties 
      WHERE user_id = $1
    `;
    
    let queryParams = [userId];
    let paramIndex = 2;
    
    if (propertyId && propertyId !== 'all') {
      propertyQuery += ` AND id = $${paramIndex}`;
      queryParams.push(propertyId);
      paramIndex++;
    }
    
    const propertyResult = await pool.query(propertyQuery, queryParams);
    
    // Query per contare il numero di inquilini
    let tenantQuery = `
      SELECT COUNT(*) as tenant_count
      FROM tenants t
      JOIN properties p ON t.property_id = p.id
      WHERE p.user_id = $1
    `;
    
    queryParams = [userId];
    paramIndex = 2;
    
    if (propertyId && propertyId !== 'all') {
      tenantQuery += ` AND p.id = $${paramIndex}`;
      queryParams.push(propertyId);
      paramIndex++;
    }
    
    const tenantResult = await pool.query(tenantQuery, queryParams);
    
    // Query per calcolare entrate, uscite e tasso di occupazione
    let financialQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expenses
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      WHERE p.user_id = $1
    `;
    
    queryParams = [userId];
    paramIndex = 2;
    
    if (startDate) {
      financialQuery += ` AND t.date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      financialQuery += ` AND t.date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    if (propertyId && propertyId !== 'all') {
      financialQuery += ` AND p.id = $${paramIndex}`;
      queryParams.push(propertyId);
    }
    
    const financialResult = await pool.query(financialQuery, queryParams);
    
    // Query per calcolare il canone medio
    let rentQuery = `
      SELECT COALESCE(AVG(t.amount), 0) AS avg_rent
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      WHERE p.user_id = $1
      AND t.type = 'income'
      AND t.category = 'Rent'
    `;
    
    queryParams = [userId];
    paramIndex = 2;
    
    if (startDate) {
      rentQuery += ` AND t.date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      rentQuery += ` AND t.date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    if (propertyId && propertyId !== 'all') {
      rentQuery += ` AND p.id = $${paramIndex}`;
      queryParams.push(propertyId);
    }
    
    const rentResult = await pool.query(rentQuery, queryParams);
    
    // Calcola il tasso di occupazione (tenants / total_units)
    const propertyCount = parseInt(propertyResult.rows[0].property_count) || 0;
    const tenantCount = parseInt(tenantResult.rows[0].tenant_count) || 0;
    const totalUnits = parseInt(propertyResult.rows[0].total_units) || 1; // Utilizzo il valore diretto dalle proprietà
    const occupancyRate = Math.min(100, Math.round((tenantCount / totalUnits) * 100)); // Limita a 100%
    
    // Prepara il riepilogo
    const summaryData = {
      totalIncome: parseFloat(financialResult.rows[0].total_income) || 0,
      totalExpenses: parseFloat(financialResult.rows[0].total_expenses) || 0,
      netIncome: (parseFloat(financialResult.rows[0].total_income) || 0) - (parseFloat(financialResult.rows[0].total_expenses) || 0),
      occupancyRate: occupancyRate,
      propertyCount: propertyCount,
      tenantCount: tenantCount,
      avgRent: parseFloat(rentResult.rows[0].avg_rent) || 0
    };
    
    // Invia i dati
    res.json(summaryData);
  } catch (error: any) {
    console.error('Errore durante il recupero dei dati di riepilogo:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero dei dati di riepilogo',
      message: error.message 
    });
  }
});

// Endpoint per ottenere i dati delle proprietà
router.get('/properties', async (req: Request, res: Response) => {
  try {
    // Parametri dalla query
    const { startDate, endDate, propertyId } = req.query;
    const userId = req.user?.id;
    
    // Log per debug
    console.log('Richiesta dati proprietà con parametri:', { startDate, endDate, propertyId, userId });
    
    // Query per ottenere lista delle proprietà
    let propertiesQuery = `
      SELECT 
        id, name, units
      FROM properties
      WHERE user_id = $1
    `;
    
    let queryParams = [userId];
    let paramIndex = 2;
    
    if (propertyId && propertyId !== 'all') {
      propertiesQuery += ` AND id = $${paramIndex}`;
      queryParams.push(propertyId);
    }
    
    const propertiesResult = await pool.query(propertiesQuery, queryParams);
    
    // Preparazione dell'array dei risultati
    const data = [];
    
    // Per ogni proprietà, otteniamo i dati finanziari e di occupazione
    for (const property of propertiesResult.rows) {
      // Query per ottenere i dati finanziari
      let financialQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expenses
        FROM transactions t
        WHERE t.property_id = $1
      `;
      
      const financialParams = [property.id];
      paramIndex = 2;
      
      if (startDate) {
        financialQuery += ` AND t.date >= $${paramIndex}`;
        financialParams.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        financialQuery += ` AND t.date <= $${paramIndex}`;
        financialParams.push(endDate);
      }
      
      const financialResult = await pool.query(financialQuery, financialParams);
      
      // Query per contare gli inquilini
      const tenantQuery = `
        SELECT COUNT(*) as tenant_count
        FROM tenants
        WHERE property_id = $1
      `;
      
      const tenantResult = await pool.query(tenantQuery, [property.id]);
      
      // Calcola il tasso di occupazione
      const tenantCount = parseInt(tenantResult.rows[0].tenant_count) || 0;
      const units = parseInt(property.units) || 1; // Evita divisione per zero
      const occupancyRate = Math.min(100, Math.round((tenantCount / units) * 100)); // Limita a 100%
      
      // Aggiungi i dati della proprietà al risultato
      data.push({
        propertyId: property.id,
        propertyName: property.name,
        income: parseFloat(financialResult.rows[0].income) || 0,
        expenses: parseFloat(financialResult.rows[0].expenses) || 0,
        occupancyRate: occupancyRate
      });
    }
    
    // Ordina per reddito decrescente
    data.sort((a, b) => b.income - a.income);
    
    // Invia i dati
    res.json(data);
  } catch (error: any) {
    console.error('Errore durante il recupero dei dati delle proprietà:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero dei dati delle proprietà',
      message: error.message 
    });
  }
});

// Endpoint per esportare i report
router.get('/export/:format', async (req: Request, res: Response) => {
  try {
    // Parametri dalla query e dal path
    const { format } = req.params;
    const { startDate, endDate, propertyId } = req.query;
    const userId = req.user?.id;
    
    // Log per debug
    console.log(`Richiesta esportazione report in formato ${format} con parametri:`, { startDate, endDate, propertyId, userId });
    
    // Ottieni i dati dalle query precedenti per l'esportazione
    // In un'implementazione reale, questi dati verrebbero formattati in base al formato richiesto (PDF, CSV, XLS)
    
    // Per semplicità, generiamo un file CSV di esempio
    let fileContent = '';
    const dateRange = `${startDate || 'inizio'} - ${endDate || 'oggi'}`;
    
    if (format === 'csv') {
      fileContent = `Report Finanziario, Periodo: ${dateRange}\n`;
      fileContent += `Proprietà: ${propertyId === 'all' ? 'Tutte' : propertyId}\n\n`;
      fileContent += `Data,Tipo,Importo,Descrizione\n`;
      
      // In un'implementazione reale, aggiungeremmo qui i dati reali dalle transazioni
      
      // Crea un buffer dal contenuto
      const fileBuffer = Buffer.from(fileContent, 'utf-8');
      
      // Imposta gli header per il download
      res.setHeader('Content-Type', getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="report_${new Date().toISOString().split('T')[0]}.${format}"`);
      
      // Invia il file
      res.send(fileBuffer);
    } else {
      // Per altri formati, restituisci un errore per ora
      res.status(400).json({ error: `Formato ${format} non supportato attualmente` });
    }
  } catch (error: any) {
    console.error(`Errore durante l'esportazione del report:`, error);
    res.status(500).json({ 
      error: 'Errore durante l\'esportazione del report',
      message: error.message 
    });
  }
});

function getContentType(format: string): string {
  switch (format.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

export { router as reportsRouter }; 