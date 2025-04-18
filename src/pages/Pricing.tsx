import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/layout/PageBreadcrumb';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col items-center justify-start pt-12 md:pt-20 pb-12">
      <div className="text-center px-4 w-full max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="text-left max-w-4xl w-full mx-auto">
          <PageBreadcrumb items={[{ label: "Prezzi" }]} />
        </div>
        
        {/* Intestazione */}
        <header className="space-y-4">
          <h1 className="text-5xl font-bold text-sky-700">SERVIZIO GRATUITO</h1>
          <p className="text-xl text-muted-foreground">
            Gestionale Affitti è ora completamente gratuito per tutti gli utenti
          </p>
        </header>

        {/* Piano gratuito */}
        <section className="mt-8 grid max-w-md mx-auto">
          <Card className="bg-white shadow-md border-2 border-green-500 transition-all duration-300 h-full">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Piano Completo</CardTitle>
              <CardDescription className="text-lg mt-2">Tutte le funzionalità incluse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-5xl font-bold">€0</span>
                <span className="text-muted-foreground">/sempre</span>
                <p className="text-sm text-muted-foreground mt-2">Accesso completo a tutte le funzionalità del gestionale affitti</p>
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
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Report analitici avanzati</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link to="/register" className="w-full">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Registrati Gratis
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </section>

        {/* FAQ con accordion */}
        <section className="mt-12">
          <Card className="bg-white/50 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Domande Frequenti</h2>
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