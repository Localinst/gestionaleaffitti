import { Request, Response } from 'express';
import { executeQuery } from '../db';

export const getAdminSessions = async (req: Request, res: Response) => {
  try {
    // Recupera le ultime 50 sessioni con user_id non nullo
    const sessionsResult = await executeQuery(async (client) => {
      return client.query(`
        SELECT s.id, s.user_id, u.email, s.start_time, s.end_time, s.page_views
        FROM sessions s
        LEFT JOIN auth.users u ON s.user_id = u.id
        WHERE s.user_id IS NOT NULL
        ORDER BY s.start_time DESC
        LIMIT 50
      `);
    });
    const sessions = sessionsResult.rows;

    // Per ogni sessione, recupera le route visitate
    for (const session of sessions) {
      const pageViewsResult = await executeQuery(async (client) => {
        return client.query(
          `SELECT path FROM page_views WHERE session_id = $1 ORDER BY timestamp ASC`,
          [session.id]
        );
      });
      session.routes = pageViewsResult.rows.map((row: any) => row.path);
    }

    res.json(sessions);
  } catch (error) {
    console.error('Errore nel recupero delle sessioni admin:', error);
    res.status(500).json({ error: 'Errore nel recupero delle sessioni' });
  }
}; 