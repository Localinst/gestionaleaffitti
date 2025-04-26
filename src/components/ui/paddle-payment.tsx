import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { createCheckout } from '@/services/paddle-api';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PlanOption {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  priceId: string;
  isPopular?: boolean;
}

interface PaddlePaymentProps {
  planOptions: PlanOption[];
  title?: string;
  subtitle?: string;
  redirectToRegistration?: boolean;
}

/**
 * Questo componente gestisce l'integrazione con Paddle.
 * 
 * NOTA IMPORTANTE:
 * Paddle.js deve essere incluso nella pagina HTML principale
 * per permettere l'apertura del checkout
 */
export const PaddlePayment = ({
  planOptions,
  title = 'Scegli il tuo piano',
  subtitle = 'Inizia subito a utilizzare tutte le funzionalità del gestionale',
  redirectToRegistration = false,
}: PaddlePaymentProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
        // Flag per indicare che dovremo creare un nuovo account
        createAccount: true
      };

      console.log('Dati custom per checkout:', customData);

      // Se Paddle.js è disponibile globalmente e l'utente è autenticato
      if (window.Paddle && user?.email) {
        // Metodo 1: Apertura checkout diretto tramite Paddle.js
        window.Paddle.Checkout.open({
          items: [{ priceId: plan.priceId, quantity: 1 }],
          customer: { email: user.email },
          customData: customData,
          successURL: `${window.location.origin}/abbonamento-confermato`,
          passthrough: JSON.stringify(customData)
        });
        setIsLoading(null);
      } else {
        // Metodo 2: Utilizzo del nostro backend come intermediario
        const checkoutData = await createCheckout(
          plan.priceId,
          user?.email || '', 
          customData
        );

        console.log('Risposta checkout:', checkoutData);

        // Redirect all'URL del checkout Paddle
        if (checkoutData?.url) {
          window.location.href = checkoutData.url;
        } else {
          console.error('URL checkout mancante nella risposta:', checkoutData);
          throw new Error('URL di checkout mancante nella risposta');
        }
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