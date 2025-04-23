import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/layout/PageBreadcrumb';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LandingNav } from "@/components/layout/LandingNav";
import { LemonSqueezyPayment } from "@/components/ui/lemon-squeezy-payment";
import { getProducts, getProductVariants } from "@/services/lemon-squeezy-api";

const Pricing: React.FC = () => {
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

  // Definizione dei piani standard
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
      variantId: "monthly-variant-id",
    },
    {
      id: "plan-annual",
      name: "Piano Annuale",
      description: "La soluzione più conveniente",
      price: "€199,90/anno",
      features: [
        "Tutte le funzionalità del piano mensile",
        "Risparmio di 2 mesi",
        "Supporto prioritario",
        "Backup settimanali",
        "Report avanzati"
      ],
      variantId: "annual-variant-id",
      isPopular: true,
    }
  ];

  const [plans, setPlans] = useState(defaultPlans);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlansData = async () => {
      try {
        // Carica i prodotti da Lemon Squeezy
        const productsResponse = await getProducts();
        const products = productsResponse.data || [];

        if (products.length === 0) {
          setIsLoading(false);
          return;
        }

        // Per ogni prodotto, carica le sue varianti
        const updatedPlans = await Promise.all(
          products.map(async (product: any) => {
            const variantsResponse = await getProductVariants(product.id);
            const variants = variantsResponse.data || [];

            // Se il prodotto ha varianti, usa la prima
            const variant = variants.length > 0 ? variants[0] : null;

            // Trova il piano corrispondente nei default plans
            const matchingPlan = defaultPlans.find(
              (plan) => plan.name.toLowerCase().includes(product.attributes.name.toLowerCase())
            );

            if (!matchingPlan) return null;

            // Estrai il prezzo dalla variante
            const price = variant
              ? `€${(variant.attributes.price / 100).toFixed(2)}/${
                  variant.attributes.interval === "month" ? "mese" : "anno"
                }`
              : matchingPlan.price;

            return {
              ...matchingPlan,
              name: product.attributes.name,
              description: product.attributes.description || matchingPlan.description,
              price,
              variantId: variant ? variant.id : matchingPlan.variantId,
            };
          })
        );

        // Filtra i piani nulli e aggiorna lo stato
        setPlans(updatedPlans.filter(Boolean));
        setIsLoading(false);
      } catch (error) {
        console.error("Errore nel caricamento dei piani:", error);
        setIsLoading(false);
      }
    };

    fetchPlansData();
  }, []);

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
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Caricamento piani in corso...</p>
          </div>
        ) : plans.length > 0 ? (
          <LemonSqueezyPayment
            planOptions={plans}
            title="Scegli il tuo piano"
            subtitle="Tutti i piani includono accesso completo a tutte le funzionalità"
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            <Card className="flex flex-col border-2 border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Piano Mensile</CardTitle>
                <CardDescription>Flessibilità massima</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <p className="text-3xl font-bold">€19,99<span className="text-lg font-normal text-muted-foreground">/mese</span></p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Gestione completa delle proprietà</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Gestione inquilini illimitati</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Tracciamento pagamenti automatico</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Dashboard analitica</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Supporto email</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/register" className="w-full">
                  <Button className="w-full">Inizia Ora</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col border-2 border-primary shadow-lg relative">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <div className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                  Piano più popolare
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Piano Annuale</CardTitle>
                <CardDescription>Risparmia 2 mesi</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <p className="text-3xl font-bold">€199,90<span className="text-lg font-normal text-muted-foreground">/anno</span></p>
                  <p className="text-sm text-muted-foreground">Equivalente a €16,66/mese</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Tutte le funzionalità del piano mensile</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Risparmio di 2 mesi</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Supporto prioritario</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Backup settimanali</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Report avanzati</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/register" className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90">Abbonati ora</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        )}

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