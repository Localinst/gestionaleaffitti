import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, Calendar, Clock } from "lucide-react";
import { guides } from "@/data/guides";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import { HelmetSEO } from "@/components/HelmetSEO";
import { getCurrentLanguage, getHreflangUrls } from "@/i18n";

// Estrazione di tutti i tag unici dalle guide
const allTags = Array.from(
  new Set(guides.flatMap((guide) => guide.tags))
).sort();

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

// Ottieni le keywords multilingua per la pagina delle guide
const getGuidesSeoKeywords = (language: string): string[] => {
  const keywordsMap: Record<string, string[]> = {
    'it-IT': [
      'guide affitti', 'guide proprietari immobili', 'consigli affitti', 'gestione immobiliare', 
      'proprietà in affitto', 'affitti brevi', 'locazioni', 'guide fiscali immobili', 
      'normative immobiliari', 'ottimizzazione affitti'
    ],
    'en-US': [
      'rental guides', 'property owner guides', 'rental tips', 'property management', 
      'rental properties', 'short term rentals', 'leases', 'property tax guides', 
      'real estate regulations', 'rental optimization'
    ],
    'en-GB': [
      'rental guides', 'property owner guides', 'letting tips', 'property management', 
      'rental properties', 'short term lets', 'tenancies', 'property tax guides', 
      'real estate regulations', 'rental optimisation'
    ],
    'fr-FR': [
      'guides location', 'guides propriétaires', 'conseils location', 'gestion immobilière', 
      'propriétés locatives', 'locations courte durée', 'baux', 'guides fiscalité immobilière', 
      'réglementations immobilières', 'optimisation location'
    ],
    'de-DE': [
      'vermietungsratgeber', 'anleitungen für eigentümer', 'vermietungstipps', 'immobilienverwaltung',
      'mietobjekte', 'kurzzeitvermietung', 'mietverträge', 'immobiliensteuerführer',
      'immobilienvorschriften', 'mietoptimierung'
    ],
    'es-ES': [
      'guías alquiler', 'guías propietarios', 'consejos alquiler', 'gestión inmobiliaria',
      'propiedades en alquiler', 'alquileres corto plazo', 'arrendamientos', 'guías fiscales inmobiliarias',
      'normativas inmobiliarias', 'optimización alquiler'
    ]
  };
  
  return keywordsMap[language] || keywordsMap['it-IT'];
};

// Funzione per ottenere il titolo della pagina in base alla lingua
const getGuidesTitle = (language: string): string => {
  const titleMap: Record<string, string> = {
    'it-IT': 'Guide per Proprietari di Immobili - Tenoris360',
    'en-US': 'Property Owner Guides - Tenoris360',
    'en-GB': 'Property Owner Guides - Tenoris360',
    'fr-FR': 'Guides pour Propriétaires - Tenoris360',
    'de-DE': 'Ratgeber für Immobilieneigentümer - Tenoris360',
    'es-ES': 'Guías para Propietarios - Tenoris360'
  };
  
  return titleMap[language] || titleMap['it-IT'];
};

// Funzione per ottenere la descrizione della pagina in base alla lingua
const getGuidesDescription = (language: string): string => {
  const descriptionMap: Record<string, string> = {
    'it-IT': 'Scopri le nostre guide complete per proprietari di immobili. Consigli pratici su gestione affitti, fiscalità, normative e ottimizzazione del rendimento immobiliare.',
    'en-US': 'Discover our comprehensive guides for property owners. Practical advice on rental management, taxation, regulations and optimizing your real estate returns.',
    'en-GB': 'Explore our comprehensive guides for property owners. Practical advice on property management, taxation, regulations and optimising your real estate returns.',
    'fr-FR': 'Découvrez nos guides complets pour propriétaires. Conseils pratiques sur la gestion locative, la fiscalité, les réglementations et l\'optimisation de vos rendements immobiliers.',
    'de-DE': 'Entdecken Sie unsere umfassenden Ratgeber für Immobilieneigentümer. Praktische Tipps zu Vermietungsmanagement, Besteuerung, Vorschriften und Optimierung Ihrer Immobilienrenditen.',
    'es-ES': 'Descubra nuestras guías completas para propietarios. Consejos prácticos sobre gestión de alquileres, fiscalidad, normativas y optimización de sus rendimientos inmobiliarios.'
  };
  
  return descriptionMap[language] || descriptionMap['it-IT'];
};

