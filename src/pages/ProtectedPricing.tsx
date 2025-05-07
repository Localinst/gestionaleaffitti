import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Header } from "@/components/layout/Header";
import { StripePayment } from "@/components/ui/stripe-payment";
import { getProducts, getProductVariants } from "@/services/lemon-squeezy-api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from 'react-i18next';

const ProtectedPricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

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
      description: "Pagamento mensile flessibile",
      price: "€19,99/mese",
      features: [
        "Gestione completa delle proprietà",
        "Gestione inquilini illimitati",
        "Tracciamento pagamenti automatico",
        "Dashboard analitica",
        "Supporto email prioritario",
        "Backup settimanali",
        "Report avanzati"
      ],
      variantId: "https://tenoris360.lemonsqueezy.com/buy/1101e76e-e411-41d1-832b-d1fd5f534775",
      priceId: "pri_01hqwertyuiopasdfghjklzx",
    },
    {
      id: "plan-annual",
      name: "Piano Annuale",
      description: "Risparmio del 16% sul pagamento annuale",
      price: "€199,99/anno",
      features: [
        "Gestione completa delle proprietà",
        "Gestione inquilini illimitati",
        "Tracciamento pagamenti automatico",
        "Dashboard analitica",
        "Supporto email prioritario",
        "Backup settimanali",
        "Report avanzati"
      ],
      isPopular: true,
      variantId: "https://tenoris360.lemonsqueezy.com/buy/34ba8568-c3af-42d2-9d64-052f90879543",
      priceId: "pri_02hqwertyuiopasdfghjklzx",
    },
  ];

  const [plans, setPlans] = useState(planOptions);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Messaggio di benvenuto
    toast({
      title: "Benvenuto in Tenoris360!",
      description: "Per iniziare a utilizzare l'app, seleziona un piano di abbonamento.",
    });

    /* Rimuovo il caricamento dei piani dal backend
    const fetchPlansData = async () => {
      try {
        setIsLoading(true);
        // Carica i prodotti da Lemon Squeezy
        const productsResponse = await getProducts();
        console.log('Prodotti caricati da Lemon Squeezy:', productsResponse);
        const products = productsResponse.data || [];

        if (products.length === 0) {
          console.log('Nessun prodotto trovato, uso i piani predefiniti');
          setIsLoading(false);
          return;
        }

        // Per ogni prodotto, carica le sue varianti
        const updatedPlans = await Promise.all(
          products.map(async (product: any) => {
            console.log('Elaborazione prodotto:', product.id, product.attributes?.name);
            const variantsResponse = await getProductVariants(product.id);
            console.log('Varianti prodotto:', variantsResponse);
            const variants = variantsResponse.data || [];

            // Se il prodotto ha varianti, usa la prima
            const variant = variants.length > 0 ? variants[0] : null;
            console.log('Variante selezionata:', variant?.id, variant?.attributes?.name);

            // Trova il piano corrispondente nei default plans
            const matchingPlan = planOptions.find(
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

        console.log('Piani aggiornati:', updatedPlans);

        // Filtra i piani nulli e aggiorna lo stato
        setPlans(updatedPlans.filter(Boolean));
        setIsLoading(false);
      } catch (error) {
        console.error("Errore nel caricamento dei piani:", error);
        setIsLoading(false);
      }
    };

    fetchPlansData();
    */
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-6xl mx-auto py-16 px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter mb-4">{t('pricing.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            {t('pricing.description')}
          </p>
        </div>
        
        {isLoading ? (
          <div className="absolute top-4 right-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : null}
        
        <section className="container  md:py-12 lg:py-24">
          <StripePayment 
            planOptions={planOptions}
            title="Scegli il tuo piano"
            subtitle="Entrambe le opzioni includono tutte le funzionalità. Scegli la durata che preferisci."
          />
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
      </main>
    </div>
  );
};

export default ProtectedPricing; 