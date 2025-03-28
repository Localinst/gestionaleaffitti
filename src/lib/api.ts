// Funzione per determinare l'URL dell'API in base all'ambiente
const getApiUrl = () => {
  // In produzione, usa URL relativo
  if (window.location.hostname !== 'localhost') {
    return '/api';
  }
  // In sviluppo, usa localhost
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

// Configurazione globale per timeout e retry
const API_TIMEOUT = 15000; // 15 secondi di timeout
const MAX_RETRIES = 1; // Numero massimo di tentativi in caso di timeout
const PING_INTERVAL = 5 * 60 * 1000; // 5 minuti in millisecondi

// Sistema di ping periodico per mantenere il server sveglio
const setupServerPing = () => {
  let pingCounter = 0;
  
  // Funzione che esegue il ping
  const pingServer = async () => {
    try {
      pingCounter++;
      console.log(`[Ping #${pingCounter}] Invio ping al server per mantenerlo attivo...`);
      
      const response = await fetchWithTimeout(`${API_URL}/ping`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }, 5000); // Timeout di 5 secondi per il ping
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[Ping #${pingCounter}] Server ha risposto: ${data.message || 'OK'}`);
      } else {
        console.warn(`[Ping #${pingCounter}] Server ha risposto con status: ${response.status}`);
      }
    } catch (error) {
      console.error(`[Ping #${pingCounter}] Errore durante il ping del server:`, error);
    }
  };
  
  // Esegui subito un primo ping
  pingServer();
  
  // Imposta il ping periodico
  const intervalId = setInterval(pingServer, PING_INTERVAL);
  
  // Restituisci una funzione per interrompere il ping se necessario
  return () => {
    console.log('Disattivazione del sistema di ping al server');
    clearInterval(intervalId);
  };
};

// Avvia il sistema di ping automaticamente
const stopPing = setupServerPing();

// Funzione avanzata per fetch con timeout e retry
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT, retries = MAX_RETRIES): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    // Controller per abortire la richiesta in caso di timeout
    const controller = new AbortController();
    const { signal } = controller;
    
    // Timer per il timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`Timeout nella richiesta a ${url} dopo ${timeout}ms`);
    }, timeout);
    
    // Funzione per eseguire la richiesta con possibilità di retry
    const executeRequest = async (attemptNumber = 0) => {
      try {
        console.log(`Esecuzione richiesta a ${url} - tentativo ${attemptNumber + 1}`);
        const response = await fetch(url, { ...options, signal });
        clearTimeout(timeoutId);
        resolve(response);
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Se l'errore è dovuto al timeout (abort) e abbiamo ancora tentativi disponibili
        if (error.name === 'AbortError' && attemptNumber < retries) {
          console.warn(`Richiesta abortita, ritentativo ${attemptNumber + 1}/${retries + 1}`);
          // Riprova dopo un breve delay
          setTimeout(() => executeRequest(attemptNumber + 1), 1000);
        } else {
          // Se abbiamo esaurito i tentativi o si tratta di un altro errore
          console.error(`Errore definitivo nella richiesta dopo ${attemptNumber + 1} tentativi:`, error);
          reject(error);
        }
      }
    };
    
    // Avvia la richiesta
    executeRequest();
  });
}

// Funzione per ottenere gli headers con autenticazione
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Handler generico per gli errori delle richieste
const handleRequestError = (endpoint: string, error: any) => {
  console.error(`Errore nella richiesta a ${endpoint}:`, error);
  
  // Se è un errore di timeout, possiamo mostrare un messaggio specifico
  if (error.name === 'AbortError') {
    return { error: 'La richiesta ha impiegato troppo tempo. Il server potrebbe essere sovraccarico o non raggiungibile.' };
  }
  
  // Altri tipi di errori
  return { error: "Si è verificato un errore di connessione. Prova ad aggiornare la pagina o a riavviare l'applicazione." };
};

export const api = {
  properties: {
    getAll: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('properties/getAll', error);
      }
    },
    getById: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties/${id}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`properties/getById/${id}`, error);
      }
    },
    create: async (data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError('properties/create', error);
      }
    },
    update: async (id: string, data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`properties/update/${id}`, error);
      }
    },
    delete: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/properties/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`properties/delete/${id}`, error);
      }
    }
  },
  tenants: {
    getAll: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('tenants/getAll', error);
      }
    },
    getById: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants/${id}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`tenants/getById/${id}`, error);
      }
    },
    create: async (data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError('tenants/create', error);
      }
    },
    update: async (id: string, data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`tenants/update/${id}`, error);
      }
    },
    delete: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/tenants/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`tenants/delete/${id}`, error);
      }
    }
  },
  transactions: {
    getAll: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('transactions/getAll', error);
      }
    },
    getById: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions/${id}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`transactions/getById/${id}`, error);
      }
    },
    create: async (data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError('transactions/create', error);
      }
    },
    update: async (id: string, data: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`transactions/update/${id}`, error);
      }
    },
    delete: async (id: string) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/transactions/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError(`transactions/delete/${id}`, error);
      }
    }
  },
  dashboard: {
    getSummary: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/dashboard/summary`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('dashboard/getSummary', error);
      }
    },
    getChartData: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/dashboard/charts`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('dashboard/getChartData', error);
      }
    },
    debug: async () => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/dashboard/debug`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('dashboard/debug', error);
      }
    }
  },
  reports: {
    getSummary: async (params: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/reports/summary${formatQueryParams(params)}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('reports/getSummary', error);
      }
    },
    getPropertyPerformance: async (params: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/reports/properties${formatQueryParams(params)}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('reports/getPropertyPerformance', error);
      }
    },
    getFinancialData: async (params: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/reports/financial${formatQueryParams(params)}`, {
          headers: getAuthHeaders()
        });
        return res.json();
      } catch (error) {
        return handleRequestError('reports/getFinancialData', error);
      }
    },
    exportReport: async (format: string, params: any) => {
      try {
        const res = await fetchWithTimeout(`${API_URL}/reports/export/${format}${formatQueryParams(params)}`, {
          headers: getAuthHeaders()
        });
        return res.blob();
      } catch (error) {
        console.error(`Errore nell'esportazione del report:`, error);
        throw new Error('Non è stato possibile esportare il report. Riprova più tardi.');
      }
    }
  }
};

// Funzione per formattare i parametri di query URL
function formatQueryParams(params: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return '';
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    
  return queryString ? `?${queryString}` : '';
} 