import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Download, Mail } from "lucide-react";
import { guides } from "@/data/guides";
import { getCurrentLanguage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { HelmetSEO } from "@/components/HelmetSEO";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@/components/ui/avatar";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

// Funzione per ottenere il percorso corretto per le guide in base alla lingua
const getGuidePathByLanguage = (slug: string) => {
  const currentLang = getCurrentLanguage();
  
  // Mappa di base percorso in base alla lingua
  const pathMap: Record<string, string> = {
    'it-IT': `/guide/${slug}`,
    'en-US': `/en/guides/${slug}`,
    'en-GB': `/en-gb/guides/${slug}`,
    'fr-FR': `/fr/guides/${slug}`,
    'de-DE': `/de/anleitungen/${slug}`,
    'es-ES': `/es/guias/${slug}`,
  };
  
  return pathMap[currentLang] || pathMap['it-IT']; // Italiano come fallback
};

// Mappa delle keywords SEO multilingua in base alle tag delle guide
const getMultilingualKeywords = (tags: string[], language: string) => {
  // Mappatura delle keyword in diverse lingue per migliorare la SEO
  const keywordMap: Record<string, Record<string, string[]>> = {
    'Affitti brevi': {
      'it-IT': ['affitti brevi', 'affitti turistici', 'locazioni turistiche', 'affitto casa vacanze'],
      'en-US': ['short-term rentals', 'vacation rentals', 'holiday lets', 'airbnb management'],
      'en-GB': ['short-term lettings', 'holiday rentals', 'vacation properties', 'airbnb hosting'],
      'fr-FR': ['location courte durée', 'location saisonnière', 'location vacances', 'gestion airbnb'],
      'de-DE': ['kurzzeitvermietung', 'ferienvermietung', 'ferienunterkünfte', 'airbnb verwaltung'],
      'es-ES': ['alquileres corto plazo', 'alquiler vacacional', 'alojamiento turístico', 'gestión airbnb']
    },
    'Ottimizzazione': {
      'it-IT': ['ottimizzazione affitti', 'rendimento immobiliare', 'gestione proprietà', 'profitto immobiliare'],
      'en-US': ['rental optimization', 'property management', 'rental yield', 'property revenue'],
      'en-GB': ['rental optimisation', 'property management', 'rental yield', 'property revenue'],
      'fr-FR': ['optimisation location', 'gestion immobilière', 'rendement locatif', 'revenu immobilier'],
      'de-DE': ['mietoptimierung', 'immobilienverwaltung', 'mietrendite', 'immobilienertrag'],
      'es-ES': ['optimización alquiler', 'gestión inmobiliaria', 'rendimiento alquiler', 'ingresos inmobiliarios']
    },
    'Rendimento': {
      'it-IT': ['rendimento affitti', 'redditività immobiliare', 'guadagno affitti', 'ritorno investimento immobiliare'],
      'en-US': ['rental yield', 'property profitability', 'real estate ROI', 'rental return'],
      'en-GB': ['rental yield', 'property profitability', 'real estate ROI', 'rental return'],
      'fr-FR': ['rendement locatif', 'rentabilité immobilière', 'ROI immobilier', 'retour sur investissement'],
      'de-DE': ['mietrendite', 'immobilienrentabilität', 'immobilien ROI', 'anlagerendite'],
      'es-ES': ['rendimiento alquiler', 'rentabilidad inmobiliaria', 'ROI inmobiliario', 'retorno inversión']
    },
    'Fiscalità': {
      'it-IT': ['fiscalità immobiliare', 'tasse affitto', 'cedolare secca', 'dichiarazione redditi affitti'],
      'en-US': ['rental tax', 'property taxation', 'real estate tax', 'rental income tax'],
      'en-GB': ['rental tax', 'property taxation', 'real estate tax', 'rental income tax'],
      'fr-FR': ['fiscalité immobilière', 'impôts location', 'fiscalité locative', 'revenu locatif'],
      'de-DE': ['immobiliensteuer', 'mietsteuer', 'einkommensteuer vermietung', 'steuerliche aspekte'],
      'es-ES': ['fiscalidad inmobiliaria', 'impuestos alquiler', 'declaración renta alquiler', 'tributación alquileres']
    },
    'Tasse': {
      'it-IT': ['tasse immobili', 'imposte proprietà', 'tassazione affitti', 'adempimenti fiscali'],
      'en-US': ['property taxes', 'real estate taxes', 'rental property taxation', 'tax compliance'],
      'en-GB': ['property taxes', 'real estate taxes', 'rental property taxation', 'tax compliance'],
      'fr-FR': ['taxes immobilières', 'imposition location', 'charges fiscales', 'obligations fiscales'],
      'de-DE': ['immobiliensteuern', 'grundsteuer', 'einkommensteuer', 'steuervorschriften'],
      'es-ES': ['impuestos inmobiliarios', 'tributos propiedad', 'imposición alquileres', 'obligaciones fiscales']
    },
    'Normative': {
      'it-IT': ['normative affitti', 'regolamenti locazione', 'leggi immobiliari', 'adempimenti legali'],
      'en-US': ['rental regulations', 'property laws', 'real estate legislation', 'legal compliance'],
      'en-GB': ['rental regulations', 'property laws', 'real estate legislation', 'legal compliance'],
      'fr-FR': ['réglementations location', 'lois immobilières', 'législation propriété', 'conformité légale'],
      'de-DE': ['mietvorschriften', 'immobiliengesetze', 'mietrecht', 'rechtliche compliance'],
      'es-ES': ['normativas alquiler', 'regulaciones inmobiliarias', 'legislación propiedad', 'cumplimiento legal']
    },
    'Marketing': {
      'it-IT': ['marketing immobiliare', 'promozione affitti', 'annunci immobiliari', 'strategie marketing'],
      'en-US': ['real estate marketing', 'rental promotion', 'property listing', 'marketing strategies'],
      'en-GB': ['property marketing', 'rental advertising', 'property listing', 'marketing strategies'],
      'fr-FR': ['marketing immobilier', 'promotion location', 'annonces immobilières', 'stratégies marketing'],
      'de-DE': ['immobilienmarketing', 'mietwerbung', 'immobilienanzeigen', 'marketingstrategien'],
      'es-ES': ['marketing inmobiliario', 'promoción alquileres', 'anuncios inmobiliarios', 'estrategias marketing']
    }
  };
  
  // Raccogli tutte le keyword appropriate per i tag della guida nella lingua corrente
  let keywords: string[] = [];
  
  tags.forEach(tag => {
    if (keywordMap[tag] && keywordMap[tag][language]) {
      keywords = [...keywords, ...keywordMap[tag][language]];
    } else {
      // Se non abbiamo una traduzione specifica, aggiungi il tag originale
      keywords.push(tag);
    }
  });
  
  // Assicurati che non ci siano duplicati
  return [...new Set(keywords)];
};

const GuideDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();
  
  const [currentGuide, setCurrentGuide] = useState(
    guides.find((guide) => guide.slug === slug)
  );
  const [relatedGuides, setRelatedGuides] = useState(
    guides
      .filter(
        (guide) =>
          guide.slug !== slug &&
          currentGuide &&
          guide.tags.some((tag) => currentGuide.tags.includes(tag))
      )
      .slice(0, 3)
  );
  const [email, setEmail] = useState("");
  
  // Ottieni le keywords SEO multilingua per questa guida
  const seoKeywords = currentGuide ? getMultilingualKeywords(currentGuide.tags, currentLang) : [];

  useEffect(() => {
    // Aggiorna la guida corrente quando cambia lo slug
    setCurrentGuide(guides.find((guide) => guide.slug === slug));
  }, [slug]);

  useEffect(() => {
    // Aggiorna le guide correlate quando cambia la guida corrente
    if (currentGuide) {
      setRelatedGuides(
        guides
          .filter(
            (guide) =>
              guide.slug !== slug &&
              guide.tags.some((tag) => currentGuide.tags.includes(tag))
          )
          .slice(0, 3)
      );
    }
  }, [currentGuide, slug]);

  useEffect(() => {
    // Scorri in cima alla pagina quando cambia la guida
    window.scrollTo(0, 0);
  }, [slug]);

  if (!currentGuide) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Guida non trovata</h1>
        <Link to="/guide">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle guide
          </Button>
        </Link>
      </div>
    );
  }

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    // Qui potrebbe esserci la logica per inviare un'email con il PDF
    alert(`PDF della guida verrà inviato a: ${email}`);
    setEmail("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Metadati SEO */}
      <HelmetSEO
        title={currentGuide.title}
        description={currentGuide.description}
        image={currentGuide.fullImage || currentGuide.image}
        canonicalUrl={`https://tenoris360.com${getGuidePathByLanguage(currentGuide.slug)}`}
        keywords={seoKeywords}
      />
      
      <Navbar />
      <main className="flex-grow">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              to="/guide"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alle guide
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Immagine principale */}
              {currentGuide.fullImage && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={currentGuide.fullImage}
                    alt={currentGuide.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Titolo e metadata */}
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {currentGuide.title}
                </h1>
                <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {currentGuide.date}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {currentGuide.readTime} di lettura
                  </div>
                </div>
              </div>

              {/* Info sull'autore */}
              <div className="mb-8 p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    {currentGuide.author.image ? (
                      <AvatarImage src={currentGuide.author.image} />
                    ) : null}
                    <AvatarFallback>
                      {currentGuide.author.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{currentGuide.author.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentGuide.author.title}
                    </p>
                  </div>
                </div>
                {currentGuide.author.bio && (
                  <p className="mt-3 text-sm">{currentGuide.author.bio}</p>
                )}
              </div>

              {/* Contenuto principale */}
              <div className="prose prose-lg max-w-none">
                {currentGuide.content}
              </div>

              {/* Tags */}
              <div className="mt-8">
                <div className="flex flex-wrap gap-2">
                  {currentGuide.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-secondary text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Form per download */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Scarica la guida completa
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Inserisci la tua email per ricevere la versione PDF di questa
                    guida.
                  </p>
                  <form onSubmit={handleDownload} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="La tua email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Scarica PDF
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Guide correlate */}
              {relatedGuides.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    Guide correlate
                  </h3>
                  <div className="space-y-4">
                    {relatedGuides.map((guide) => (
                      <Link
                        key={guide.id}
                        to={getGuidePathByLanguage(guide.slug)}
                        className="block"
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={guide.image}
                              alt={guide.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-medium line-clamp-2">
                              {guide.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {guide.readTime} di lettura
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Contatto */}
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Hai altre domande?
                  </h3>
                  <p className="text-sm mb-4">
                    I nostri esperti sono disponibili per aiutarti a gestire al
                    meglio i tuoi immobili.
                  </p>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Contattaci
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GuideDetail; 