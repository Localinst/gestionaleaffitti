import { Request, Response } from 'express';
import pool from '../db/index';
import webpush from 'web-push';

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

// Save push subscription for the current user
export const subscribePush = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const subscription = req.body;
    if (!userId || !subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing subscription or user' });
    }

    // Upsert into push_subscriptions table
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, keys = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, subscription.endpoint, JSON.stringify(subscription.keys || {})]
    );

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Error saving push subscription', error);
    res.status(500).json({ error: 'Error saving subscription' });
  }
};

// Send a test notification to user's subscriptions (for admin or user testing)
export const sendTestNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ error: 'Missing user' });

    const result = await pool.query('SELECT endpoint, keys FROM push_subscriptions WHERE user_id = $1', [userId]);
    const subs = result.rows;

    if (!subs.length) return res.status(404).json({ error: 'No subscriptions' });

    // web-push configuration should be set via env (VAPID_PUBLIC, VAPID_PRIVATE)
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return res.status(500).json({ error: 'VAPID keys not configured' });

    webpush.setVapidDetails('mailto:admin@example.com', publicKey, privateKey);

    const payload = JSON.stringify({ title: 'Test notification', body: 'This is a test push' });

    // Send to all subscriptions (best-effort)
    await Promise.all(subs.map(async (s: any) => {
      try {
        const pushSub = {
          endpoint: s.endpoint,
          keys: s.keys || {}
        };
        await webpush.sendNotification(pushSub, payload);
      } catch (err) {
        console.error('Failed to send push to', s.endpoint, err);
      }
    }));

    res.json({ ok: true });
  } catch (error) {
    console.error('Error sending test notification', error);
    res.status(500).json({ error: 'Error sending notifications' });
  }
};

/* SQL to create table if missing:
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);
*/
