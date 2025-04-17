import { useEffect } from 'react';

interface HeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  canonical?: string;
  noIndex?: boolean;
  structuredData?: object;
  debug?: boolean;
}

/**
 * Componente Head per la gestione SEO nelle pagine React
 * Imposta dinamicamente titolo, meta tag e dati strutturati
 * 
 * Esempio di utilizzo:
 * <Head 
 *   title="Gestione Proprietà" 
 *   description="Gestisci facilmente tutte le tue proprietà in affitto"
 * />
 */
const Head = ({
  title,
  description,
  keywords,
  image = '/simbolologo.png',
  canonical,
  noIndex = false,
  structuredData,
  debug = false
}: HeadProps) => {
  useEffect(() => {
    // Helper di log per il debug
    const logDebug = (message: string, data?: any) => {
      if (debug) {
        console.group(`[SEO Debug] ${message}`);
        if (data) console.log(data);
        console.groupEnd();
      }
    };

    logDebug('Head component mounted', {
      title, description, keywords, image, canonical, noIndex
    });
    
    // Imposta titolo della pagina
    if (title) {
      const formattedTitle = `${title} | Tenoris360`;
      document.title = formattedTitle;
      logDebug('Setting document title', formattedTitle);
      
      // Aggiorna anche i meta tag OpenGraph e Twitter per il titolo
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', formattedTitle);
        logDebug('Setting og:title', formattedTitle);
      } else {
        logDebug('og:title meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        meta.setAttribute('content', formattedTitle);
        document.head.appendChild(meta);
      }
      
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute('content', formattedTitle);
        logDebug('Setting twitter:title', formattedTitle);
      } else {
        logDebug('twitter:title meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'twitter:title');
        meta.setAttribute('content', formattedTitle);
        document.head.appendChild(meta);
      }
    }
    
    // Imposta descrizione
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
        logDebug('Setting description', description);
      } else {
        logDebug('description meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        meta.setAttribute('content', description);
        document.head.appendChild(meta);
      }
      
      // Aggiorna anche i meta tag OpenGraph e Twitter per la descrizione
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', description);
        logDebug('Setting og:description', description);
      } else {
        logDebug('og:description meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:description');
        meta.setAttribute('content', description);
        document.head.appendChild(meta);
      }
      
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (twitterDescription) {
        twitterDescription.setAttribute('content', description);
        logDebug('Setting twitter:description', description);
      } else {
        logDebug('twitter:description meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'twitter:description');
        meta.setAttribute('content', description);
        document.head.appendChild(meta);
      }
    }
    
    // Imposta keywords
    if (keywords && keywords.length > 0) {
      const keywordsString = keywords.join(', ');
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywordsString);
        logDebug('Setting keywords', keywordsString);
      } else {
        logDebug('keywords meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'keywords');
        meta.setAttribute('content', keywordsString);
        document.head.appendChild(meta);
      }
    }
    
    // Imposta immagine OpenGraph e Twitter
    if (image) {
      const absoluteImageUrl = image.startsWith('http') 
        ? image 
        : new URL(image, window.location.origin).toString();
      
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', absoluteImageUrl);
        logDebug('Setting og:image', absoluteImageUrl);
      } else {
        logDebug('og:image meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image');
        meta.setAttribute('content', absoluteImageUrl);
        document.head.appendChild(meta);
      }
      
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        twitterImage.setAttribute('content', absoluteImageUrl);
        logDebug('Setting twitter:image', absoluteImageUrl);
      } else {
        logDebug('twitter:image meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'twitter:image');
        meta.setAttribute('content', absoluteImageUrl);
        document.head.appendChild(meta);
      }
    }
    
    // Gestione canonical
    if (canonical) {
      const absoluteUrl = canonical.startsWith('http') 
        ? canonical 
        : new URL(canonical, window.location.origin).toString();
      
      let link = document.querySelector('link[rel="canonical"]');
      if (link) {
        link.setAttribute('href', absoluteUrl);
        logDebug('Setting canonical link', absoluteUrl);
      } else {
        logDebug('canonical link not found, creating it');
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', absoluteUrl);
        document.head.appendChild(link);
      }
      
      // Aggiorna anche il tag og:url
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', absoluteUrl);
        logDebug('Setting og:url', absoluteUrl);
      } else {
        logDebug('og:url meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:url');
        meta.setAttribute('content', absoluteUrl);
        document.head.appendChild(meta);
      }
    }
    
    // Gestione noIndex
    if (noIndex) {
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) {
        robots.setAttribute('content', 'noindex, nofollow');
        logDebug('Setting robots to noindex, nofollow');
      } else {
        logDebug('robots meta tag not found, creating it');
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        meta.setAttribute('content', 'noindex, nofollow');
        document.head.appendChild(meta);
      }
    }
    
    // Aggiunge dati strutturati JSON-LD
    if (structuredData) {
      logDebug('Setting structured data', structuredData);
      
      // Cerca se esiste già uno script JSON-LD con lo stesso @type
      const type = (structuredData as any)['@type'];
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      let existingScript = null;
      
      existingScripts.forEach(script => {
        try {
          const data = JSON.parse(script.innerHTML);
          if (data['@type'] === type) {
            existingScript = script;
          }
        } catch (e) {
          console.error('Errore nel parsing JSON-LD:', e);
        }
      });
      
      if (existingScript) {
        // Aggiorna lo script esistente
        existingScript.innerHTML = JSON.stringify(structuredData);
        logDebug('Updated existing structured data');
      } else {
        // Crea un nuovo script per il JSON-LD
        const script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.innerHTML = JSON.stringify(structuredData);
        document.head.appendChild(script);
        logDebug('Created new structured data script');
      }
    }
    
    // Emetti un evento per indicare che il rendering SEO è completato
    // Importante per crawler e prerendering
    document.dispatchEvent(new Event('seo-rendered'));
    document.dispatchEvent(new Event('render-complete'));
    logDebug('Dispatched seo-rendered and render-complete events');
    
    // Pulisci quando il componente si smonta
    return () => {
      logDebug('Head component unmounting');
      
      // Rimuovi i dati strutturati aggiunti dinamicamente se necessario
      if (structuredData) {
        const type = (structuredData as any)['@type'];
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        
        scripts.forEach(script => {
          try {
            const data = JSON.parse(script.innerHTML);
            if (data['@type'] === type && data['@id']?.includes('dynamic')) {
              script.remove();
              logDebug('Removed dynamic structured data script', type);
            }
          } catch (e) {
            console.error('Errore nel parsing JSON-LD durante la pulizia:', e);
          }
        });
      }
    };
  }, [title, description, keywords, image, canonical, noIndex, structuredData, debug]);
  
  return null;
};

export default Head; 