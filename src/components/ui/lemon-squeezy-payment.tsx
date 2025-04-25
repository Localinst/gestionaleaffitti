import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { createCheckout } from '@/services/lemon-squeezy-api';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface PlanOption {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  variantId: string;
  isPopular?: boolean;
}

interface LemonSqueezyPaymentProps {
  planOptions: PlanOption[];
  title?: string;
  subtitle?: string;
}

/**
 * Questo componente gestisce l'integrazione con Lemon Squeezy.
 * 
 * NOTA IMPORTANTE:
 * Tutte le richieste a Lemon Squeezy seguono lo standard JSON:API e devono includere:
 * - Header 'Accept: application/vnd.api+json'
 * - Header 'Content-Type: application/vnd.api+json'
 * - Formato query params conforme a JSON:API (es. ?filter[parameter]=value)
 * - Supporto per include di risorse correlate tramite ?include=resource1,resource2
 */

export const LemonSqueezyPayment = ({
  planOptions,
  title = 'Scegli il tuo piano',
  subtitle = 'Inizia subito a utilizzare tutte le funzionalità del gestionale',
}: LemonSqueezyPaymentProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Controlla se esiste un piano selezionato nel localStorage
  useEffect(() => {
    const selectedPlanData = localStorage.getItem('selectedPlan');
    if (selectedPlanData && !isLoading) {
      try {
        // Ottieni i dettagli del piano dal localStorage
        const planDetails = JSON.parse(selectedPlanData);
        
        // Trova il piano selezionato nelle opzioni disponibili
        const selectedPlan = planOptions.find(plan => plan.id === planDetails.id);
        
        if (selectedPlan) {
          // Avvia automaticamente il checkout per il piano selezionato
          (async () => {
            try {
              localStorage.removeItem('selectedPlan'); // Rimuovi subito per evitare loop
              await handleCheckout(selectedPlan);
            } catch (error) {
              console.error('Errore durante il checkout automatico:', error);
            }
          })();
        }
      } catch (error) {
        console.error('Errore nel parsing dei dati del piano:', error);
        localStorage.removeItem('selectedPlan');
      }
    }
  }, [planOptions, isLoading]);

  const handleCheckout = async (plan: PlanOption) => {
    try {
      setIsLoading(plan.variantId);
      
      console.log('Avvio checkout per piano:', {
        id: plan.id,
        name: plan.name,
        variantId: plan.variantId,
        price: plan.price
      });

      if (!plan.variantId || plan.variantId === 'monthly-variant-id' || plan.variantId === 'annual-variant-id') {
        console.error('ID variante non valido o placeholder:', plan.variantId);
        toast.error('Configurazione piano non valida', { 
          description: 'Contatta l\'amministratore del sistema.' 
        });
        setIsLoading(null);
        return;
      }

      const customData = {
        userId: user?.id,
        planName: plan.name,
      };

      console.log('Invio richiesta checkout con parametri:', {
        variantId: plan.variantId,
        email: user?.email,
        customData
      });

      const checkoutData = await createCheckout(
        plan.variantId,
        user?.email,
        customData
      );

      console.log('Risposta checkout:', checkoutData);

      // Redirect all'URL del checkout Lemon Squeezy
      if (checkoutData.data?.attributes?.url) {
        window.location.href = checkoutData.data.attributes.url;
      } else {
        console.error('URL checkout mancante nella risposta:', checkoutData);
        throw new Error('URL di checkout mancante nella risposta');
      }
    } catch (error: any) {
      console.error('Errore durante la creazione del checkout:', error);
      console.error('Dettaglio risposta:', error.response?.data);
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

            <CardContent className="flex-grow">
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
                {isLoading === plan.variantId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Attendere...
                  </>
                ) : (
                  `Abbonati ora`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}; 