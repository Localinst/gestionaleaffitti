import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Forziamo il ricaricamento delle variabili d'ambiente
dotenv.config();

// Verifica se siamo in ambiente di sviluppo
const isDev = process.env.NODE_ENV !== 'production';

const router = Router();
const API_URL = 'https://api.lemonsqueezy.com/v1';
const API_KEY = process.env.LEMON_SQUEEZY_API_KEY || '';
const STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID || '';
const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

// Funzione per scrivere log anche su file in ambiente di sviluppo
const debugLog = (message: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message} ${details ? JSON.stringify(details, null, 2) : ''}`;
  
  console.log(logMessage);
  
  if (isDev) {
    try {
      const logDir = path.join(__dirname, '..', '..', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(path.join(logDir, 'lemon-squeezy.log'), logMessage + '\n');
    } catch (err) {
      console.error('Errore nella scrittura dei log:', err);
    }
  }
};

// Debug log: verifica se le variabili d'ambiente sono disponibili
debugLog('--- LEMON SQUEEZY CONFIG ---');
debugLog('API Key disponibile:', { 
  available: !!API_KEY, 
  keyExists: API_KEY ? 'Sì' : 'No',
  keyLength: API_KEY ? API_KEY.length : 0,
  keyPreview: API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'mancante'
});
debugLog('Store ID disponibile:', { storeId: STORE_ID || 'mancante' });
debugLog('Webhook Secret disponibile:', { webhookSecretExists: !!WEBHOOK_SECRET });
debugLog('--------------------------');

// Stampa tutte le variabili d'ambiente (NON farlo in produzione)
if (isDev) {
  debugLog('Tutte le variabili d\'ambiente:', process.env);
}

// Stampa il percorso del file .env 
const possibleEnvPaths = [
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend', '.env')
];

possibleEnvPaths.forEach(envPath => {
  debugLog(`Verifica file .env in: ${envPath}`, { exists: fs.existsSync(envPath) });
});

// Client API per Lemon Squeezy configurato secondo lo standard JSON:API
const lemonSqueezyApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Intercettore per loggare le richieste e risposte in modalità sviluppo
if (isDev) {
  lemonSqueezyApi.interceptors.request.use(request => {
    debugLog('Richiesta in uscita:', { 
      method: request.method, 
      url: request.url,
      headers: {
        ...request.headers,
        Authorization: request.headers.Authorization ? 'Bearer ***' : undefined
      }
    });
    return request;
  });

  lemonSqueezyApi.interceptors.response.use(
    response => {
      debugLog('Risposta ricevuta:', { 
        status: response.status, 
        statusText: response.statusText,
        data: response.data ? 'Dati ricevuti' : 'Nessun dato'
      });
      return response;
    },
    error => {
      debugLog('Errore nella risposta:', { 
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return Promise.reject(error);
    }
  );
}

// Middleware per verificare le richieste webhook da Lemon Squeezy
const verifyWebhookSignature = (req: Request, res: Response, next: Function) => {
  // Ottenere la firma dall'header
  const signature = req.headers['x-signature'];
  
  if (!signature || typeof signature !== 'string') {
    debugLog('Firma webhook mancante', { headers: req.headers });
    return res.status(400).json({ error: 'Firma webhook mancante' });
  }
  
  // Calcolare l'HMAC SHA-256 del corpo della richiesta
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const body = JSON.stringify(req.body);
  const digest = hmac.update(body).digest('hex');
  
  // Verificare che la firma corrisponda
  if (signature !== digest) {
    debugLog('Firma webhook non valida', { 
      expected: digest, 
      received: signature 
    });
    return res.status(401).json({ error: 'Firma webhook non valida' });
  }
  
  next();
};

// Ottiene i prodotti dallo store Lemon Squeezy
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { include } = req.query;
    const params = new URLSearchParams();
    
    // Applica il filtro per lo store ID se disponibile
    if (STORE_ID) {
      params.append('filter[store_id]', STORE_ID);
    }
    
    // Applica include se specificato
    if (include) {
      params.append('include', include.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    debugLog('Chiamata a Lemon Squeezy API', { 
      endpoint: `${API_URL}/products${queryString}`,
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: API_KEY ? 'Bearer presente' : 'Bearer mancante'
      }
    });
    
    const response = await lemonSqueezyApi.get(`/products${queryString}`);
    res.json(response.data);
  } catch (error: any) {
    debugLog('Errore nel recupero dei prodotti', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(error.response?.status || 500).json({ 
      error: 'Errore nel recupero dei prodotti',
      details: error.response?.data || error.message 
    });
  }
});

// Ottiene i dettagli di un prodotto specifico
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    
    const includeParam = include ? `?include=${include}` : '';
    const response = await lemonSqueezyApi.get(`/products/${id}${includeParam}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Errore nel recupero del prodotto:', error);
    console.error('Risposta errore:', error.response?.data || 'Nessun dettaglio disponibile');
    res.status(error.response?.status || 500).json({ 
      error: 'Errore nel recupero del prodotto',
      details: error.response?.data || error.message  
    });
  }
});

