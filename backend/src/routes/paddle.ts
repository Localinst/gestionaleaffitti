import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { supabase } from '../lib/supabase';

// Forziamo il ricaricamento delle variabili d'ambiente
dotenv.config();

// Verifica se siamo in ambiente di sviluppo
const isDev = process.env.NODE_ENV !== 'production';

const router = Router();
const API_URL = process.env.PADDLE_API_URL || 'https://api.paddle.com/';
const SANDBOX_API_URL = process.env.PADDLE_SANDBOX_API_URL || 'https://sandbox-api.paddle.com/';
const API_KEY = process.env.PADDLE_API_KEY || '';
const PUBLIC_KEY = process.env.PADDLE_PUBLIC_KEY || '';
const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || '';
const useSandbox = process.env.PADDLE_SANDBOX === 'true';

const baseUrl = useSandbox ? SANDBOX_API_URL : API_URL;

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
      fs.appendFileSync(path.join(logDir, 'paddle.log'), logMessage + '\n');
    } catch (err) {
      console.error('Errore nella scrittura dei log:', err);
    }
  }
};

// Debug log: verifica se le variabili d'ambiente sono disponibili
debugLog('--- PADDLE CONFIG ---');
debugLog('API Key disponibile:', { 
  available: !!API_KEY, 
  keyExists: API_KEY ? 'Sì' : 'No',
  keyLength: API_KEY ? API_KEY.length : 0,
  keyPreview: API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'mancante'
});
debugLog('Public Key disponibile:', { publicKeyExists: !!PUBLIC_KEY });
debugLog('Webhook Secret disponibile:', { webhookSecretExists: !!WEBHOOK_SECRET });
debugLog('Modalità:', useSandbox ? 'Sandbox' : 'Produzione');
debugLog('--------------------------');

// Client API per Paddle
const paddleApi = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Specifica la versione dell'API Paddle
paddleApi.interceptors.request.use(request => {
  request.headers['Paddle-Version'] = '1'; // Versione API (1 è la più recente)
  return request;
});

