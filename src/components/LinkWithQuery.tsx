import { Link, LinkProps, useLocation } from "react-router-dom";

/**
 * Componente Link che preserva automaticamente i parametri di query (search)
 * quando si naviga tra le pagine.
 * 
 * Esempio di utilizzo:
 * <LinkWithQuery to="/dashboard">Dashboard</LinkWithQuery>
 */
export const LinkWithQuery = ({ children, to, ...props }: LinkProps) => {
  const { search } = useLocation();
  
  // Se 'to' è una stringa, aggiungi i parametri di query
  if (typeof to === 'string') {
    // Verifica se 'to' contiene già parametri di query
    const hasSearchParams = to.includes('?');
    if (hasSearchParams) {
      // Se ci sono già parametri di query, non modificare l'URL
      return <Link to={to} {...props}>{children}</Link>;
    }
    // Altrimenti, aggiungi i parametri di query correnti
    return <Link to={`${to}${search}`} {...props}>{children}</Link>;
  } 
  
  // Se 'to' è un oggetto, verifica se è stato specificato esplicitamente un parametro 'search'
  if (typeof to === 'object' && to !== null) {
    // Se 'search' non è specificato esplicitamente, usa quello corrente
    if (!to.search) {
      return (
        <Link
          to={{
            ...to,
            search: search
          }}
          {...props}
        >
          {children}
        </Link>
      );
    }
  }
  
  // In tutti gli altri casi, usa il comportamento normale
  return <Link to={to} {...props}>{children}</Link>;
}; 