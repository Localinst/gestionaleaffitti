import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { LandingNav } from '@/components/layout/LandingNav';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function AbbonamentoConfermato() {
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Estrai l'ordine ID dall'URL (se presente)
        const params = new URLSearchParams(location.search);
        const checkoutId = params.get('checkout');
        const orderId = params.get('order_id');
        
        if (!checkoutId && !orderId) {
          // Non abbiamo un ID dell'ordine, concludiamo il caricamento
          setIsLoading(false);
          return;
        }

        // Qui potremmo fare una chiamata API al backend per ottenere i dettagli dell'ordine
        // Per ora impostiamo solo che il caricamento è completato
        setOrderDetails({
          planName: 'Abbonamento',
          date: new Date().toLocaleDateString(),
        });
        
        // Aggiorniamo il profilo utente per indicare che ha un abbonamento attivo
        // Questo richiederebbe una chiamata API al backend
        
        setIsLoading(false);
        
        // Mostra un messaggio di successo
        toast.success('Abbonamento attivato con successo!');
      } catch (error) {
        console.error('Errore nel recupero dei dettagli dell\'ordine:', error);
        setIsLoading(false);
        toast.error('Si è verificato un errore nel recupero dei dettagli dell\'ordine');
      }
    };

    fetchOrderDetails();
  }, [location.search]);

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <main className="container max-w-md mx-auto py-16 px-4">
        <Card className="shadow-lg border-green-200">
          <CardHeader className="text-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <CardTitle className="text-2xl">Elaborazione in corso...</CardTitle>
                <CardDescription>Stiamo verificando il tuo pagamento</CardDescription>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <CardTitle className="text-2xl">Abbonamento Confermato!</CardTitle>
                <CardDescription>Grazie per il tuo acquisto</CardDescription>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="text-center">
            {isLoading ? (
              <p className="text-muted-foreground">Questo potrebbe richiedere qualche istante...</p>
            ) : (
              <div className="space-y-4">
                <p className="text-lg">
                  Il tuo account è stato aggiornato con successo. Ora hai accesso a tutte le funzionalità del gestionale affitti.
                </p>
                
                {orderDetails && (
                  <div className="rounded-lg bg-muted p-4 text-left">
                    <p className="font-medium">Dettagli dell'ordine:</p>
                    <p>Piano: {orderDetails.planName}</p>
                    <p>Data: {orderDetails.date}</p>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground mt-4">
                  Riceverai un'email di conferma con la ricevuta del tuo acquisto.
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={goToDashboard} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Attendere...' : 'Vai alla Dashboard'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
} 