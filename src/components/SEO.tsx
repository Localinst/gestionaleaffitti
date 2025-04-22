import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  hreflang?: Array<{locale: string, url: string}>;
  noIndex?: boolean;
}

/**
 * Componente SEO per la gestione dinamica dei meta tag nelle pagine React
 * Questo componente modifica direttamente i meta tag nell'head del documento
 * per ogni pagina, migliorando l'SEO delle pagine interne dell'applicazione
 */
export const SEO = ({
  title,
  description,
  keywords,
  ogImage = 'https://www.tenoris360.com/images/tenoris360-og-image.jpg',
  ogType = 'website',
  twitterImage = 'https://www.tenoris360.com/images/tenoris360-twitter-card.jpg',
  canonicalUrl,
  hreflang,
  noIndex = false,
}: SEOProps) => {
  // Titolo base dell'applicazione per casi in cui non viene fornito un titolo specifico
  const baseTitle = 'Tenoris360 | Software Gestionale Affitti e Immobili';
  
  // Funzione per aggiornare i meta tag
  useEffect(() => {
    // Gestione del titolo della pagina
    if (title) {
      document.title = `${title} | Tenoris360`;
    } else {
      document.title = baseTitle;
    }

    // Gestione meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }

    // Gestione meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && keywords && keywords.length > 0) {
      metaKeywords.setAttribute('content', keywords.join(', '));
    }

    // Gestione robots (index/noindex)
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      if (noIndex) {
        metaRobots.setAttribute('content', 'noindex, nofollow');
      } else {
        metaRobots.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      }
    }

    // Gestione OpenGraph
    const ogTitleElement = document.querySelector('meta[property="og:title"]');
    if (ogTitleElement && title) {
      ogTitleElement.setAttribute('content', `${title} | Tenoris360`);
    }

    const ogDescriptionElement = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionElement && description) {
      ogDescriptionElement.setAttribute('content', description);
    }

    const ogTypeElement = document.querySelector('meta[property="og:type"]');
    if (ogTypeElement) {
      ogTypeElement.setAttribute('content', ogType);
    }

    const ogImageElement = document.querySelector('meta[property="og:image"]');
    if (ogImageElement) {
      ogImageElement.setAttribute('content', ogImage);
    }

    // Gestione Twitter Card
    const twitterTitleElement = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitleElement && title) {
      twitterTitleElement.setAttribute('content', `${title} | Tenoris360`);
    }

    const twitterDescriptionElement = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescriptionElement && description) {
      twitterDescriptionElement.setAttribute('content', description);
    }

    const twitterImageElement = document.querySelector('meta[name="twitter:image"]');
    if (twitterImageElement) {
      twitterImageElement.setAttribute('content', twitterImage);
    }

    // Gestione URL canonico
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (link && canonicalUrl) {
      link.href = canonicalUrl;
    }
    
    // Gestione dei tag hreflang
    if (hreflang && hreflang.length > 0) {
      // Rimuovi eventuali tag hreflang esistenti per evitare duplicati
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => {
        el.remove();
      });
      
      // Crea i nuovi tag hreflang
      hreflang.forEach(item => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', item.locale);
        link.setAttribute('href', item.url);
        document.head.appendChild(link);
      });
    }
  }, [
    title,
    description,
    keywords,
    ogImage,
    ogType,
    twitterImage,
    canonicalUrl,
    hreflang,
    noIndex
  ]);

  // Questo componente non renderizza nulla nel DOM, agisce solo sui meta tag
  return null;
};

export default SEO; 