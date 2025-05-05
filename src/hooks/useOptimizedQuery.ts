import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

// Tipo per le opzioni di caching personalizzate
type CachingStrategy = 'aggressive' | 'normal' | 'minimal';

// Interfaccia per le opzioni del nostro hook personalizzato
interface UseOptimizedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'> {
  cachingStrategy?: CachingStrategy;
}

/**
 * Hook personalizzato per ottimizzare le query con diverse strategie di caching
 * @param queryKey - La chiave per identificare la query (array)
 * @param queryFn - La funzione che esegue la chiamata API
 * @param options - Opzioni aggiuntive inclusa la strategia di caching
 */
export function useOptimizedQuery<TData = unknown, TError = unknown>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: UseOptimizedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const { cachingStrategy = 'normal', ...restOptions } = options || {};
  
  // Configura le opzioni di caching in base alla strategia scelta
  const cachingOptions = configureCachingOptions(cachingStrategy);
  
  // Unisci le opzioni di caching con le altre opzioni fornite
  const queryOptions = {
    ...cachingOptions,
    ...restOptions,
    queryKey,
    queryFn,
  };
  
  // Usa useQuery con le opzioni configurate
  return useQuery<TData, TError, TData>(queryOptions);
}

/**
 * Configura le opzioni di caching in base alla strategia
 */
function configureCachingOptions(strategy: CachingStrategy) {
  switch (strategy) {
    case 'aggressive':
      // Mantiene i dati in cache più a lungo, minimizza le richieste
      return {
        staleTime: 1000 * 60 * 30, // 30 minuti
        gcTime: 1000 * 60 * 60 * 2, // 2 ore
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      };
    
    case 'minimal':
      // Strategia con caching minimo, utile per dati che cambiano frequentemente
      return {
        staleTime: 1000 * 30, // 30 secondi
        gcTime: 1000 * 60 * 5, // 5 minuti
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      };
    
    case 'normal':
    default:
      // Strategia di caching bilanciata
      return {
        staleTime: 1000 * 60 * 5, // 5 minuti
        gcTime: 1000 * 60 * 30, // 30 minuti
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      };
  }
}

export default useOptimizedQuery; 