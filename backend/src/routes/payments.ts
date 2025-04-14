import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Errore nella creazione della sessione di checkout:', error);
    res.status(500).json({ error: 'Errore nella creazione della sessione di pagamento' });
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