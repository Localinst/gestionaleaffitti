import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Download, Mail } from "lucide-react";
import { guides } from "@/data/guides";

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

const GuideDetail = () => {
  const { slug } = useParams<{ slug: string }>();
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
                        to={`/guide/${guide.slug}`}
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