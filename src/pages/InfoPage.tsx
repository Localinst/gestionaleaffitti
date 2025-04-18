import React from "react";
import { Book, FileText, Coffee, ExternalLink, Search } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Dati di esempio per articoli e guide
const articles = [
  {
    id: "1",
    title: "Come massimizzare i profitti dagli affitti a breve termine",
    excerpt: "Scopri le strategie più efficaci per aumentare i profitti dalle locazioni turistiche e le best practices per la gestione.",
    category: "Tutorial",
    date: "10 Maggio 2024",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80",
    slug: "/blog/massimizzare-profitti-affitti"
  },
  {
    id: "2",
    title: "Normative fiscali per proprietari di immobili: aggiornamenti 2024",
    excerpt: "Una panoramica completa sulle ultime normative fiscali che ogni proprietario deve conoscere.",
    category: "Legale",
    date: "2 Maggio 2024",
    readTime: "12 min",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1011&q=80",
    slug: "/blog/normative-fiscali-2024"
  },
  {
    id: "3",
    title: "5 consigli per gestire meglio i tuoi inquilini",
    excerpt: "Consigli pratici per mantenere relazioni positive con gli inquilini e prevenire problemi comuni.",
    category: "Consigli",
    date: "25 Aprile 2024",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1573497019236-61f323342eb9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    slug: "/blog/consigli-gestione-inquilini"
  },
  {
    id: "4",
    title: "Il mercato immobiliare italiano nel 2024: trend e previsioni",
    excerpt: "Analisi dettagliata dell'andamento del mercato immobiliare e previsioni per i prossimi mesi.",
    category: "Analisi",
    date: "15 Aprile 2024",
    readTime: "15 min",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1296&q=80",
    slug: "/blog/mercato-immobiliare-2024"
  },
];

const guides = [
  {
    id: "1",
    title: "Guida completa all'utilizzo di Tenoris360",
    description: "Impara a utilizzare tutte le funzionalità della piattaforma con questa guida passo-passo.",
    category: "Generale",
    level: "Principiante",
    steps: 10,
    slug: "/guide/guida-completa-tenoris360"
  },
  {
    id: "2",
    title: "Come impostare la fatturazione automatica",
    description: "Configura la fatturazione automatica e risparmia tempo nella gestione dei pagamenti.",
    category: "Fatturazione",
    level: "Intermedio",
    steps: 7,
    slug: "/guide/fatturazione-automatica"
  },
  {
    id: "3",
    title: "Gestione efficiente delle proprietà multiple",
    description: "Ottimizza la gestione quando hai numerose proprietà da amministrare.",
    category: "Proprietà",
    level: "Avanzato",
    steps: 12,
    slug: "/guide/gestione-proprieta-multiple"
  },
  {
    id: "4",
    title: "Come gestire i contratti di locazione",
    description: "Crea, modifica e gestisci contratti di locazione in modo efficiente.",
    category: "Contratti",
    level: "Intermedio",
    steps: 8,
    slug: "/guide/gestione-contratti-locazione"
  },
  {
    id: "5",
    title: "Generazione di report personalizzati",
    description: "Crea report personalizzati per monitorare l'andamento delle tue proprietà.",
    category: "Analisi",
    level: "Avanzato",
    steps: 9,
    slug: "/guide/report-personalizzati"
  },
];

// Componente per visualizzare un articolo del blog
function ArticleCard({ article }: { article: typeof articles[0] }) {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="h-48 overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="mb-2">{article.category}</Badge>
          <span className="text-xs text-muted-foreground">{article.date}</span>
        </div>
        <CardTitle className="text-lg line-clamp-2 mb-1">{article.title}</CardTitle>
        <CardDescription className="line-clamp-2">{article.excerpt}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-xs text-muted-foreground">
          Tempo di lettura: {article.readTime}
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <Link to={article.slug} className="w-full">
          <Button variant="outline" className="w-full">
            Leggi l'articolo
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Componente per visualizzare una guida
function GuideCard({ guide }: { guide: typeof guides[0] }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline">{guide.category}</Badge>
          <Badge variant={guide.level === "Principiante" ? "secondary" : guide.level === "Intermedio" ? "default" : "destructive"}>
            {guide.level}
          </Badge>
        </div>
        <CardTitle className="text-lg">{guide.title}</CardTitle>
        <CardDescription>{guide.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm">
          <span className="text-muted-foreground">Passaggi: </span>
          {guide.steps}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link to={guide.slug} className="w-full">
          <Button className="w-full">
            Visualizza Guida
            <Book className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function InfoPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <PageHeader
          title="Guide e Risorse"
          description="Esplora guide, tutorial e articoli per ottenere il massimo dalla piattaforma"
          icon={<FileText className="h-6 w-6" />}
        >
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca guide e articoli..."
              className="w-full pl-8"
            />
          </div>
        </PageHeader>
        
        <Tabs defaultValue="guide" className="mt-6">
          <TabsList>
            <TabsTrigger value="guide">Guide</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guide" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map(guide => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
            
            <div className="mt-8 flex justify-center">
              <Link to="/guide">
                <Button variant="outline">
                  Visualizza tutte le guide
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="blog" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            
            <div className="mt-8 flex justify-center">
              <Link to="/blog">
                <Button variant="outline">
                  Visualizza tutti gli articoli
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-16 bg-muted rounded-lg p-6 text-center">
          <Coffee className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Hai bisogno di supporto personalizzato?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            La nostra squadra di esperti è pronta ad aiutarti. Prenota una consulenza per ricevere assistenza diretta.
          </p>
          <Button>Contatta il supporto</Button>
        </div>
      </div>
    </AppLayout>
  );
} 