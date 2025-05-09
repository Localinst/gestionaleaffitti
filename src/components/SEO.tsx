import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  canonicalUrl?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  twitterCard?: 'summary' | 'summary_large_image'
  keywords?: string[]
  hreflang?: Array<{locale: string, url: string}>
  jsonLd?: Record<string, any> // Schema JSON-LD personalizzato
}

/**
 * Componente SEO per la gestione dinamica dei meta tag nelle pagine React
 * Questo componente modifica direttamente i meta tag nell'head del documento
 * per ogni pagina, migliorando l'SEO delle pagine interne dell'applicazione
 */
export function SEO({
  title,
  description,
  canonical,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary',
  keywords,
  hreflang,
  jsonLd
}: SEOProps) {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://tenoris360.com'
  // Supporta sia canonical che canonicalUrl per retrocompatibilità
  const effectiveCanonical = canonicalUrl || (canonical ? `${siteUrl}${canonical}` : siteUrl)
  const fullOgImage = ogImage ? `${siteUrl}${ogImage}` : `${siteUrl}/og-image.jpg`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={effectiveCanonical} />

      {/* Keywords */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={effectiveCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Tenoris360" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:site" content="@tenoris360" />
      
      {/* hreflang per il supporto multilingua */}
      {hreflang && hreflang.map((item, index) => (
        <link key={index} rel="alternate" hrefLang={item.locale} href={item.url} />
      ))}

      {/* JSON-LD strutturato per SEO */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}

      {/* Script per correggere eventuali problemi con AggregateRating */}
      <script>
        {`
          document.addEventListener('DOMContentLoaded', function() {
            // Rimuove eventuali schemi JSON-LD con AggregateRating problematici
            const fixSchemas = function() {
              try {
                const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                scripts.forEach(function(script) {
                  try {
                    const data = JSON.parse(script.textContent);
                    // Verifica se contiene AggregateRating con valori problematici
                    if (data.aggregateRating) {
                      // Se ratingValue o ratingCount sono 0, li imposta a valori validi
                      if (data.aggregateRating.ratingValue === "0" || 
                          data.aggregateRating.ratingValue === 0 ||
                          data.aggregateRating.ratingCount === "0" || 
                          data.aggregateRating.ratingCount === 0) {
                        
                        // Rimuove lo schema problematico
                        script.remove();
                        console.log('Schema JSON-LD problematico rimosso');
                      }
                    }
                  } catch (e) {
                    console.error('Errore analizzando schema JSON-LD:', e);
                  }
                });
              } catch (e) {
                console.error('Errore rimuovendo schemi problematici:', e);
              }
            };

            // Esegue immediatamente e dopo un secondo per gestire script dinamici
            fixSchemas();
            setTimeout(fixSchemas, 1000);
          });

          // Evento di completamento del rendering per SSR
          if (window.onRenderComplete) {
            window.onRenderComplete({
              type: 'page',
              path: window.location.pathname
            });
          }
        `}
      </script>
    </Helmet>
  )
}

export default SEO; 