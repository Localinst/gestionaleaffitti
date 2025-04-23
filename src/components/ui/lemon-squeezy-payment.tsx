import { useState } from 'react';
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

export const LemonSqueezyPayment = ({
  planOptions,
  title = 'Scegli il tuo piano',
  subtitle = 'Inizia subito a utilizzare tutte le funzionalità del gestionale',
}: LemonSqueezyPaymentProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useAuth();

  const handleCheckout = async (plan: PlanOption) => {
    try {
      setIsLoading(plan.variantId);

      const customData = {
        userId: user?.id,
        planName: plan.name,
      };

      const checkoutData = await createCheckout(
        plan.variantId,
        user?.email,
        customData
      );

      // Redirect all'URL del checkout Lemon Squeezy
      if (checkoutData.data.attributes.url) {
        window.location.href = checkoutData.data.attributes.url;
      } else {
        throw new Error('URL di checkout mancante');
      }
    } catch (error) {
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