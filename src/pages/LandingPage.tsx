import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Building, Home, KeyRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingNav } from "@/components/layout/LandingNav";

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState<number>(0);

  const features = [
    {
      icon: <Building className="h-10 w-10 text-primary" />,
      title: "Gestione Proprietà",
      description: "Tieni traccia di tutti i tuoi immobili in un unico posto con dettagli completi e immagini."
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Amministrazione Inquilini",
      description: "Gestisci facilmente contratti, comunicazioni e pagamenti degli inquilini."
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
      title: "Analisi Finanziaria",
      description: "Visualizza grafici dettagliati e rapporti sul rendimento dei tuoi investimenti immobiliari."
    },
    {
      icon: <KeyRound className="h-10 w-10 text-primary" />,
      title: "Scadenze & Rinnovi",
      description: "Ricevi notifiche automatiche per scadenze di contratti e manutenzioni programmate."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Gestionale Affitti</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Funzionalità
            </a>
            <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Piani
            </Link>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonianze
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Accedi</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Registrati</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="sm">Abbonamenti</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Semplifica la gestione dei tuoi affitti
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl">
                La piattaforma completa per proprietari e amministratori immobiliari che desiderano 
                gestire contratti, inquilini e pagamenti in modo efficiente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Link to="/register">
                  <Button size="lg" className="gap-2">
                    Inizia Gratuitamente
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline">
                    Scopri di più
                  </Button>
                </a>
              </div>
            </div>
            <div className="relative lg:ml-auto">
              <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-xl">
                <div className="glass-card hover-scale animate-fade-in w-full h-full flex items-center justify-center">
                  <img 
                    src="/dashboard.png" 
                    alt="Anteprima Dashboard" 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Funzionalità Principali
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-[800px]">
              La nostra piattaforma offre strumenti completi per ottimizzare la gestione dei tuoi immobili in affitto.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all hover-scale ${activeFeature === index ? 'border-primary' : ''}`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="mt-1">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-xl">{feature.title}</h3>
                      <p className="text-muted-foreground mt-2">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl border border-border bg-card">
              {activeFeature === 0 && (
                <div className="p-6 animate-fade-in">
                  <h3 className="text-xl font-semibold mb-4">Gestisci tutte le proprietà</h3>
                  <img 
                    src="/proprieta.png" 
                    alt="Gestione Proprietà" 
                    className="rounded-lg w-full shadow-lg"
                  />
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Dashboard centralizzata per tutte le proprietà</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Gestione documenti e fotografie</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Storico manutenzioni e riparazioni</span>
                    </li>
                  </ul>
                </div>
              )}
              {activeFeature === 1 && (
                <div className="p-6 animate-fade-in">
                  <h3 className="text-xl font-semibold mb-4">Gestione completa degli inquilini</h3>
                  <img 
                    src="/inquilini.png" 
                    alt="Gestione Inquilini" 
                    className="rounded-lg w-full shadow-lg"
                  />
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Registrazione dati e documenti inquilini</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Gestione contratti con rinnovi automatici</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Tracciamento comunicazioni</span>
                    </li>
                  </ul>
                </div>
              )}
              {activeFeature === 2 && (
                <div className="p-6 animate-fade-in">
                  <h3 className="text-xl font-semibold mb-4">Analytics avanzate</h3>
                  <img 
                    src="/andamentof.png" 
                    alt="Analisi Finanziaria" 
                    className="rounded-lg w-full shadow-lg"
                  />
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Dashboard finanziaria in tempo reale</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Grafici di performance degli investimenti</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Reportistica fiscale automatizzata</span>
                    </li>
                  </ul>
                </div>
              )}
              {activeFeature === 3 && (
                <div className="p-6 animate-fade-in">
                  <h3 className="text-xl font-semibold mb-4">Sistema di notifiche</h3>
                  <img 
                    src="/attivita.png" 
                    alt="Sistema Promemoria" 
                    className="rounded-lg w-full shadow-lg"
                  />
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Avvisi per scadenze contrattuali</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Promemoria pagamenti in ritardo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      <span>Notifiche manutenzioni programmate</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Pronto a semplificare la gestione dei tuoi affitti?
          </h2>
          <p className="mt-4 text-primary-foreground/90 text-lg max-w-[800px] mx-auto">
            Registrati oggi e scopri come il nostro gestionale può aiutarti 
            a risparmiare tempo e aumentare la redditività dei tuoi investimenti.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Inizia Gratuitamente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Home className="h-5 w-5 text-primary" />
                <span className="font-bold">Gestionale Affitti</span>
              </div>
              <p className="text-muted-foreground text-sm">
                La soluzione completa per la gestione degli affitti e delle proprietà immobiliari.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Link Rapidi</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Funzionalità
                  </a>
                </li>
                <li>
                  <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Piani e Prezzi
                  </Link>
                </li>
                <li>
                  <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                    Testimonianze
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Risorse</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Supporto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legale</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Termini di Servizio
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Gestionale Affitti. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>

     
    </div>
  );
};

export default LandingPage;
