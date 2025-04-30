import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/auth';

dotenv.config();

const router = Router();
// In locale, dovresti configurare la variabile STRIPE_SECRET_KEY nel file .env
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

console.log('Stripe Secret Key disponibile:', !!stripeSecretKey);

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-03-31.basil',
});

// Crea una sessione di checkout per l'abbonamento mensile (€20)
router.post('/create-checkout-session/monthly', async (req: Request, res: Response) => {
  try {
    // Estrai l'email dall'utente autenticato o dal body
    const userEmail = req.body.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email utente richiesta per creare la sessione di checkout' });
    }
    
    console.log(`Creazione sessione checkout mensile per email: ${userEmail}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail, // Precompila l'email dell'utente
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abbonamento Mensile Gestionale Affitti',
              description: "Pagamento mensile per l'utilizzo completo del gestionale affitti",
            },
            unit_amount: 2000, // €20.00 in centesimi
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/abbonamento-confermato?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        userEmail: userEmail, // Salva l'email nei metadati per verifica successiva
        userId: req.body.customData?.userId || '',
        planName: 'piano-mensile'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Errore nella creazione della sessione di checkout:', error);
    res.status(500).json({ error: 'Errore nella creazione della sessione di pagamento' });
  }
});

// Crea una sessione di checkout per l'abbonamento annuale (€200)
router.post('/create-checkout-session/annual', async (req: Request, res: Response) => {
  try {
    // Estrai l'email dall'utente autenticato o dal body
    const userEmail = req.body.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email utente richiesta per creare la sessione di checkout' });
    }
    
    console.log(`Creazione sessione checkout annuale per email: ${userEmail}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail, // Precompila l'email dell'utente
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abbonamento Annuale Gestionale Affitti',
              description: 'Abbonamento annuale con sconto - risparmio di €40',
            },
            unit_amount: 20000, // €200.00 in centesimi
            recurring: {
              interval: 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/abbonamento-confermato?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        userEmail: userEmail, // Salva l'email nei metadati per verifica successiva
        userId: req.body.customData?.userId || '',
        planName: 'piano-annuale'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Errore nella creazione della sessione di checkout:', error);
    res.status(500).json({ error: 'Errore nella creazione della sessione di pagamento' });
  }
});

