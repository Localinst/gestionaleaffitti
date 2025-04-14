import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';

// Caricamento di Stripe con la chiave pubblica
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Componente di pagamento
const CheckoutForm = ({ planType }: { planType: 'monthly' | 'annual' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js non è ancora caricato
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Richiedi il redirect alla pagina di checkout di Stripe
      const response = await fetch(`/api/payments/create-checkout-session/${planType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const session = await response.json();
      
      if (session.error) {
        setError(session.error);
        setLoading(false);
        return;
      }

      // Redirect alla pagina di checkout Stripe
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        setError(error.message || 'Si è verificato un errore');
      }
    } catch (err) {
      setError('Si è verificato un errore durante la connessione al server di pagamento');
      console.error('Errore di pagamento:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="mb-6">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={!stripe || loading} 
          className="w-full bg-sky-600 hover:bg-sky-700 text-white"
        >
          {loading ? "Elaborazione..." : `Paga ora per l'abbonamento ${planType === 'monthly' ? 'mensile' : 'annuale'}`}
        </Button>
      </div>
    </form>
  );
};

// Componente wrapper con Elements
export const StripePaymentForm = ({ planType }: { planType: 'monthly' | 'annual' }) => {
  return (
    <Elements stripe={stripePromise}>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>
            {planType === 'monthly' 
              ? 'Abbonamento Mensile - €20/mese' 
              : 'Abbonamento Annuale - €200/anno'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            {planType === 'monthly'
              ? 'Inserisci i dati della tua carta per attivare l\'abbonamento mensile'
              : 'Risparmia €40 con l\'abbonamento annuale'}
          </p>
          <CheckoutForm planType={planType} />
        </CardContent>
        <CardFooter className="flex flex-col text-xs text-muted-foreground">
          <p>I tuoi dati di pagamento sono protetti e crittografati</p>
          <div className="flex items-center justify-center mt-2">
            <img src="https://stripe.com/img/v3/home/businesses/overview/visa.svg" alt="Visa" className="h-6 mx-1" />
            <img src="https://stripe.com/img/v3/home/businesses/overview/mastercard.svg" alt="Mastercard" className="h-6 mx-1" />
            <img src="https://stripe.com/img/v3/home/businesses/overview/amex.svg" alt="American Express" className="h-6 mx-1" />
          </div>
        </CardFooter>
      </Card>
    </Elements>
  );
};

// Componente per avviare il pagamento di Stripe tramite Checkout
export const StripeCheckoutButton = ({ planType }: { planType: 'monthly' | 'annual' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Aggiungiamo l'Authorization header per l'autenticazione
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/payments/create-checkout-session/${planType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante la creazione della sessione di pagamento');
      }
      
      const { url, error } = await response.json();
      
      if (error) {
        setError(error);
        return;
      }

      // Redirect alla pagina di checkout di Stripe
      window.location.href = url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Si è verificato un errore durante la connessione al server di pagamento';
      setError(errorMessage);
      console.error('Errore di pagamento:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="text-red-500 text-sm mb-4">
          {error}
        </div>
      )}
      
      <Button 
        onClick={handleCheckout} 
        disabled={loading} 
        className={`w-full ${planType === 'monthly' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-amber-500 hover:bg-amber-600'} text-white`}
      >
        {loading ? "Elaborazione..." : planType === 'monthly' ? 'Abbonati Ora' : 'Ottieni lo Sconto Annuale'}
      </Button>
    </div>
  );
}; 