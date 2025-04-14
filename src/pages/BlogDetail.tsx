import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Share2, Facebook, Twitter, Linkedin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingNav } from "@/components/layout/LandingNav";
import { blogPosts, BlogPost } from "@/data/blogPosts";

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    // Trova il post corrente dal slug
    const currentPost = blogPosts.find(post => post.slug === slug) || null;
    setPost(currentPost);

    // Trova post correlati (escludendo il post corrente)
    if (currentPost) {
      const related = blogPosts
        .filter(p => p.slug !== slug)
        .slice(0, 3);
      setRelatedPosts(related);
    }
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <LandingNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Articolo non trovato</h1>
            <p className="text-muted-foreground mb-6">
              L'articolo che stai cercando non è disponibile o è stato rimosso.
            </p>
            <Link to="/blog">
              <Button>Torna al blog</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="flex-1">
        <article>
          {/* Header dell'articolo */}
          <div className="bg-muted/30 py-12 md:py-16">
            <div className="container px-4 md:px-6">
              <Link to="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
                <ArrowLeft className="h-4 w-4" />
                <span>Torna agli articoli</span>
              </Link>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{post.readTime}</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                {post.title}
              </h1>

              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-1 w-10 h-10 flex items-center justify-center text-primary font-semibold">
                    {post.author.initials}
                  </div>
                  <div>
                    <p className="font-medium">{post.author.name}</p>
                    <p className="text-sm text-muted-foreground">{post.author.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Condividi:</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Immagine principale */}
          <div className="py-6 md:py-10">
            <div className="container px-4 md:px-6">
              <div className="aspect-[21/9] overflow-hidden rounded-xl">
                <img 
                  src={post.fullImage || post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Contenuto dell'articolo */}
          <div className="py-8 md:py-12">
            <div className="container px-4 md:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                  <div className="prose prose-stone dark:prose-invert max-w-none">
                    {post.content}
                  </div>

                  {/* Tag dell'articolo */}
                  <div className="mt-10 pt-8 border-t">
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Informazioni sull'autore */}
                  <div className="mt-10 p-6 bg-muted/40 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-1 w-12 h-12 flex items-center justify-center text-primary font-semibold">
                        {post.author.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">{post.author.name}</h3>
                        <p className="text-muted-foreground mb-4">{post.author.bio}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Altri articoli
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4">
                  <div className="sticky top-20">
                    <h3 className="font-semibold text-lg mb-4">Articoli correlati</h3>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost, index) => (
                        <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                          <Link to={`/blog/${relatedPost.slug}`}>
                            <div className="aspect-[16/9] relative bg-muted">
                              <img 
                                src={relatedPost.image} 
                                alt={relatedPost.title} 
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <CardContent className="p-4">
                              <h4 className="font-medium text-base mb-1 line-clamp-2">{relatedPost.title}</h4>
                              <p className="text-xs text-muted-foreground">{relatedPost.date}</p>
                            </CardContent>
                          </Link>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/10">
                      <h3 className="font-semibold text-lg mb-3">Ricevi aggiornamenti</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Iscriviti alla nostra newsletter per ricevere articoli e guide esclusive sulla gestione degli affitti.
                      </p>
                      <div className="space-y-2">
                        <input 
                          type="email" 
                          placeholder="La tua email" 
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                        <Button className="w-full">Iscriviti</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
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

export default BlogDetail; 