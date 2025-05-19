import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface PlanOption {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  // ID del piano in Stripe
  priceId: string;
}

interface StripePaymentProps {
  planOptions: PlanOption[];
  title?: string;
  subtitle?: string;
  redirectToRegistration?: boolean;
}

/**
 * Questo componente gestisce l'integrazione con Stripe.
 */
export const StripePayment = ({
  planOptions,
  title = 'Scegli il tuo piano',
  subtitle = 'Inizia subito a utilizzare tutte le funzionalità del gestionale',
  redirectToRegistration = false,
}: StripePaymentProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleCheckout = async (plan: PlanOption) => {
    try {
      setIsLoading(plan.priceId);
      
      console.log('Avvio checkout per piano:', {
        id: plan.id,
        name: plan.name,
        priceId: plan.priceId,
        price: plan.price,
        userAuthenticated: !!user
      });

      if (!plan.priceId) {
        console.error('ID prezzo non valido:', plan.priceId);
        toast.error('Configurazione piano non valida', { 
          description: 'Contatta l\'amministratore del sistema.' 
        });
        setIsLoading(null);
        return;
      }

      // Prepariamo i dati personalizzati con l'ID utente se disponibile
      const customData = user?.id ? {
        userId: user.id,
        planName: plan.name,
      } : {
        planName: plan.name,
        createAccount: true
      };

      // Endpoint da chiamare in base al piano selezionato
      const endpoint = plan.id === 'plan-monthly' 
        ? '/api/payments/create-checkout-session/monthly' 
        : '/api/payments/create-checkout-session/annual';

      // Salva il piano selezionato nel localStorage
      localStorage.setItem('selectedPlan', JSON.stringify({
        id: plan.id,
        priceId: plan.priceId,
        name: plan.name
      }));

      // Se l'utente non è autenticato, reindirizzalo alla registrazione
      if (!user) {
        toast.info("È necessario registrarsi per completare l'acquisto");
        navigate('/register?checkout=true');
        setIsLoading(null);
        return;
      }

      // Continua con il checkout per utenti autenticati
      // Effettua la chiamata al backend per creare la sessione di checkout
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('Token di autenticazione mancante');
        toast.error('Errore di autenticazione', { 
          description: 'Per favore, effettua nuovamente il login.' 
        });
        navigate('/login?redirect=subscribe');
        setIsLoading(null);
        return;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user?.email || '',
          customData: customData
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const checkoutData = await response.json();
      
      console.log('Risposta checkout:', checkoutData);

      // Redirect all'URL del checkout Stripe
      if (checkoutData?.url) {
        window.location.href = checkoutData.url;
      } else {
        console.error('URL checkout mancante nella risposta:', checkoutData);
        throw new Error('URL di checkout mancante nella risposta');
      }
    } catch (error: any) {
      console.error('Errore durante la creazione del checkout:', error);
      toast.error('Si è verificato un errore durante l\'avvio del pagamento');
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
        {planOptions.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col ${
              plan.isPopular
                ? 'ring-2 ring-primary relative shadow-lg'
                : 'shadow-md'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <div className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                  Piano più popolare
                </div>
              </div>
            )}

            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
              <div className="mb-4">
                <p className="text-3xl font-bold">{plan.price}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary flex-shrink-0 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                size="lg"
                className="w-full"
                variant={plan.isPopular ? 'default' : 'outline'}
                onClick={() => handleCheckout(plan)}
                disabled={!!isLoading}
              >
                {isLoading === plan.priceId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Attendere...
                  </>
                ) : (
                  redirectToRegistration ? 'Inizia Ora' : 'Abbonati ora'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}; 