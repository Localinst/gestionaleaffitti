import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express';
import pool from '../db';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import PdfTable from 'pdfkit-table';

const router = Router();

// Applico il middleware di autenticazione a tutte le rotte
router.use(authenticate);

// Endpoint per ottenere i dati finanziari
router.get('/financial', async (req: Request, res: Response) => {
  const client = await pool.connect();
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
    
    // Aggiungiamo un timeout alla query (30 secondi)
    const result = await client.query({
      text: query,
      values: queryParams,
      rowMode: 'array', // Ottimizza per minore utilizzo di memoria
      timeout: 30000 // 30 secondi timeout
    } as any);
    
    console.log(`Query finanziaria completata con ${result.rows.length} risultati`);
    
    // Formatta i dati per il frontend
    const formattedData = result.rows.map((row: any) => {
      const dateObj = new Date(row[0]);
      const monthName = dateObj.toLocaleDateString('it-IT', { month: 'short' });
      const year = dateObj.getFullYear();
      
      // Crea una chiave di ordinamento nel formato YYYY-MM
      const sortKey = `${year}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      return {
        date: monthName,
        month: dateObj.getMonth(),
        year: year,
        income: parseFloat(row[1]) || 0,
        expenses: parseFloat(row[2]) || 0,
        net: parseFloat(row[1] || 0) - parseFloat(row[2] || 0),
        sortKey
      };
    });
    
    res.json(formattedData);
  } catch (error) {
    console.error('Errore nel recupero dei dati finanziari:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero dei dati finanziari',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  } finally {
    // Assicuriamoci di rilasciare sempre il client al pool
    try {
      if (client) {
        client.release();
        console.log('Client rilasciato al pool in /financial');
      }
    } catch (releaseError) {
      console.error('Errore nel rilascio del client:', releaseError);
    }
  }
});

// Endpoint per ottenere i dati di sommario
router.get('/summary', async (req: Request, res: Response) => {
  const client = await pool.connect();
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
    
    const propertyResult = await client.query(propertyQuery, queryParams);
    
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
    
    const tenantResult = await client.query(tenantQuery, queryParams);
    
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
    
    const financialResult = await client.query(financialQuery, queryParams);
    
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
    
    const rentResult = await client.query(rentQuery, queryParams);
    
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
  } catch (error) {
    console.error('Errore durante il recupero dei dati di riepilogo:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero dei dati di riepilogo',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  } finally {
    // Assicuriamoci di rilasciare sempre il client al pool
    try {
      if (client) {
        client.release();
        console.log('Client rilasciato al pool in /summary');
      }
    } catch (releaseError) {
      console.error('Errore nel rilascio del client:', releaseError);
    }
  }
});

// Endpoint per ottenere i dati delle proprietà
router.get('/properties', async (req: Request, res: Response) => {
  const client = await pool.connect();
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
    
    const propertiesResult = await client.query(propertiesQuery, queryParams);
    
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
      
      const financialResult = await client.query(financialQuery, financialParams);
      
      // Query per contare gli inquilini
      const tenantQuery = `
        SELECT COUNT(*) as tenant_count
        FROM tenants
        WHERE property_id = $1
      `;
      
      const tenantResult = await client.query(tenantQuery, [property.id]);
      
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
  } catch (error) {
    console.error('Errore durante il recupero dei dati delle proprietà:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero dei dati delle proprietà',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  } finally {
    // Assicuriamoci di rilasciare sempre il client al pool
    try {
      if (client) {
        client.release();
        console.log('Client rilasciato al pool in /properties');
      }
    } catch (releaseError) {
      console.error('Errore nel rilascio del client:', releaseError);
    }
  }
});

// Endpoint per esportare i report
router.get('/export/:format', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    // Parametri dalla query e dal path
    const { format } = req.params;
    const { startDate, endDate, propertyId } = req.query;
    const userId = req.user?.id;
    
    // Log per debug
    console.log(`Richiesta esportazione report in formato ${format} con parametri:`, { startDate, endDate, propertyId, userId });
    
    // Query per recuperare le transazioni per l'esportazione
    let query = `
      SELECT 
        t.date,
        CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END AS income,
        CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END AS expense,
        t.description,
        p.name AS property_name
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
    
    query += ` ORDER BY t.date DESC`;
    
    // Esegui la query
    const result = await client.query(query, queryParams);
    
    // Formatta i dati per l'esportazione
    const dateRange = `${startDate || 'inizio'} - ${endDate || 'oggi'}`;
    
    if (format === 'csv') {
      // Intestazioni richieste: "Data | Entrate | Uscite | Note | Proprietà"
      let fileContent = `Data,Entrate,Uscite,Note,Proprietà\n`;
      
      // Aggiungi righe di dati
      for (const row of result.rows) {
        const date = new Date(row.date).toLocaleDateString('it-IT');
        const income = parseFloat(row.income) || 0;
        const expense = parseFloat(row.expense) || 0;
        // Assicurati che le descrizioni con virgole siano racchiuse tra virgolette
        const description = row.description ? `"${row.description.replace(/"/g, '""')}"` : '';
        const propertyName = row.property_name ? `"${row.property_name.replace(/"/g, '""')}"` : '';
        
        fileContent += `${date},${income},${expense},${description},${propertyName}\n`;
      }
      
      // Crea un buffer dal contenuto
      const fileBuffer = Buffer.from(fileContent, 'utf-8');
      
      // Imposta gli header per il download
      res.setHeader('Content-Type', getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="report_${new Date().toISOString().split('T')[0]}.${format}"`);
      
      // Invia il file
      res.send(fileBuffer);
    } else if (format === 'xlsx') {
      // Creazione file Excel con ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Gestionale Affitti';
      workbook.lastModifiedBy = 'Sistema';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Aggiungi un foglio di lavoro
      const worksheet = workbook.addWorksheet('Report Finanziario');
      
      // Definisci le colonne (intestazioni richieste: "Data | Entrate | Uscite | Note | Proprietà")
      worksheet.columns = [
        { header: 'Data', key: 'date', width: 15 },
        { header: 'Entrate', key: 'income', width: 15 },
        { header: 'Uscite', key: 'expense', width: 15 },
        { header: 'Note', key: 'notes', width: 30 },
        { header: 'Proprietà', key: 'property', width: 20 }
      ];
      
      // Stile per l'intestazione
      worksheet.getRow(1).font = { bold: true };
      
      // Aggiungi le righe di dati
      for (const row of result.rows) {
        worksheet.addRow([
          new Date(row.date).toLocaleDateString('it-IT'),
          parseFloat(row.income) || 0,
          parseFloat(row.expense) || 0,
          row.description || '',
          row.property_name || ''
        ]);
      }
      
      // Formatta le colonne numeriche
      worksheet.getColumn('income').numFmt = '€#,##0.00';
      worksheet.getColumn('expense').numFmt = '€#,##0.00';
      
      // Genera il file Excel in memoria
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Imposta gli header per il download
      res.setHeader('Content-Type', getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="report_${new Date().toISOString().split('T')[0]}.xlsx"`);
      
      // Invia il buffer come risposta
      res.send(buffer);
    } else if (format === 'pdf') {
      // Implementazione della generazione PDF con PDFKit
      try {
        // Creiamo un documento PDF
        const doc = new PDFDocument({ 
          margin: 30, 
          size: 'A4',
          bufferPages: true // Necessario per contare le pagine
        });

        // Array per memorizzare i chunk del PDF
        const chunks: Buffer[] = [];
        
        // Cattura i chunk di dati
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        
        // Promessa che si risolve quando il PDF è completo
        const pdfCompleted = new Promise<Buffer>((resolve, reject) => {
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            resolve(pdfBuffer);
          });
          
          doc.on('error', reject);
        });
        
        // Intestazione del documento
        doc.font('Helvetica-Bold')
           .fontSize(16)
           .text('Report Finanziario', { align: 'center' });
        
        doc.moveDown();
        
        // Intestazione secondaria con informazioni sul periodo
        doc.fontSize(12)
           .text(`Periodo: ${startDate ? new Date(startDate as string).toLocaleDateString('it-IT') : 'inizio'} - ${endDate ? new Date(endDate as string).toLocaleDateString('it-IT') : 'oggi'}`, { align: 'center' });

        doc.moveDown();
        
        // Creiamo una tabella manualmente
        // Definiamo le dimensioni della tabella
        const tableTop = 150;
        const colWidths = [80, 80, 80, 160, 120];
        const rowHeight = 30;
        const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
        const tableLeft = (doc.page.width - tableWidth) / 2;
        
        // Intestazioni colonne
        const headers = ['Data', 'Entrate', 'Uscite', 'Note', 'Proprietà'];
        
        // Funzione per disegnare una riga della tabella
        function drawTableRow(y: number, items: string[], isHeader = false) {
          let x = tableLeft;
          
          // Disegna prima il bordo completo della riga
          doc.strokeColor('#000000')
             .lineWidth(0.5)
             .rect(tableLeft, y, tableWidth, rowHeight)
             .stroke();
          
          // Sfondo intestazione
          if (isHeader) {
            doc.fillColor('#f0f0f0')
               .rect(tableLeft, y, tableWidth, rowHeight)
               .fill();
            
            // Ridisegna i bordi dopo il riempimento
            doc.strokeColor('#000000')
               .lineWidth(0.5)
               .rect(tableLeft, y, tableWidth, rowHeight)
               .stroke();
          }
          
          // Testo
          doc.fillColor('#000000');
          
          // Font in base al tipo di riga
          if (isHeader) {
            doc.font('Helvetica-Bold').fontSize(10);
          } else {
            doc.font('Helvetica').fontSize(10);
          }
          
          // Inserimento testo nelle celle
          for (let i = 0; i < items.length; i++) {
            // Calcola la posizione corretta della x per questa colonna
            const cellX = x;
            
            // Centratura verticale del testo
            const textOptions = {
              width: colWidths[i] - 10, // Riduci larghezza per padding
              align: i === 0 ? 'left' as const : i <= 2 ? 'right' as const : 'left' as const
            };
            
            // Massima lunghezza del testo nelle colonne note e proprietà
            let text = items[i];
            if (i >= 3 && text.length > 25) {
              text = text.substring(0, 22) + '...';
            }
            
            doc.text(
              text,
              cellX + 5, // Padding sinistro
              y + (rowHeight - doc.currentLineHeight()) / 2, // Centratura verticale precisa
              textOptions
            );
            
            // Bordi verticali interni (eccetto l'ultimo)
            if (i < items.length - 1) {
              doc.strokeColor('#000000')
                 .lineWidth(0.5)
                 .moveTo(x + colWidths[i], y)
                 .lineTo(x + colWidths[i], y + rowHeight)
                 .stroke();
            }
            
            x += colWidths[i];
          }
        }
        
        // Disegna le intestazioni
        drawTableRow(tableTop, headers, true);
        
        // Disegna i dati
        let y = tableTop + rowHeight;
        const maxRowsPerPage = Math.floor((doc.page.height - y - 50) / rowHeight);
        let rowCount = 0;
        
        for (const row of result.rows) {
          // Controllo se serve una nuova pagina
          if (rowCount >= maxRowsPerPage) {
            doc.addPage();
            // Ridisegna l'intestazione nella nuova pagina
            y = 50; // Margine superiore della nuova pagina
            drawTableRow(y, headers, true);
            y += rowHeight;
            rowCount = 0;
          }
          
          const date = new Date(row.date).toLocaleDateString('it-IT');
          const income = (parseFloat(row.income) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
          const expense = (parseFloat(row.expense) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
          const description = row.description || '';
          const propertyName = row.property_name || '';
          
          drawTableRow(y, [date, income, expense, description, propertyName]);
          
          y += rowHeight;
          rowCount++;
        }
        
        // Aggiungi il piè di pagina con la numerazione delle pagine
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8)
             .text(
               `Pagina ${i + 1} di ${pageCount}`, 
               30, 
               doc.page.height - 30, 
               { align: 'center' }
             );
        }
        
        // Finalizza il documento
        doc.end();
        
        // Attendi il completamento del PDF
        const pdfBuffer = await pdfCompleted;
        
        // Imposta gli header appropriati per il download del PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report_${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Transfer-Encoding', 'binary');
        
        // Invia il buffer come risposta
        res.send(pdfBuffer);
      } catch (pdfError) {
        console.error('Errore nella generazione del PDF:', pdfError);
        res.status(500).json({ 
          error: 'Errore durante la generazione del PDF',
          details: process.env.NODE_ENV === 'development' ? (pdfError as any).message : undefined
        });
      }
    } else {
      // Per altri formati, restituisci un errore
      res.status(400).json({ error: `Formato ${format} non supportato attualmente` });
    }
  } catch (error) {
    console.error(`Errore durante l'esportazione del report:`, error);
    res.status(500).json({ 
      error: 'Errore durante l\'esportazione del report',
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    });
  } finally {
    // Assicuriamoci di rilasciare sempre il client al pool
    try {
      if (client) {
        client.release();
        console.log('Client rilasciato al pool in /export/:format');
      }
    } catch (releaseError) {
      console.error('Errore nel rilascio del client:', releaseError);
    }
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