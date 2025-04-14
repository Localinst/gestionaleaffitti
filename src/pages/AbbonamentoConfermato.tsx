import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const AbbonamentoConfermato: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Qui potresti verificare la sessione con il backend
      // Per ora simuliamo solo un caricamento
      const timer = setTimeout(() => {
        setLoading(false);
        setSessionDetails({
          status: 'success',
          subscription: {
            plan: 'monthly', // o 'annual' a seconda del piano scelto
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 giorni
          }
        });
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setLoading(false);
      setError('Parametro di sessione mancante');
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Conferma abbonamento</CardTitle>
            <CardDescription>Stiamo verificando il tuo pagamento...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin my-8"></div>
            <p className="text-muted-foreground text-center">
              Questo processo può richiedere alcuni secondi
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-500">Errore</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Link to="/pricing">
              <Button className="mt-4">Torna alla pagina abbonamenti</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle size={80} className="text-green-500" />
          </div>
          <CardTitle className="text-2xl">Abbonamento attivato con successo!</CardTitle>
          <CardDescription>Grazie per il tuo abbonamento al Gestionale Affitti</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Dettagli abbonamento</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Piano: {sessionDetails?.subscription?.plan === 'monthly' ? 'Mensile' : 'Annuale'}
            </p>
            <p className="text-sm text-muted-foreground">
              Prossimo rinnovo: {sessionDetails?.subscription?.current_period_end.toLocaleDateString('it-IT')}
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Abbiamo inviato una ricevuta dettagliata all'indirizzo email fornito durante il pagamento.
            </p>
            
            <div className="flex flex-col gap-3">
              <Link to="/dashboard">
                <Button className="w-full">Vai alla dashboard</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full">Torna alla home</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AbbonamentoConfermato; 