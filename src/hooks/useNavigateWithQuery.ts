import { NavigateFunction, To, useLocation, useNavigate } from "react-router-dom";

/**
 * Hook personalizzato che estende useNavigate per preservare
 * automaticamente i parametri di query durante la navigazione.
 * 
 * Esempio di utilizzo:
 * const navigateWithQuery = useNavigateWithQuery();
 * navigateWithQuery('/dashboard');
 */
export const useNavigateWithQuery = (): NavigateFunction => {
  const navigate = useNavigate();
  const { search } = useLocation();
  
  const navigateWithQuery = (to: To, options?: any) => {
    if (typeof to === "string") {
      // Verifica se 'to' contiene già parametri di query
      const hasSearchParams = to.includes('?');
      if (!hasSearchParams) {
        // Se non ci sono parametri di query, aggiungi quelli correnti
        return navigate(`${to}${search}`, options);
      }
    } else if (typeof to === "object" && to !== null) {
      // Se è un oggetto e non ha un parametro 'search' esplicito, aggiungi quello corrente
      if (!to.search) {
        return navigate(
          {
            ...to,
            search
          },
          options
        );
      }
    }
    
    // Comportamento predefinito se ci sono già parametri o se è un altro tipo
    return navigate(to, options);
  };
  
  return navigateWithQuery as NavigateFunction;
}; 