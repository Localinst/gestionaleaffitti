import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, HelpCircle, Mail, MessageSquare, Phone } from "lucide-react";
import emailjs from '@emailjs/browser';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LandingNav } from "@/components/layout/LandingNav";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";

const SupportoPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const faqs = [
    {
      question: "Come posso iniziare a usare Tenoris360?",
      answer: "Per iniziare, registrati gratuitamente sul nostro sito. Dopo la registrazione, potrai iniziare ad aggiungere le tue proprietà e configurare il tuo account. Consulta la nostra guida iniziale per maggiori dettagli."
    },
    {
      question: "È possibile provare Tenoris360 prima di abbonarsi?",
      answer: "Sì, offriamo un periodo di prova gratuito di 14 giorni con tutte le funzionalità della versione Premium. Non è richiesta alcuna carta di credito per la registrazione alla prova."
    },
    {
      question: "Come posso annullare il mio abbonamento?",
      answer: "Puoi annullare il tuo abbonamento in qualsiasi momento dalla sezione 'Abbonamento' nel tuo profilo. L'annullamento sarà effettivo alla fine del ciclo di fatturazione corrente."
    },
    {
      question: "Tenoris360 può essere utilizzato per gestire proprietà in diversi paesi?",
      answer: "Sì, Tenoris360 può essere utilizzato per gestire proprietà in qualsiasi paese. Il sistema supporta diverse valute e formati fiscali."
    },
    {
      question: "Posso importare i dati dal mio precedente gestionale?",
      answer: "Sì, offriamo strumenti di importazione per trasferire facilmente i tuoi dati da altri sistemi. Contatta il nostro supporto per assistenza personalizzata nel processo di migrazione."
    },
    {
      question: "I miei dati sono al sicuro con Tenoris360?",
      answer: "Assolutamente sì. Utilizziamo crittografia avanzata e seguiamo rigorose pratiche di sicurezza per proteggere tutti i tuoi dati. Siamo inoltre conformi al GDPR e ad altre normative sulla privacy."
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formRef.current) return;
    
    setIsLoading(true);
    
    try {
      // Nota: Per far funzionare EmailJS, è necessario creare un account su emailjs.com
      // e sostituire questi valori con quelli del tuo account
      // In un'applicazione reale, questi valori dovrebbero essere in variabili d'ambiente
      const serviceId = 'YOUR_SERVICE_ID'; // sostituire con il tuo service ID
      const templateId = 'YOUR_TEMPLATE_ID'; // sostituire con il tuo template ID
      const publicKey = 'YOUR_PUBLIC_KEY'; // sostituire con la tua public key
      
      const templateParams = {
        from_name: `${formData.firstname} ${formData.lastname}`,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_email: 'tenoris360help@gmail.com'
      };
      
      // Per ora solo simuliamo l'invio
      // In produzione, decommentare questa riga:
      // await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      console.log("Invio email a tenoris360help@gmail.com");
      console.log("Dati del form:", templateParams);
      
      // Simuliamo un ritardo di invio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Messaggio inviato con successo",
        description: "Ti risponderemo al più presto.",
        variant: "default"
      });
      
      setFormSubmitted(true);
      
      // Reset del form
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
      
      toast({
        title: "Errore nell'invio del messaggio",
        description: "Si è verificato un errore. Riprova più tardi o contattaci direttamente via email.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="flex-1">
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <PageBreadcrumb items={[{ label: "Supporto" }]} />
            
            <div className="flex flex-col gap-2 mb-12">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
                <ArrowLeft className="h-4 w-4" />
                <span>Torna alla home</span>
              </Link>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Supporto Clienti
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-[700px]">
                Siamo qui per aiutarti con qualsiasi domanda o problema relativo all'uso di Tenoris360
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-semibold mb-6">Contattaci</h2>
                
                {formSubmitted ? (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center gap-4 py-4">
                        <CheckCircle className="h-12 w-12 text-primary" />
                        <h3 className="text-xl font-medium">Messaggio Inviato!</h3>
                        <p className="text-muted-foreground">
                          Grazie per averci contattato. Ti risponderemo entro 24 ore lavorative.
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => setFormSubmitted(false)}
                        >
                          Invia un altro messaggio
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="firstname" className="text-sm font-medium">
                          Nome
                        </label>
                        <Input 
                          id="firstname" 
                          name="firstname"
                          placeholder="Il tuo nome" 
                          required 
                          value={formData.firstname}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastname" className="text-sm font-medium">
                          Cognome
                        </label>
                        <Input 
                          id="lastname" 
                          name="lastname"
                          placeholder="Il tuo cognome" 
                          required 
                          value={formData.lastname}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        placeholder="La tua email" 
                        required 
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        Oggetto
                      </label>
                      <Input 
                        id="subject" 
                        name="subject"
                        placeholder="Oggetto della richiesta" 
                        required 
                        value={formData.subject}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Messaggio
                      </label>
                      <Textarea 
                        id="message" 
                        name="message"
                        rows={5} 
                        placeholder="Descrivi la tua richiesta..." 
                        required 
                        value={formData.message}
                        onChange={handleInputChange}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Invio in corso..." : "Invia Messaggio"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Il tuo messaggio sarà inviato a tenoris360help@gmail.com
                    </p>
                  </form>
                )}

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>+393663958461</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>tenoris360help@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>Chat live disponibile Lun-Ven, 9:00-18:00</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-6">Domande Frequenti</h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg overflow-hidden">
                      <AccordionTrigger className="p-4 hover:bg-muted/50">
                        <div className="flex items-center gap-3 text-left">
                          <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                          <span className="font-medium">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="pl-8">
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <div className="mt-6 text-center">
                  <Link to="/guide">
                    <Button variant="outline">
                      Consulta tutte le guide
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-8">
        <div className="container px-4 md:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tenoris360. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SupportoPage; 