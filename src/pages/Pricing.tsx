import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/layout/PageBreadcrumb';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LandingNav } from "@/components/layout/LandingNav";
import { useToast } from "@/components/ui/use-toast";

// Importo Stripe
import { StripePayment } from "@/components/ui/stripe-payment";

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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
      // ID prezzo Stripe per il piano mensile
      priceId: "price_monthly",
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
      // ID prezzo Stripe per il piano annuale
      priceId: "price_annual",
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
        
        <section className="container ">
          <StripePayment planOptions={planOptions} />
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
      </main>
      </div>
  );
};

export default Pricing; 