// Intercettore per loggare le richieste e risposte in modalità sviluppo
if (isDev) {
  paddleApi.interceptors.request.use(request => {
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

  paddleApi.interceptors.response.use(
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

// Middleware per verificare le richieste webhook da Paddle
const verifyWebhookSignature = (req: Request, res: Response, next: Function) => {
  // In Paddle v2 la verifica viene fatta tramite public key e JWS
  // A SCOPO INFORMATIVO: la documentazione completa è su https://developer.paddle.com/webhooks/signature-verification
  try {
    const signature = req.headers['paddle-signature'];
    
    if (!signature || typeof signature !== 'string') {
      debugLog('Firma webhook mancante', { headers: req.headers });
      return res.status(400).json({ error: 'Firma webhook mancante' });
    }
    
    // TODO: Implementare la verifica della firma JWS
    // Per ora, in modalità di sviluppo, accettiamo le richieste senza verifica
    if (isDev) {
      debugLog('Webhook in modalità sviluppo: verifica firma ignorata');
      return next();
    }
    
    // Implementazione base della verifica (da completare con la logica corretta)
    next();
  } catch (error) {
    debugLog('Errore nella verifica della firma', error);
    return res.status(401).json({ error: 'Verifica firma fallita' });
  }
};

// Ottiene i prodotti dallo store Paddle
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { include } = req.query;
    const params = new URLSearchParams();
    
    // Applica include se specificato
    if (include) {
      params.append('include', include.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    debugLog('Chiamata a Paddle API', { 
      endpoint: `${baseUrl}/products${queryString}`
    });
    
    const response = await paddleApi.get(`/products${queryString}`);
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
    const response = await paddleApi.get(`/products/${id}${includeParam}`);
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

// Ottiene i prezzi di un prodotto
router.get('/prices', async (req: Request, res: Response) => {
  try {
    const { include, 'filter[product_id]': productId } = req.query;
    const params = new URLSearchParams();
    
    if (productId) {
      params.append('filter[product_id]', productId.toString());
    }
    
    if (include) {
      params.append('include', include.toString());
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await paddleApi.get(`/prices${queryString}`);
    res.json(response.data);
  } catch (error: any) {
    console.error('Errore nel recupero dei prezzi:', error);
    console.error('Risposta errore:', error.response?.data || 'Nessun dettaglio disponibile');
    res.status(error.response?.status || 500).json({ 
      error: 'Errore nel recupero dei prezzi',
      details: error.response?.data || error.message 
    });
  }
});

// Endpoint di ping per test di connessione
router.get('/ping', (req: Request, res: Response) => {
  const config = {
    apiKeyPresent: !!API_KEY,
    publicKeyPresent: !!PUBLIC_KEY,
    webhookSecretPresent: !!WEBHOOK_SECRET,
    environment: useSandbox ? 'sandbox' : 'production',
    apiVersion: '1',
    timestamp: new Date().toISOString()
  };
  
  debugLog('Richiesta ping ricevuta', { config });
  
  res.json({ 
    status: 'success', 
    message: 'Paddle API è online',
    config
  });
});

// Crea un checkout
router.post('/create-checkout', async (req: Request, res: Response) => {
  try {
    const { priceId, email, customData } = req.body;
    
    debugLog('Richiesta create-checkout ricevuta', { 
      priceId, 
      email: email || 'non specificato',
      customData
    });
    
    if (!priceId) {
      debugLog('ID prezzo mancante', { body: req.body });
      return res.status(400).json({ error: 'ID prezzo mancante' });
    }
    
    // Costruzione dell'URL del Checkout Paddle
    const checkoutData = {
      items: [
        {
          priceId: priceId,
          quantity: 1
        }
      ],
      customData: customData || {},
      successUrl: `${req.protocol}://${req.get('host')}/abbonamento-confermato`,
      customer: email ? { email: email } : undefined
    };
    
    debugLog('Creazione checkout', { 
      priceId,
      email: email || 'non specificata',
      payload: checkoutData
    });
    
    // In Paddle v2, i checkouts sono chiamati "transactions"
    const response = await paddleApi.post('/checkout', checkoutData);
    
    debugLog('Checkout creato', response.data);
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
    const userId = req.user.id; // Prende l'ID dell'utente autenticato
    const userEmail = req.user.email; // Prende l'email dell'utente autenticato
    const { include } = req.query;
    
    // In Paddle, dobbiamo prima trovare o creare il customer
    const customerResponse = await paddleApi.get(`/customers?filter[email]=${encodeURIComponent(userEmail)}`);
    const customers = customerResponse.data.data || [];
    
    // Se non abbiamo trovato il customer, non abbiamo sottoscrizioni
    if (customers.length === 0) {
      return res.json({ data: [] });
    }
    
    const customerId = customers[0].id;
    
    // Ora otteniamo le sottoscrizioni per questo customer
    const params = new URLSearchParams();
    params.append('filter[customer_id]', customerId);
    
    // Include risorse correlate se specificato
    if (include) {
      params.append('include', include.toString());
    }
    
    console.log(`Ottenimento sottoscrizioni per utente: ${userId}, Email: ${userEmail}, Customer ID: ${customerId}`);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await paddleApi.get(`/subscriptions${queryString}`);
    
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
    const response = await paddleApi.get(`/subscriptions/${id}${includeParam}`);
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
    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'ID prezzo mancante' });
    }
    
    const payload = {
      items: [
        {
          priceId: priceId,
          quantity: 1
        }
      ],
      // Addebita la differenza immediatamente se è un upgrade
      prorationBillingMode: "prorated_immediately"
    };
    
    const response = await paddleApi.patch(`/subscriptions/${id}`, payload);
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
    await paddleApi.delete(`/subscriptions/${id}`);
    res.status(204).end();
  } catch (error) {
    console.error('Errore nella cancellazione della sottoscrizione:', error);
    res.status(500).json({ error: 'Errore nella cancellazione della sottoscrizione' });
  }
});

// Gestisce i webhook da Paddle
router.post('/webhook', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    debugLog(`Ricevuto webhook Paddle: ${type}`);
    debugLog('Dati webhook completi:', req.body);
    
    // Gestione degli eventi webhook
    switch(type) {
      case 'transaction.completed':
        // Logica per la transazione completata
        debugLog('Nuova transazione completata:', data.id);
        
        try {
          // Estraiamo i dati dal webhook
          const customerEmail = data.customer?.email;
          const customData = data.custom_data || {};
          
          debugLog('Email cliente estratta:', customerEmail);
          debugLog('Dati custom estratti:', customData);
          
          if (customData && customData.createAccount === true) {
            debugLog('Richiesta creazione automatica account per:', customerEmail);
            
            // Genera una password casuale sicura
            const temporaryPassword = generateSecurePassword();
            const customerName = customerEmail ? customerEmail.split('@')[0] : 'Utente'; // Usa la parte prima di @ come nome
            
            if (customerEmail) {
              // Registra l'utente con la email del cliente
              try {
                debugLog('Tentativo creazione account con dati:', {
                  email: customerEmail,
                  name: customerName,
                  passwordLength: temporaryPassword.length
                });
                
                const { data: authData, error: authError } = await supabase.auth.signUp({
                  email: customerEmail,
                  password: temporaryPassword,
                  options: {
                    data: {
                      full_name: customerName,
                    }
                  }
                });
                
                if (authError) {
                  console.error('Errore durante la creazione automatica dell\'account:', authError);
                } else {
                  debugLog('Account creato automaticamente per:', customerEmail, 'Dati:', authData);
                  
                  // Invia email con credenziali usando il tuo sistema di email
                  // TODO: Implementare l'invio email con credenziali temporanee
                  
                  debugLog('Email con credenziali temporanee inviata a:', customerEmail);
                  debugLog('Password temporanea generata (solo per debug):', temporaryPassword);
                }
              } catch (registrationError) {
                console.error('Errore durante la registrazione automatica:', registrationError);
              }
            } else {
              console.error('Impossibile creare account: email cliente mancante');
            }
          } else {
            console.log('Nessuna richiesta di creazione account trovata nei dati custom, account non creato');
          }
        } catch (orderError) {
          console.error('Errore nel processare la transazione per la creazione account:', orderError);
        }
        break;
        
      case 'transaction.refunded':
        // Logica per il rimborso di una transazione
        debugLog('Transazione rimborsata:', data.id);
        break;
        
      case 'subscription.created':
        // Logica per una nuova sottoscrizione
        debugLog('Nuova sottoscrizione creata:', data.id);
        break;
        
      case 'subscription.updated':
        // Logica per l'aggiornamento di una sottoscrizione
        debugLog('Sottoscrizione aggiornata:', data.id);
        break;
        
      case 'subscription.canceled':
        // Logica per la cancellazione di una sottoscrizione
        debugLog('Sottoscrizione cancellata:', data.id);
        break;
        
      case 'subscription.resumed':
        // Logica per la ripresa di una sottoscrizione
        debugLog('Sottoscrizione ripresa:', data.id);
        break;
        
      case 'subscription.expired':
        // Logica per la scadenza di una sottoscrizione
        debugLog('Sottoscrizione scaduta:', data.id);
        break;
        
      case 'subscription.payment.succeeded':
        // Logica per un pagamento di sottoscrizione riuscito
        debugLog('Pagamento sottoscrizione riuscito:', data.id);
        break;
        
      case 'subscription.payment.failed':
        // Logica per un pagamento di sottoscrizione fallito
        debugLog('Pagamento sottoscrizione fallito:', data.id);
        break;
        
      default:
        debugLog('Evento non gestito:', type);
    }
    
    res.status(200).end();
  } catch (error) {
    console.error('Errore nella gestione del webhook:', error);
    res.status(500).json({ error: 'Errore nella gestione del webhook' });
  }
});

// Funzione per generare una password sicura
function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export default router; 