// Endpoint per verificare lo stato dell'abbonamento dell'utente
router.get('/check-subscription-status', authenticate, async (req: Request, res: Response) => {
  try {
    // Usa l'email dalla query se fornita, altrimenti usa l'email dell'utente autenticato
    const userEmail = req.query.userEmail?.toString() || req.user.email;
    const userId = req.user.id?.toString();
    
    if (!userEmail) {
      console.error('Email utente mancante nella richiesta di verifica abbonamento');
      return res.status(400).json({ error: 'Email utente richiesta per la verifica dell\'abbonamento' });
    }
    
    console.log(`Verifica abbonamento Stripe per email: ${userEmail}, userId: ${userId || 'non disponibile'}`);
    
    // Cerca il customer in Stripe usando l'email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });
    
    // Se non troviamo il customer con l'email, cerchiamo tramite metadati
    let customerId = null;
    if (customers.data.length === 0) {
      console.log(`Nessun customer Stripe trovato per l'email ${userEmail}, cerco tramite metadati`);
      
      // Cerco tutte le sessioni di checkout completate con questa email nei metadati
      if (userId) {
        try {
          const checkoutSessions = await stripe.checkout.sessions.list({
            limit: 5,
            expand: ['data.customer']
          });
          
          // Filtra le sessioni che hanno questo utente nei metadati
          for (const session of checkoutSessions.data) {
            if (session.metadata?.userId === userId || session.metadata?.userEmail === userEmail) {
              customerId = session.customer as string;
              console.log(`Trovato customer tramite userId nei metadati: ${customerId}`);
              break;
            }
          }
        } catch (error) {
          console.error('Errore nella ricerca delle sessioni per userId:', error);
        }
      }
      
      if (!customerId) {
        return res.json({ active: false });
      }
    } else {
      customerId = customers.data[0].id;
    }
    
    // Cerca le sottoscrizioni attive per questo customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });
    
    console.log(`Trovate ${subscriptions.data.length} sottoscrizioni attive per il customer ${customerId}`);
    
    // Determina se l'utente ha una sottoscrizione attiva
    const hasActiveSubscription = subscriptions.data.length > 0;
    
    // Prepara i dati delle sottoscrizioni con gestione errori per le date
    const subscriptionsData = hasActiveSubscription ? subscriptions.data.map(sub => {
      try {
        // Gestisci il timestamp con sicurezza
        let currentPeriodEnd = null;
        
        // Typescript a volte non riconosce proprietà che Stripe effettivamente restituisce
        const endTimestamp = (sub as any).current_period_end;
        
        if (endTimestamp) {
          try {
            // Stripe fornisce timestamp in secondi, moltiplichiamo per 1000 per ottenere millisecondi
            currentPeriodEnd = new Date(endTimestamp * 1000).toISOString();
          } catch (dateError) {
            console.warn(`Errore nella conversione della data: ${dateError instanceof Error ? dateError.message : String(dateError)}`);
            // Fornisci un valore di fallback se la conversione fallisce
            currentPeriodEnd = 'Data non disponibile';
          }
        }
        
        return {
          id: sub.id,
          status: sub.status,
          currentPeriodEnd: currentPeriodEnd,
          plan: (sub as any).items?.data?.[0]?.plan?.nickname || 'Piano Abbonamento'
        };
      } catch (itemError) {
        console.warn(`Errore nell'elaborazione della sottoscrizione ${sub.id}: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
        return {
          id: sub.id || 'ID non disponibile',
          status: sub.status || 'Stato non disponibile',
          currentPeriodEnd: 'Data non disponibile',
          plan: 'Piano non disponibile'
        };
      }
    }) : [];
    
    res.json({ 
      active: hasActiveSubscription,
      subscriptions: subscriptionsData
    });
  } catch (error) {
    console.error('Errore nella verifica dell\'abbonamento:', error);
    res.status(500).json({ 
      error: 'Errore durante la verifica dell\'abbonamento',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * IMPORTANTE: Per ricevere correttamente i webhook di Stripe, è necessario utilizzare
 * il buffer raw del corpo della richiesta. Nel file index.ts, prima di definire 
 * app.use(express.json()), aggiungi:
 * 
 * // Configura il middleware per salvare il rawBody per Stripe
 * app.use(
 *   express.json({
 *     verify: (req: any, res, buf) => {
 *       if (req.originalUrl.startsWith('/api/payments/webhook')) {
 *         req.rawBody = buf.toString();
 *       }
 *     },
 *   })
 * );
 */

// Webhook per gestire gli eventi di Stripe
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('Webhook Stripe non configurato: STRIPE_WEBHOOK_SECRET non è impostato');
    return res.status(400).send('Webhook non configurato');
  }

  if (!sig) {
    console.error('Manca l\'header stripe-signature');
    return res.status(400).send('Manca l\'header stripe-signature');
  }

  let event;

  try {
    // Per Express, dobbiamo usare req.rawBody, che deve essere configurato nel middleware
    const rawBody = (req as any).rawBody || req.body;
    
    event = stripe.webhooks.constructEvent(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error(`Errore webhook: ${err}`);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Gestione degli eventi
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object;
      // Aggiorna lo stato dell'abbonamento nel database
      console.log('Pagamento completato:', checkoutSession);

      try {
        // Estrai le informazioni dal metadati della sessione
        const metadata = checkoutSession.metadata || {};
        const userEmail = metadata.userEmail;
        const userId = metadata.userId;
        const planName = metadata.planName;
        
        console.log(`Abbonamento completato per utente: ${userEmail}, ID: ${userId}, Piano: ${planName}`);
        
        // Verifica che l'email nella sessione di checkout corrisponda all'email dell'utente che ha completato il pagamento
        if (checkoutSession.customer_email && checkoutSession.customer_email !== userEmail) {
          console.error(`Attenzione: L'email usata per il pagamento (${checkoutSession.customer_email}) non corrisponde all'email dell'utente (${userEmail})`);
          
          // Qui potresti implementare la logica per informare l'utente o l'amministratore della discrepanza
          // Ad esempio, inviare una email di notifica all'admin
        }
        
        // Continua con il resto della logica di gestione dell'abbonamento
        // Questo potrebbe includere l'aggiornamento di un database, l'invio di email, ecc.
      } catch (error) {
        console.error('Errore nell\'elaborazione del pagamento completato:', error);
      }
      break;
    case 'invoice.paid':
      const invoice = event.data.object;
      // Gestisci il rinnovo dell'abbonamento
      console.log('Fattura pagata:', invoice);
      break;
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Gestisci la cancellazione dell'abbonamento
      console.log('Abbonamento cancellato:', subscription);
      break;
    default:
      console.log(`Evento non gestito: ${event.type}`);
  }

  res.json({ received: true });
});

export default router; 