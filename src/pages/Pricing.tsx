import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, ArrowLeft } from 'lucide-react';
import { StripeCheckoutButton } from '@/components/ui/stripe-payment';

const Pricing: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col items-center justify-start pt-12 md:pt-20 pb-12">
      <div className="text-center px-4 w-full max-w-4xl mx-auto space-y-8">
        {/* Intestazione */}
        <header className="space-y-4">
          <h1 className="text-5xl font-bold text-sky-700">ABBONAMENTI</h1>
          <p className="text-xl text-muted-foreground">
            Scegli il piano perfetto per gestire i tuoi affitti
          </p>
        </header>

        {/* Piani di abbonamento */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Piano Mensile */}
          <Card className="bg-white shadow-md border-2 hover:border-sky-500 transition-all duration-300 h-full">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Mensile</CardTitle>
              <CardDescription className="text-lg mt-2">Gestisci mese per mese</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-5xl font-bold">€20</span>
                <span className="text-muted-foreground">/mese</span>
                <p className="text-sm text-muted-foreground mt-2">Pagamento mensile per l'utilizzo completo del gestionale affitti</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Gestione di tutti gli immobili</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Tracciamento pagamenti</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Gestione contratti</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Supporto via email</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <StripeCheckoutButton planType="monthly" />
            </CardFooter>
          </Card>

          {/* Piano Annuale */}
          <Card className="bg-white shadow-lg border-2 border-sky-500 relative h-full">
            <div className="absolute -top-3 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              MIGLIOR SCELTA
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Annuale</CardTitle>
              <CardDescription className="text-lg mt-2">Risparmia con l'abbonamento annuale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-5xl font-bold">€200</span>
                <span className="text-muted-foreground">/anno</span>
                <p className="text-amber-600 font-medium mt-1">Risparmi €40!</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Gestione di tutti gli immobili</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Tracciamento pagamenti</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Gestione contratti</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Supporto prioritario 24/7</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Report analitici avanzati</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <StripeCheckoutButton planType="annual" />
            </CardFooter>
          </Card>
        </section>

        {/* FAQ o informazioni aggiuntive */}
        <section className="mt-12">
          <Card className="bg-white/50 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Domande Frequenti</h2>
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="font-medium">Come posso pagare?</h3>
                  <p className="text-muted-foreground">Accettiamo tutte le principali carte di credito, PayPal e bonifico bancario.</p>
                </div>
                <div>
                  <h3 className="font-medium">Posso disdire in qualsiasi momento?</h3>
                  <p className="text-muted-foreground">Sì, puoi disdire l'abbonamento in qualsiasi momento senza costi aggiuntivi.</p>
                </div>
                <div>
                  <h3 className="font-medium">Quali sono i vantaggi dell'abbonamento annuale?</h3>
                  <p className="text-muted-foreground">L'abbonamento annuale offre un risparmio significativo rispetto all'abbonamento mensile, oltre a report analitici avanzati e supporto prioritario.</p>
                </div>
                <div>
                  <h3 className="font-medium">I miei dati di pagamento sono sicuri?</h3>
                  <p className="text-muted-foreground">Sì, utilizziamo Stripe, uno dei sistemi di pagamento più sicuri al mondo. I tuoi dati sono sempre crittografati e non memorizziamo le informazioni della tua carta.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pulsante torna indietro */}
        <section className="mt-8">
          <Link to="/" className="inline-flex items-center text-sky-600 hover:text-sky-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Home
          </Link>
        </section>
      </div>
    </main>
  );
};

export default Pricing; 