import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, ArrowLeft, Loader2, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/layout/PageBreadcrumb';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LandingNav } from "@/components/layout/LandingNav";
import { LemonSqueezyPayment } from "@/components/ui/lemon-squeezy-payment";
import { getProducts, getProductVariants, testLemonSqueezyConnection } from "@/services/lemon-squeezy-api";
import { useToast } from "@/components/ui/use-toast";

// Importo i nuovi componenti Paddle
import { PaddlePayment } from "@/components/ui/paddle-payment";
import { getProducts as getPaddleProducts, getProductVariants as getPaddlePrices, testPaddleConnection } from "@/services/paddle-api";

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Posso provare il servizio prima di pagare?",
      answer: "Sì, offriamo un periodo di prova gratuito di 14 giorni con accesso a tutte le funzionalità. Non è richiesta carta di credito per la registrazione alla prova."
    },
    {
      question: "Ci sono limitazioni nella versione standard?",
      answer: "No, avrai accesso a tutte le funzionalità del sistema, inclusi aggiornamenti e nuove funzionalità."
    },
    {
      question: "Come posso annullare il mio abbonamento?",
      answer: "Puoi annullare l'abbonamento in qualsiasi momento dalla pagina del tuo profilo. Ti rimborseremo proporzionalmente per il periodo non utilizzato."
    },
    {
      question: "Sono previsti sconti per pagamenti annuali?",
      answer: "Sì, con il piano annuale risparmi due mesi rispetto al pagamento mensile, pagando l'equivalente di 10 mesi per un anno intero."
    }
  ];

  // Definizione dei piani standard con URL di checkout diretto
  const defaultPlans = [
    {
      id: "plan-monthly",
      name: "Piano Mensile",
      description: "Ideale per chi inizia",
      price: "€19,99/mese",
      features: [
        "Gestione completa delle proprietà",
        "Gestione inquilini illimitati",
        "Tracciamento pagamenti automatico",
        "Dashboard analitica",
        "Supporto email"
      ],
      // URL completo di checkout
      variantId: "https://tenoris360.lemonsqueezy.com/buy/1101e76e-e411-41d1-832b-d1fd5f534775",
    },
    {
      id: "plan-annual",
      name: "Piano Annuale",
      description: "La soluzione più conveniente",
      price: "€199,99/anno",
      features: [
        "Tutte le funzionalità del piano mensile",
        "Risparmio di 2 mesi",
        "Supporto prioritario",
        "Backup settimanali",
        "Report avanzati"
      ],
      // Per il piano annuale, dovrai ottenere il suo ID specifico in modo simile
      // Nota: Per ora, utilizziamo lo stesso ID del piano mensile per test
      variantId: "https://tenoris360.lemonsqueezy.com/buy/34ba8568-c3af-42d2-9d64-052f90879543",
      isPopular: true,
    }
  ];

  const [plans, setPlans] = useState(defaultPlans);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Testiamo la nuova connessione Paddle
        const testResult = await testPaddleConnection();
        console.log('Test connessione Paddle:', testResult);
        
        // Teniamo il test LemonSqueezy per retrocompatibilità durante la migrazione
        const lemonSqueezyTestResult = await testLemonSqueezyConnection();
        console.log('Test connessione LemonSqueezy:', lemonSqueezyTestResult);
        
        // Solo per debug
        if (testResult.success) {
          console.log('Connessione a Paddle riuscita!');
        } else {
          console.warn('La connessione a Paddle ha fallito, consulta i log per dettagli.');
        }
        
      } catch (error) {
        console.error('Errore durante il test di connessione:', error);
      }
    };
    
    testConnection();
  }, []);

  const planOptions = [
    {
      id: "plan-monthly",
      name: "Piano Mensile",
      description: "Ideale per chi inizia",
      price: "€19,99/mese",
      features: [
        "Gestione completa delle proprietà",
        "Gestione inquilini illimitati",
        "Tracciamento pagamenti automatico",
        "Dashboard analitica",
        "Supporto email"
      ],
      // Vecchio LemonSqueezy
      variantId: "https://tenoris360.lemonsqueezy.com/buy/1101e76e-e411-41d1-832b-d1fd5f534775",
      // Nuovo Paddle
      priceId: "pri_01hqwertyuiopasdfghjklzx", // Sostituisci con il tuo ID Paddle reale
    },
    {
      id: "plan-annual",
      name: "Piano Annuale",
      description: "La soluzione più conveniente",
      price: "€199,99/anno",
      features: [
        "Tutte le funzionalità del piano mensile",
        "Risparmio di 2 mesi",
        "Supporto prioritario",
        "Backup settimanali",
        "Report avanzati"
      ],
      isPopular: true,
      // Vecchio LemonSqueezy
      variantId: "https://tenoris360.lemonsqueezy.com/buy/34ba8568-c3af-42d2-9d64-052f90879543",
      // Nuovo Paddle
      priceId: "pri_02hqwertyuiopasdfghjklzx", // Sostituisci con il tuo ID Paddle reale
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="container max-w-6xl mx-auto py-16 px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter mb-4">Piani e Prezzi</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Scegli il piano più adatto alle tue esigenze e inizia a semplificare la gestione dei tuoi affitti con Tenoris360.
          </p>
        </div>
        
        {isLoading ? (
          <div className="absolute top-4 right-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : null}
        
        <section className="container py-8 md:py-12 lg:py-24">
          {/* Usa PaddlePayment invece di LemonSqueezyPayment */}
          <PaddlePayment planOptions={planOptions} />
          
          {/* Mantieni temporaneamente anche LemonSqueezyPayment nascosto per garantire compatibilità durante la transizione */}
          <div style={{ display: 'none' }}>
            <LemonSqueezyPayment planOptions={planOptions} />
          </div>
        </section>

        {/* FAQ con accordion */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Domande Frequenti</h2>
          <Card className="bg-white/50 shadow-sm">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Sezione di garanzia */}
        <section className="mt-16 text-center">
          <div className="bg-primary/5 py-8 px-4 rounded-lg max-w-3xl mx-auto">
            <h3 className="text-xl font-bold mb-4">Garanzia di rimborso di 30 giorni</h3>
            <p className="text-muted-foreground">
              Se non sei completamente soddisfatto del nostro servizio entro i primi 30 giorni dall'acquisto, 
              ti rimborseremo completamente. Nessuna domanda, nessun vincolo.
            </p>
          </div>
        </section>

        {/* Pulsante torna indietro */}
        <section className="mt-12 text-center">
          <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Home
          </Link>
        </section>

        {/* Aggiungi un pulsante diagnostico (visibile solo in sviluppo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4">
            <Button 
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-yellow-50 border-yellow-200 text-yellow-700"
              onClick={async () => {
                try {
                  const testResult = await testLemonSqueezyConnection();
                  console.log('Test connessione Lemon Squeezy:', testResult);
                  alert(`Test connessione: ${testResult.success ? 'OK' : 'FALLITO'}\n${JSON.stringify(testResult, null, 2)}`);
                } catch (error) {
                  console.error('Errore nel test:', error);
                  alert(`Errore test: ${error.message}`);
                }
              }}
            >
              <Bug className="w-4 h-4" /> Test Lemon
            </Button>
          </div>
        )}
      </main>
      </div>
  );
};

export default Pricing; 