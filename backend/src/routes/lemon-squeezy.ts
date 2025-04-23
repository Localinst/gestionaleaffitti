import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const API_URL = 'https://api.lemonsqueezy.com/v1';
const API_KEY = process.env.LEMON_SQUEEZY_API_KEY || '';
const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

// Client API per Lemon Squeezy
const lemonSqueezyApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Middleware per verificare le richieste webhook da Lemon Squeezy
const verifyWebhookSignature = (req: Request, res: Response, next: Function) => {
  // Ottenere la firma dall'header
  const signature = req.headers['x-signature'];
  
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Firma webhook mancante' });
  }
  
  // Calcolare l'HMAC SHA-256 del corpo della richiesta
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const body = JSON.stringify(req.body);
  const digest = hmac.update(body).digest('hex');
  
  // Verificare che la firma corrisponda
  if (signature !== digest) {
    return res.status(401).json({ error: 'Firma webhook non valida' });
  }
  
  next();
};

// Ottiene i prodotti dallo store Lemon Squeezy
router.get('/products', authenticate, async (req: Request, res: Response) => {
  try {
    const response = await lemonSqueezyApi.get('/products');
    res.json(response.data);
  } catch (error) {
    console.error('Errore nel recupero dei prodotti:', error);
    res.status(500).json({ error: 'Errore nel recupero dei prodotti' });
  }
});

// Ottiene i dettagli di un prodotto specifico
router.get('/products/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await lemonSqueezyApi.get(`/products/${id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Errore nel recupero del prodotto:', error);
    res.status(500).json({ error: 'Errore nel recupero del prodotto' });
  }
});

// Ottiene le varianti di un prodotto
router.get('/variants', authenticate, async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const response = await lemonSqueezyApi.get(`/variants?filter[product_id]=${productId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Errore nel recupero delle varianti:', error);
    res.status(500).json({ error: 'Errore nel recupero delle varianti' });
  }
});

// Crea un checkout
router.post('/create-checkout', authenticate, async (req: Request, res: Response) => {
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
    
    const response = await lemonSqueezyApi.post('/checkouts', payload);
    res.json(response.data);
  } catch (error) {
    console.error('Errore nella creazione del checkout:', error);
    res.status(500).json({ error: 'Errore nella creazione del checkout' });
  }
});

// Ottiene le sottoscrizioni dell'utente
router.get('/subscriptions', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const response = await lemonSqueezyApi.get(`/subscriptions?filter[user_id]=${userId}`);
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
    const response = await lemonSqueezyApi.get(`/subscriptions/${id}`);
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