// Ottiene le varianti di un prodotto
router.get('/variants', async (req: Request, res: Response) => {
  try {
    const { productId, include } = req.query;
    const params = new URLSearchParams();
    
    if (productId) {
      params.append('filter[product_id]', productId.toString());
    }
    
    if (include) {
      params.append('include', include.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await lemonSqueezyApi.get(`/variants${queryString}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Errore nel recupero delle varianti:', error);
    console.error('Risposta errore:', error.response?.data || 'Nessun dettaglio disponibile');
    res.status(error.response?.status || 500).json({ 
      error: 'Errore nel recupero delle varianti',
      details: error.response?.data || error.message 
    });
  }
});

// Crea un checkout
router.post('/create-checkout', async (req: Request, res: Response) => {
  try {
    const { variantId, email, customData } = req.body;
    
    if (!variantId) {
      return res.status(400).json({ error: 'ID variante mancante' });
    }
    
    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            redirect_url: `${req.protocol}://${req.get('host')}/abbonamento-confermato`,
            receipt_button_text: 'Torna al Gestionale',
            receipt_link_url: `${req.protocol}://${req.get('host')}/dashboard`,
            receipt_thank_you_note: 'Grazie per il tuo acquisto!'
          },
          checkout_data: {
            email: email,
            custom: customData
          }
        },
        relationships: {
          variant: {
            data: {
              type: 'variants',
              id: variantId
            }
          }
        }
      }
    };
    
    debugLog('Creazione checkout', { 
      variantId,
      email: email || 'non specificata',
      payload: payload
    });
    
    const response = await lemonSqueezyApi.post('/checkouts', payload);
    res.json(response.data);
  } catch (error: any) {
    debugLog('Errore nella creazione del checkout', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(error.response?.status || 500).json({ 
      error: 'Errore nella creazione del checkout',
      details: error.response?.data || error.message 
    });
  }
});

// Ottiene le sottoscrizioni dell'utente
router.get('/subscriptions', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, include } = req.query;
    const params = new URLSearchParams();
    
    if (userId) {
      params.append('filter[user_id]', userId.toString());
    }
    
    if (STORE_ID) {
      params.append('filter[store_id]', STORE_ID);
    }
    
    if (include) {
      params.append('include', include.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await lemonSqueezyApi.get(`/subscriptions${queryString}`);
    res.json(response.data);
  } catch (error) {
    console.error('Errore nel recupero delle sottoscrizioni:', error);
    res.status(500).json({ error: 'Errore nel recupero delle sottoscrizioni' });
  }
});

// Ottiene i dettagli di una sottoscrizione
router.get('/subscriptions/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    
    const includeParam = include ? `?include=${include}` : '';
    const response = await lemonSqueezyApi.get(`/subscriptions/${id}${includeParam}`);
    res.json(response.data);
  } catch (error) {
    console.error('Errore nel recupero della sottoscrizione:', error);
    res.status(500).json({ error: 'Errore nel recupero della sottoscrizione' });
  }
});

// Aggiorna una sottoscrizione (upgrade/downgrade)
router.patch('/subscriptions/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { variantId } = req.body;
    
    if (!variantId) {
      return res.status(400).json({ error: 'ID variante mancante' });
    }
    
    const payload = {
      data: {
        type: 'subscriptions',
        id,
        attributes: {
          variant_id: variantId
        }
      }
    };
    
    const response = await lemonSqueezyApi.patch(`/subscriptions/${id}`, payload);
    res.json(response.data);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della sottoscrizione:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della sottoscrizione' });
  }
});

// Cancella una sottoscrizione
router.delete('/subscriptions/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await lemonSqueezyApi.delete(`/subscriptions/${id}`);
    res.status(204).end();
  } catch (error) {
    console.error('Errore nella cancellazione della sottoscrizione:', error);
    res.status(500).json({ error: 'Errore nella cancellazione della sottoscrizione' });
  }
});

// Gestisce i webhook da Lemon Squeezy
router.post('/webhook', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const { meta, data } = req.body;
    const event = meta.event_name;
    
    console.log(`Ricevuto webhook Lemon Squeezy: ${event}`);
    console.log('Dati webhook:', JSON.stringify({
      eventName: event,
      dataId: data.id,
      type: data.type,
      timestamp: new Date().toISOString()
    }));
    
    // Gestione degli eventi webhook
    switch(event) {
      case 'order_created':
        // Logica per l'ordine creato
        console.log('Nuovo ordine creato:', data.id);
        break;
        
      case 'order_refunded':
        // Logica per il rimborso di un ordine
        console.log('Ordine rimborsato:', data.id);
        break;
        
      case 'subscription_created':
        // Logica per una nuova sottoscrizione
        console.log('Nuova sottoscrizione creata:', data.id);
        break;
        
      case 'subscription_updated':
        // Logica per l'aggiornamento di una sottoscrizione
        console.log('Sottoscrizione aggiornata:', data.id);
        break;
        
      case 'subscription_cancelled':
        // Logica per la cancellazione di una sottoscrizione
        console.log('Sottoscrizione cancellata:', data.id);
        break;
        
      case 'subscription_resumed':
        // Logica per la ripresa di una sottoscrizione
        console.log('Sottoscrizione ripresa:', data.id);
        break;
        
      case 'subscription_expired':
        // Logica per la scadenza di una sottoscrizione
        console.log('Sottoscrizione scaduta:', data.id);
        break;
        
      case 'subscription_payment_success':
        // Logica per un pagamento di sottoscrizione riuscito
        console.log('Pagamento sottoscrizione riuscito:', data.id);
        break;
        
      case 'subscription_payment_failed':
        // Logica per un pagamento di sottoscrizione fallito
        console.log('Pagamento sottoscrizione fallito:', data.id);
        break;
        
      default:
        console.log('Evento non gestito:', event);
    }
    
    res.status(200).end();
  } catch (error) {
    console.error('Errore nella gestione del webhook:', error);
    res.status(500).json({ error: 'Errore nella gestione del webhook' });
  }
});

export default router; 