import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db';
import { executeQuery } from '../db';

// Definizione dell'interfaccia AuthRequest per i controller che necessitano di autenticazione
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Registra una visualizzazione di pagina
export const trackPageView = async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      userId,
      path,
      referrer,
      userAgent,
      deviceType,
      browser,
      country,
      ipAddress,
    } = req.body;

    // Ottieni l'IP client se non fornito
    const clientIp = ipAddress || req.ip || req.socket.remoteAddress || '';

    await executeQuery(async (client) => {
      // Inserisci visualizzazione pagina
      await client.query(
        `INSERT INTO page_views 
        (session_id, user_id, path, referrer, user_agent, device_type, browser, country, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [sessionId, userId || null, path, referrer, userAgent, deviceType, browser, country, clientIp]
      );

      // Aggiorna la sessione esistente o creane una nuova
      const sessionResult = await client.query(
        `SELECT * FROM sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length > 0) {
        // Aggiorna sessione esistente
        const session = sessionResult.rows[0];
        const pageViews = (session.page_views || 0) + 1;
        const now = new Date();
        const lastActivity = new Date(session.last_activity);
        const durationSeconds = Math.floor((now.getTime() - lastActivity.getTime()) / 1000);

        await client.query(
          `UPDATE sessions 
          SET last_activity = NOW(), 
              page_views = $1, 
              duration = duration + $2,
              is_bounce = FALSE
          WHERE id = $3`,
          [pageViews, durationSeconds, sessionId]
        );
      } else {
        // Crea nuova sessione
        await client.query(
          `INSERT INTO sessions 
          (id, user_id, device_type, browser, operating_system, screen_width, screen_height, user_agent, referrer, country, ip_address) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            sessionId, 
            userId || null, 
            deviceType, 
            browser, 
            req.body.operatingSystem,
            req.body.screenWidth || 0,
            req.body.screenHeight || 0,
            userAgent,
            referrer,
            country,
            clientIp
          ]
        );
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Errore nel tracking della visualizzazione pagina:', error);
    res.status(500).json({ error: 'Errore nel salvare i dati di analytics' });
  }
};

// Registra una conversione
export const trackConversion = async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      userId,
      conversionType,
      value,
      path,
      details
    } = req.body;

    await executeQuery(async (client) => {
      await client.query(
        `INSERT INTO conversions 
        (session_id, user_id, conversion_type, value, path, details) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, userId || null, conversionType, value || 0, path, details ? JSON.stringify(details) : null]
      );
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Errore nel tracking della conversione:', error);
    res.status(500).json({ error: 'Errore nel salvare i dati di conversione' });
  }
};

// Ottieni statistiche analytics per dashboard
export const getAnalyticsStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { timeRange = '7d' } = req.query;
    
    // Calcola la data di inizio in base al timeRange
    let startDate = new Date();
    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const startDateStr = startDate.toISOString();

    const stats = await executeQuery(async (client) => {
      // Statistiche di base
      const basicStatsQuery = `
        SELECT 
          COUNT(DISTINCT pv.session_id) as visitors,
          COUNT(*) as total_page_views,
          COALESCE(ROUND(AVG(s.duration)), 0) as avg_session_duration,
          COUNT(DISTINCT CASE WHEN s.is_bounce THEN s.id END) * 100.0 / NULLIF(COUNT(DISTINCT s.id), 0) as bounce_rate
        FROM page_views pv
        LEFT JOIN sessions s ON pv.session_id = s.id
        WHERE pv.timestamp >= $1
      `;
      const basicStats = await client.query(basicStatsQuery, [startDateStr]);
      
      // Visualizzazioni per giorno
      const viewsByDayQuery = `
        SELECT 
          TO_CHAR(DATE_TRUNC('day', pv.timestamp), 'YYYY-MM-DD') as date,
          COUNT(*) as views,
          COUNT(DISTINCT pv.session_id) as unique_visitors,
          COUNT(DISTINCT s.id) as sessions
        FROM page_views pv
        LEFT JOIN sessions s ON pv.session_id = s.id
        WHERE pv.timestamp >= $1
        GROUP BY DATE_TRUNC('day', pv.timestamp)
        ORDER BY DATE_TRUNC('day', pv.timestamp)
      `;
      const viewsByDay = await client.query(viewsByDayQuery, [startDateStr]);
      
      // Pagine più visitate
      const topPagesQuery = `
        SELECT 
          path as name, 
          COUNT(*) as views,
          COALESCE(ROUND(AVG(s.duration))::TEXT || 's', '0s') as avg_time
        FROM page_views pv
        LEFT JOIN sessions s ON pv.session_id = s.id
        WHERE pv.timestamp >= $1
        GROUP BY path
        ORDER BY COUNT(*) DESC
        LIMIT 5
      `;
      const topPages = await client.query(topPagesQuery, [startDateStr]);
      
      // Dispositivi
      const devicesQuery = `
        SELECT 
          device_type as name, 
          COUNT(*) as value
        FROM sessions
        WHERE start_time >= $1
        GROUP BY device_type
        ORDER BY COUNT(*) DESC
      `;
      const devices = await client.query(devicesQuery, [startDateStr]);
      
      // Browser
      const browsersQuery = `
        SELECT 
          browser as name, 
          COUNT(*) as value
        FROM sessions
        WHERE start_time >= $1
        GROUP BY browser
        ORDER BY COUNT(*) DESC
      `;
      const browsers = await client.query(browsersQuery, [startDateStr]);
      
      // Paesi
      const countriesQuery = `
        SELECT 
          COALESCE(country, 'Sconosciuto') as name, 
          COUNT(*) as value
        FROM sessions
        WHERE start_time >= $1
        GROUP BY country
        ORDER BY COUNT(*) DESC
        LIMIT 10
      `;
      const countries = await client.query(countriesQuery, [startDateStr]);
      
      // Conversioni
      const conversionsQuery = `
        SELECT 
          conversion_type as name,
          COUNT(*) as completato,
          0 as abbandonato
        FROM conversions
        WHERE timestamp >= $1
        GROUP BY conversion_type
      `;
      const conversions = await client.query(conversionsQuery, [startDateStr]);
      
      return {
        pageViews: viewsByDay.rows,
        visitors: parseInt(basicStats.rows[0]?.visitors || '0'),
        totalViews: parseInt(basicStats.rows[0]?.total_page_views || '0'),
        totalSessions: parseInt(basicStats.rows[0]?.visitors || '0'),
        averageSessionDuration: parseInt(basicStats.rows[0]?.avg_session_duration || '0'),
        bounceRate: Math.round(parseFloat(basicStats.rows[0]?.bounce_rate || '0')),
        topPages: topPages.rows,
        devices: devices.rows,
        browsers: browsers.rows,
        geoData: countries.rows,
        conversions: conversions.rows,
      };
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error('Errore nel recupero delle statistiche analytics:', error);
    res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
  }
}; 