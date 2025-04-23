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
      question: "È davvero gratuito?",
      answer: "Sì, il servizio è completamente gratuito per tutti gli utenti. Nessun costo nascosto."
    },
    {
      question: "Ci sono limitazioni nella versione gratuita?",
      answer: "No, avrai accesso a tutte le funzionalità del sistema senza alcuna limitazione."
    },
    {
      question: "Perché avete reso il servizio gratuito?",
      answer: "Vogliamo che tutti possano beneficiare di uno strumento professionale per la gestione degli affitti, indipendentemente dal budget."
    },
    {
      question: "Per quanto tempo rimarrà gratuito?",
      answer: "Il servizio rimarrà gratuito per sempre. Ci impegniamo a mantenere questa promessa ai nostri utenti."
    }
  ];

  const [plans, setPlans] = useState([]);
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
              ? `€${(variant.attributes.price / 100).toFixed(0)}/${
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Caricamento piani in corso...</p>
          </div>
        ) : (
          <LemonSqueezyPayment
            planOptions={plans}
            title="Scegli il piano più adatto alle tue esigenze"
            subtitle="Tutti i piani includono accesso completo a tutte le funzionalità"
          />
        )}
      </main>
    </div>
  );
};

export default Pricing; 