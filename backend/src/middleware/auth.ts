import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Estendi l'interfaccia Request per includere l'utente
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// JWT Secret - ora verifichiamo che sia presente
const JWT_SECRET = process.env.JWT_SECRET;
const IS_DEV = process.env.NODE_ENV !== 'production';

// Verifica che JWT_SECRET sia definito all'avvio dell'applicazione
if (!JWT_SECRET) {
  console.error('ERRORE CRITICO: JWT_SECRET non è definito nelle variabili d\'ambiente.');
  console.error('L\'applicazione non può avviarsi in modo sicuro. Imposta JWT_SECRET e riavvia.');
  process.exit(1); // Uscita con errore per evitare avvii insicuri
}

const supabaseClient = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
    }
  }
);

// Costanti per Lemon Squeezy API
const API_URL = process.env.LEMON_SQUEEZY_API_URL || 'https://api.lemonsqueezy.com/v1';
const API_KEY = process.env.LEMON_SQUEEZY_API_KEY;

/**
 * Middleware per verificare l'autenticazione tramite JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In modalità sviluppo, stampa informazioni utili per il debug
    if (IS_DEV) {
      console.log(`[${new Date().toISOString()}] Auth middleware - Path:`, req.path);
      console.log('Auth middleware - Method:', req.method);
      
      if (req.headers.authorization) {
        console.log('Auth middleware - Has Authorization header: Yes');
      } else {
        console.log('Auth middleware - Has Authorization header: No');
      }
    }
    
    // Ottieni il token dall'header Authorization (approccio standard per API REST)
    let token = null;
    
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('Auth middleware - Nessun token trovato');
      return res.status(401).json({ error: 'Accesso non autorizzato. Token mancante.' });
    }

    try {
      // Verifica il token con la chiave segreta
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Assicurati che l'ID sia consistente (come stringa)
      if (decoded && typeof decoded === 'object') {
        if (decoded.id && typeof decoded.id !== 'string') {
          decoded.id = String(decoded.id);
        }
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Errore nella verifica del token:', error);
      return res.status(401).json({ error: 'Token non valido o scaduto' });
    }
  } catch (error) {
    console.error('Errore di autenticazione:', error);
    res.status(401).json({ error: 'Token non valido o scaduto.' });
  }
};

/**
 * Middleware per verificare il ruolo dell'utente
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Accesso non autorizzato. Effettua il login.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Non hai i permessi necessari per accedere a questa risorsa.' });
    }

    next();
  };
};

/**
 * Genera un token JWT
 */
export const generateToken = (userId: string, email: string, name: string, role: string): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET non è definito nelle variabili d\'ambiente');
  }
  return jwt.sign({ id: userId, email, name, role }, JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Middleware per verificare che l'utente ha un abbonamento attivo
 */
export const isSubscribed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verifica se esiste l'utente nella richiesta
    if (!req.user) {
      return res.status(401).json({ message: 'Utente non autenticato' });
    }

    const userId = req.user.id;
    const userEmail = req.user.email;
    
    console.log(`Verifica abbonamento per utente: ID=${userId}, Email=${userEmail}`);

    // Effettua la chiamata API a Lemon Squeezy 
    const response = await axios.get(`${API_URL}/subscriptions`, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${API_KEY}`
      },
      params: {
        'filter[user_email]': userEmail,
        'include': 'order'
      }
    });

    // Estrazione delle sottoscrizioni dalla risposta
    const subscriptions = response.data?.data || [];
    console.log(`Numero totale di sottoscrizioni trovate: ${subscriptions.length}`);

    // Filtra le sottoscrizioni dell'utente corrente basate su ID utente o email
    const userSubscriptions = subscriptions.filter(subscription => {
      const customData = subscription.attributes?.custom_data || {};
      const subscriptionEmail = subscription.attributes?.user_email;
      
      // Verifica se la sottoscrizione appartiene all'utente tramite ID o email
      const matchUserId = customData.userId && customData.userId === userId;
      const matchEmailInCustomData = customData.email && customData.email === userEmail;
      const matchSubscriptionEmail = subscriptionEmail && subscriptionEmail === userEmail;
      
      // Loghiamo i dettagli per debug
      if (IS_DEV) {
        console.log(`Analisi sottoscrizione ID: ${subscription.id}`);
        console.log(`- Email nella sottoscrizione: ${subscriptionEmail}`);
        console.log(`- Custom data: ${JSON.stringify(customData)}`);
        console.log(`- Match su userId: ${matchUserId}`);
        console.log(`- Match su email in customData: ${matchEmailInCustomData}`);
        console.log(`- Match su email di sottoscrizione: ${matchSubscriptionEmail}`);
      }
      
      return matchUserId || matchEmailInCustomData || matchSubscriptionEmail;
    });

    console.log(`Sottoscrizioni filtrate per l'utente corrente: ${userSubscriptions.length}`);

    // Se l'utente non ha sottoscrizioni, nega l'accesso
    if (userSubscriptions.length === 0) {
      console.log(`Nessun abbonamento trovato per l'utente ${userId} (${userEmail})`);
      return res.status(403).json({ 
        message: 'Accesso negato: non hai un abbonamento attivo',
        subscribed: false 
      });
    }

    // Verifica se c'è almeno una sottoscrizione attiva
    const hasActiveSubscription = userSubscriptions.some(subscription => {
      const status = subscription.attributes?.status;
      console.log(`Stato abbonamento: ${status}`);
      
      // Considera attivi gli abbonamenti con status: active, past_due, on_trial, paused
      return ['active', 'past_due', 'on_trial', 'paused'].includes(status);
    });

    if (!hasActiveSubscription) {
      console.log(`Nessun abbonamento attivo per l'utente ${userId}`);
      return res.status(403).json({ 
        message: 'Accesso negato: il tuo abbonamento non è attivo',
        subscribed: false 
      });
    }

    console.log(`Utente ${userId} ha un abbonamento attivo`);
    next();
  } catch (error) {
    console.error('Errore nella verifica dell\'abbonamento:', error);
    return res.status(500).json({ 
      message: 'Errore durante la verifica dell\'abbonamento',
      error: error.message
    });
  }
}; 