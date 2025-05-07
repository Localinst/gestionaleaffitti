import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BarChart3, Building, Home, KeyRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingNav } from "@/components/layout/LandingNav";
import SEO from '@/components/SEO';
import { getHreflangUrls } from '@/i18n';
import { useTranslation } from "react-i18next";

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const featuresRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    // Gestisce lo scroll alle sezioni quando si accede tramite URL
    if (location.pathname === "/features") {
      featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (location.pathname === "/testimonials") {
      testimonialsRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (location.hash === "#features") {
      featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (location.hash === "#testimonials") {
      testimonialsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  useEffect(() => {
    // Emetto un evento custom per segnalare che il rendering è completo
    const event = new Event('render-complete');
    document.dispatchEvent(event);

    // Script di tracking per Google Search Console (opzionale)
    if (typeof window !== 'undefined') {
      // Comunica a Google che la navigazione è cambiata
      if ((window as any).gtag) {
        (window as any).gtag('config', 'G-ZNFK6CQ3LM', {
          page_path: window.location.pathname,
        });
      }
    }
  }, []);

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
    <>
      <SEO 
        title="Software Gestionale Premium per Affitti e Immobili"
        description="Tenoris360: il software gestionale professionale per affitti e immobili. Semplifica la gestione di proprietà, inquilini, B&B, contratti, pagamenti e report."
        keywords={[
          "software gestione affitti", 
          "gestionale immobiliare", 
          "property management software", 
          "affitti brevi", 
          "B&B", 
          "contratti di locazione"
        ]}
        canonicalUrl="https://tenoris360.com/"
        hreflang={getHreflangUrls(location.pathname)}
      />
      <div className="min-h-screen flex flex-col">
        {/* Header/Navigation */}
        <LandingNav />

        {/* Hero Section */}
        <section className="relative py-10 lg:py-24 overflow-hidden bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  {t("landing.hero.title")} <span className="text-primary">Tenoris360</span>
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl">
                  {t("landing.hero.description")}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Link to="/register">
                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                      {t("landing.hero.cta.register")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto mt-3 sm:mt-0">
                      {t("landing.hero.cta.learnMore")}
                    </Button>
                  </a>
                </div>
              </div>
              <div className="relative lg:ml-auto">
                <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-2xl border border-primary/10">
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
        
        {/* Prezzo in evidenza */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4 md:px-6 text-center">
            <div className="inline-block bg-primary/10 rounded-full px-4 py-2 mb-4">
              <span className="text-primary font-semibold">14 Giorni di Prova Gratuita</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Prova tutte le funzionalità senza impegno</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Inizia subito la tua prova gratuita di 14 giorni. Nessuna carta di credito richiesta, nessun impegno. Scopri come Tenoris360 può semplificare la gestione dei tuoi immobili.
            </p>
            <div className="flex flex-col items-center">
              <Link to="/register" className="mt-6">
                <Button size="lg">Inizia la Prova Gratuita</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" ref={featuresRef} className="py-20 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t("landing.features.title")}
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-[800px]">
                {t("landing.features.description")}
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
                        <h3 className="font-semibold text-xl">{t(`landing.features.items.${index}.title`, feature.title)}</h3>
                        <p className="text-muted-foreground mt-2">{t(`landing.features.items.${index}.description`, feature.description)}</p>
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

        {/* Testimonials Section */}
        <section id="testimonials" ref={testimonialsRef} className="py-20 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t("testimonials.title")}
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-[800px]">
                {t("testimonials.description")}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-muted/40">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm font-medium">5.0</p>
                    </div>
                    <p className="text-foreground italic">
                      {t("testimonials.feedback.example")}
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="rounded-full bg-primary/10 p-1 w-10 h-10 flex items-center justify-center text-primary font-semibold">
                        ML
                      </div>
                      <div>
                        <p className="font-medium">Marco Lombardi</p>
                        <p className="text-sm text-muted-foreground">Proprietario, Milano</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/40">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm font-medium">5.0</p>
                    </div>
                    <p className="text-foreground italic">
                      "Come agenzia immobiliare, Tenoris360 ci ha permesso di digitalizzare tutti i processi. L'analisi finanziaria è straordinaria e i nostri clienti apprezzano la trasparenza."
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="rounded-full bg-primary/10 p-1 w-10 h-10 flex items-center justify-center text-primary font-semibold">
                        GR
                      </div>
                      <div>
                        <p className="font-medium">Giulia Rossi</p>
                        <p className="text-sm text-muted-foreground">Immobiliare Aurora, Roma</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/40">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm font-medium">5.0</p>
                    </div>
                    <p className="text-foreground italic">
                      "Da quando uso Tenoris360, risparmio almeno 10 ore a settimana. La gestione automatica dei pagamenti è fantastica e il supporto clienti è sempre disponibile."
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="rounded-full bg-primary/10 p-1 w-10 h-10 flex items-center justify-center text-primary font-semibold">
                        AF
                      </div>
                      <div>
                        <p className="font-medium">Antonio Ferrari</p>
                        <p className="text-sm text-muted-foreground">Property Manager, Napoli</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {t("landing.cta.title", "Pronto a semplificare la gestione dei tuoi affitti?")}
            </h2>
            <p className="mt-6 text-primary-foreground/90 text-lg max-w-[700px] mx-auto">
              {t("landing.cta.description", "Registrati oggi e scopri come il nostro gestionale può aiutarti a risparmiare tempo e aumentare la redditività dei tuoi investimenti.")}
            </p>
            <div className="mt-10">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2 px-8 py-6 text-lg">
                  {t("landing.hero.cta.register")}
                  <ArrowRight className="h-5 w-5" />
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
                  <img src="/simbolologo.png" alt="Tenoris360 Logo" className="h-5 w-auto" />
                  <span className="font-bold">Tenoris360</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {t("footer.companyDescription")}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{t("footer.quickLinks")}</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("landing.nav.features")}
                    </a>
                  </li>
                  <li>
                    <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("landing.nav.freeService")}
                    </Link>
                  </li>
                  <li>
                    <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("landing.nav.testimonials")}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{t("footer.resources")}</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link to="/guide" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("common.navigation.guides")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/supporto" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("common.navigation.support")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">{t("footer.legal")}</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/termini" className="text-muted-foreground hover:text-foreground transition-colors">
                      {t("footer.termsOfService")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/cookie" className="text-muted-foreground hover:text-foreground transition-colors">
                      Cookie Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/rimborsi" className="text-muted-foreground hover:text-foreground transition-colors">
                      Politica di Rimborso
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Tenoris360. {t("footer.allRightsReserved")}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
