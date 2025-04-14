import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, HelpCircle, Mail, MessageSquare, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LandingNav } from "@/components/layout/LandingNav";

const SupportoPage = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setFormSubmitted(true);
    // Reset form after submission in a real application
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="flex-1">
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
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
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="firstname" className="text-sm font-medium">
                          Nome
                        </label>
                        <Input id="firstname" placeholder="Il tuo nome" required />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastname" className="text-sm font-medium">
                          Cognome
                        </label>
                        <Input id="lastname" placeholder="Il tuo cognome" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input id="email" type="email" placeholder="La tua email" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        Oggetto
                      </label>
                      <Input id="subject" placeholder="Oggetto della richiesta" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Messaggio
                      </label>
                      <Textarea id="message" rows={5} placeholder="Descrivi la tua richiesta..." required />
                    </div>
                    <Button type="submit" className="w-full">
                      Invia Messaggio
                    </Button>
                  </form>
                )}

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>+393663958461</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>tenoris360@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span>Chat live disponibile Lun-Ven, 9:00-18:00</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-6">Domande Frequenti</h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex gap-3">
                          <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-medium mb-2">{faq.question}</h3>
                            <p className="text-muted-foreground text-sm">{faq.answer}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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