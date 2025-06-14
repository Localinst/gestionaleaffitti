import { Helmet } from "react-helmet-async";
import { getHreflangUrls } from "@/i18n";
import { useLocation } from "react-router-dom";

interface HelmetSEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  image?: string;
  type?: string;
  keywords?: string[];
  children?: React.ReactNode;
}

export function HelmetSEO({
  title,
  description,
  canonicalUrl,
  image = "/og-image.jpg",
  type = "website",
  keywords,
  children
}: HelmetSEOProps) {
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const baseUrl = "https://tenoris360.com";
  
  // Importante: Usa l'URL corrente come canonical per evitare che Bing consideri 
  // le versioni linguistiche come pagine duplicate
  const fullCanonicalUrl = canonicalUrl || `${baseUrl}${location.pathname}`;
  const fullImageUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;
  
  // Genera gli URL hreflang per tutte le lingue supportate
  const hreflangUrls = getHreflangUrls(currentPath, baseUrl);
  
  return (
    <Helmet>
      {/* Meta tag di base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Meta tag per keywords */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Meta tag Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Tenoris360" />
      
      {/* Meta tag Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Tag hreflang per SEO multilingua */}
      {hreflangUrls.map((item) => (
        <link 
          key={item.locale} 
          rel="alternate" 
          hrefLang={item.locale} 
          href={item.url} 
        />
      ))}
      
      {children}
    </Helmet>
  );
} 