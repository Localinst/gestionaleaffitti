import { 
  Booking, 
  SeasonalRate, 
  AdditionalService, 
  CleaningTask 
} from '@/types/tourism';
import { getAuthHeaders } from '@/services/api';
import { handleRequestError } from '@/lib/api';

// Funzione per determinare l'URL dell'API in base all'ambiente
const getApiUrl = () => {
  // In produzione, usa URL diretto del backend
  if (window.location.hostname !== 'localhost') {
    return 'https://gestionaleaffitti.onrender.com/api';
  }
  // In sviluppo, usa localhost
  return `${window.location.protocol}//${window.location.hostname}:3000/api`;
};

// URL base dell'API
const API_URL = getApiUrl();

console.log('Tourism API URL:', API_URL);

export const tourismApi = {
  // API per la gestione delle prenotazioni
  bookings: {
    getAll: async (filters?: { propertyId?: string, status?: string }): Promise<Booking[]> => {
      try {
        let url = `${API_URL}/tourism/bookings`;
        const queryParams = [];
        
        if (filters?.propertyId) {
          queryParams.push(`propertyId=${filters.propertyId}`);
        }
        
        if (filters?.status) {
          queryParams.push(`status=${filters.status}`);
        }
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }

        console.log('Richiesta GET a:', url);
        const res = await fetch(url, {
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            const errorText = await res.text();
            console.error('Risposta non-JSON ricevuta:', errorText.substring(0, 200) + '...');
            throw new Error(`Errore ${res.status}: Il server ha restituito una risposta non valida`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error('Errore in bookings.getAll:', error);
        return [];
      }
    },
    
    getById: async (id: string): Promise<Booking> => {
      try {
        const res = await fetch(`${API_URL}/tourism/bookings/${id}`, {
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error(`Errore in bookings.getById/${id}:`, error);
        throw error;
      }
    },
    
    create: async (data: Partial<Booking>): Promise<Booking> => {
      try {
        const res = await fetch(`${API_URL}/tourism/bookings`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error('Errore in bookings.create:', error);
        throw error;
      }
    },
    
    update: async (id: string, data: Partial<Booking>): Promise<Booking> => {
      try {
        const res = await fetch(`${API_URL}/tourism/bookings/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error(`Errore in bookings.update/${id}:`, error);
        throw error;
      }
    },
    
    delete: async (id: string): Promise<{ success: boolean }> => {
      try {
        const res = await fetch(`${API_URL}/tourism/bookings/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error(`Errore in bookings.delete/${id}:`, error);
        throw error;
      }
    },
    
    getAvailability: async (propertyId: string, startDate?: string, endDate?: string): Promise<any> => {
      try {
        let url = `${API_URL}/tourism/properties/${propertyId}/availability`;
        const queryParams = [];
        
        if (startDate) {
          queryParams.push(`start_date=${startDate}`);
        }
        
        if (endDate) {
          queryParams.push(`end_date=${endDate}`);
        }
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        
        const res = await fetch(url, {
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error(`Errore in bookings.getAvailability/${propertyId}:`, error);
        throw error;
      }
    }
  },
  
  // API per la gestione delle tariffe stagionali
  seasonalRates: {
    getAll: async (propertyId?: string, activeOnly?: boolean): Promise<SeasonalRate[]> => {
      try {
        let url = `${API_URL}/tourism/seasonal-rates`;
        const queryParams = [];
        
        if (propertyId) {
          queryParams.push(`propertyId=${propertyId}`);
        }
        
        if (activeOnly) {
          queryParams.push(`active=true`);
        }
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        
        const res = await fetch(url, {
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error('Errore in seasonalRates.getAll:', error);
        return [];
      }
    },
    
    getById: async (id: string): Promise<SeasonalRate> => {
      try {
        const res = await fetch(`${API_URL}/tourism/seasonal-rates/${id}`, {
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error(`Errore in seasonalRates.getById/${id}:`, error);
        throw error;
      }
    },
    
    create: async (data: Partial<SeasonalRate>): Promise<SeasonalRate> => {
      try {
        const res = await fetch(`${API_URL}/tourism/seasonal-rates`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error('Errore in seasonalRates.create:', error);
        throw error;
      }
    },
    
    update: async (id: string, data: Partial<SeasonalRate>): Promise<SeasonalRate> => {
      try {
        const res = await fetch(`${API_URL}/tourism/seasonal-rates/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error(`Errore in seasonalRates.update/${id}:`, error);
        throw error;
      }
    },
    
    delete: async (id: string): Promise<{ success: boolean }> => {
      try {
        const res = await fetch(`${API_URL}/tourism/seasonal-rates/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await res.json();
            throw new Error(error.error || `Errore ${res.status}: ${res.statusText}`);
          } else {
            throw new Error(`Errore ${res.status}: ${res.statusText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error(`Errore in seasonalRates.delete/${id}:`, error);
        throw error;
      }
    }
  }
}; 