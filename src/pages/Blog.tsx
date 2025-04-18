import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingNav } from "@/components/layout/LandingNav";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";

const BlogPage = () => {
  const blogPosts = [
    {
      title: "Come massimizzare i rendimenti dai tuoi immobili in affitto",
      excerpt: "Scopri le strategie più efficaci per aumentare il rendimento dei tuoi investimenti immobiliari attraverso una gestione ottimizzata.",
      date: "10 Settembre 2023",
      readTime: "8 min",
      image: "/blog-post-1.jpg",
      slug: "massimizzare-rendimenti-immobili"
    },
    {
      title: "Guida completa ai contratti di locazione in Italia",
      excerpt: "Tutto ciò che devi sapere sui contratti di locazione in Italia: tipologie, obblighi, diritti e opportunità fiscali.",
      date: "28 Agosto 2023",
      readTime: "12 min",
      image: "/blog-post-2.jpg",
      slug: "guida-contratti-locazione"
    },
    {
      title: "Le migliori pratiche per la gestione degli inquilini",
      excerpt: "Consigli pratici su come gestire al meglio i rapporti con gli inquilini, dalla selezione alla comunicazione quotidiana.",
      date: "15 Agosto 2023",
      readTime: "6 min",
      image: "/blog-post-3.jpg",
      slug: "migliori-pratiche-gestione-inquilini"
    },
    {
      title: "Come automatizzare la gestione degli affitti con Tenoris360",
      excerpt: "Scopri come risparmiare tempo e ridurre gli errori grazie all'automazione dei processi di gestione con la nostra piattaforma.",
      date: "5 Agosto 2023",
      readTime: "10 min",
      image: "/blog-post-4.jpg",
      slug: "automatizzare-gestione-affitti"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="flex-1">
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <PageBreadcrumb items={[{ label: "Blog" }]} />
            
            <div className="flex flex-col gap-2 mb-12">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4">
                <ArrowLeft className="h-4 w-4" />
                <span>Torna alla home</span>
              </Link>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Blog Tenoris360
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-[700px]">
                Approfondimenti, guide e consigli per la gestione efficace delle proprietà in affitto
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-[16/9] relative bg-muted">
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground">
                      {post.image ? (
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span>Immagine non disponibile</span>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <Link to={`/blog/${post.slug}`}>
                        <Button variant="outline" size="sm">Leggi l'articolo</Button>
                      </Link>
                      <Button variant="ghost" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center mt-12">
              <Button variant="outline" size="lg">
                Carica altri articoli
              </Button>
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

export default BlogPage; 