const Guides = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();
  const location = useLocation();
  
  // Ottieni keywords, titolo e descrizione SEO in base alla lingua corrente
  const seoKeywords = getGuidesSeoKeywords(currentLang);
  const seoTitle = getGuidesTitle(currentLang);
  const seoDescription = getGuidesDescription(currentLang);

  // Filtra le guide in base al termine di ricerca e al tag selezionato
  const filteredGuides = guides.filter((guide) => {
    const matchesSearchTerm =
      searchTerm === "" ||
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = selectedTag === null || guide.tags.includes(selectedTag);

    return matchesSearchTerm && matchesTag;
  });

  // Ottieni guide in evidenza
  const featuredGuides = guides.filter((guide) => guide.featured);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Metadati SEO */}
      <HelmetSEO
        title={seoTitle}
        description={seoDescription}
        image="/images/guides/guide-cover.jpg"
        keywords={seoKeywords}
      />
      
      <Navbar />
      <main className="flex-grow">
        <div className="bg-primary/5 py-12">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Le nostre Guide per Proprietari
              </h1>
              <p className="text-muted-foreground text-lg">
                Scopri come gestire al meglio i tuoi immobili con le nostre guide
                pratiche scritte da esperti del settore.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cerca guide..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <Filter className="h-4 w-4" />
                    {selectedTag ? selectedTag : "Filtra per categoria"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setSelectedTag(null)}>
                    Tutti
                  </DropdownMenuItem>
                  <Separator />
                  {allTags.map((tag) => (
                    <DropdownMenuItem
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Guide in Evidenza */}
        {featuredGuides.length > 0 && !searchTerm && !selectedTag && (
          <section className="py-12">
            <div className="container max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8">In Evidenza</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredGuides.slice(0, 2).map((guide) => (
                  <Link
                    key={guide.id}
                    to={getGuidePathByLanguage(guide.slug)}
                    className="block group"
                  >
                    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                      <div className="grid md:grid-cols-2 h-full">
                        <div className="relative aspect-video md:aspect-auto md:h-full overflow-hidden">
                          <img
                            src={guide.image}
                            alt={guide.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardContent className="p-6 flex flex-col">
                          <div className="space-y-1 mb-2">
                            <div className="flex items-center text-sm text-muted-foreground gap-3">
                              <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {guide.date}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                {guide.readTime} di lettura
                              </div>
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                            {guide.title}
                          </h3>
                          <p className="text-muted-foreground line-clamp-3 mb-4">
                            {guide.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-auto">
                            {guide.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-0.5 bg-secondary text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tutte le Guide */}
        <section className="py-12 bg-secondary/10">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">
                {searchTerm || selectedTag
                  ? `Risultati della ricerca (${filteredGuides.length})`
                  : "Tutte le Guide"}
              </h2>
              {(searchTerm || selectedTag) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTag(null);
                  }}
                >
                  Azzera filtri
                </Button>
              )}
            </div>

            {filteredGuides.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">
                  Nessuna guida trovata
                </h3>
                <p className="text-muted-foreground mb-6">
                  Prova a modificare i tuoi criteri di ricerca.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTag(null);
                  }}
                >
                  Visualizza tutte le guide
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGuides.map((guide) => (
                  <Link
                    key={guide.id}
                    to={getGuidePathByLanguage(guide.slug)}
                    className="block group"
                  >
                    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={guide.image}
                          alt={guide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center text-sm text-muted-foreground gap-3 mb-2">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {guide.date}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {guide.readTime} di lettura
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                          {guide.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                          {guide.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {guide.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 bg-secondary text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Guides; 