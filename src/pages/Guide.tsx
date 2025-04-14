import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingNav } from "@/components/layout/LandingNav";
import { guides } from "@/data/guides";

const GuidePage = () => {
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
                Guide e Tutorial
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-[700px]">
                Scopri come utilizzare al meglio Tenoris360 con le nostre guide dettagliate
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      {guide.icon}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                        {guide.type}
                      </span>
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                        {guide.difficulty}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{guide.title}</h3>
                    <p className="text-muted-foreground mb-6">{guide.description}</p>
                    <div className="flex gap-2">
                      <Link to={`/guide/${guide.slug}`}>
                        <Button variant="default" size="sm" className="gap-1 w-full">
                          Leggi Guida
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 bg-muted/50 rounded-lg p-8 border border-border">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/2">
                  <h2 className="text-2xl font-bold mb-4">Hai bisogno di supporto personalizzato?</h2>
                  <p className="text-muted-foreground mb-6">
                    Se le guide non sono sufficienti, contatta il nostro team di supporto per un'assistenza dedicata alle tue specifiche esigenze.
                  </p>
                  <Link to="/supporto">
                    <Button>Contattaci</Button>
                  </Link>
                </div>
                <div className="md:w-1/2 flex justify-center">
                  <img 
                    src="/support-image.jpg" 
                    alt="Supporto Tenoris360" 
                    className="rounded-lg max-h-[200px] object-cover shadow-md"
                  />
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

export default GuidePage; 