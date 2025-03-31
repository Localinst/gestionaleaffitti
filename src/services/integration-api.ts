import { getAuthHeaders, handleRequestError } from './api';
import { API_URL } from './api-config';

/**
 * Ottiene tutte le integrazioni dell'utente.
 */
export const getIntegrations = async () => {
  try {
    const response = await fetch(`${API_URL}/integrations`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Errore nel recupero delle integrazioni');
    }
    
    return await response.json();
  } catch (error) {
    handleRequestError(error, 'getIntegrations');
    throw error;
  }
};

/**
 * Ottiene le integrazioni per una proprietà specifica.
 */
export const getPropertyIntegrations = async (propertyId: string) => {
  try {
    const response = await fetch(`${API_URL}/integrations/property/${propertyId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Errore nel recupero delle integrazioni della proprietà');
    }
    
    return await response.json();
  } catch (error) {
    handleRequestError(error, 'getPropertyIntegrations');
    throw error;
  }
};

/**
 * Aggiunge una nuova integrazione iCal.
 */
export const addIcalIntegration = async (propertyId: string, syncUrl: string, name: string) => {
  try {
    const response = await fetch(`${API_URL}/integrations/ical`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ property_id: propertyId, sync_url: syncUrl, name })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Errore nell\'aggiunta dell\'integrazione iCal');
    }
    
    return await response.json();
  } catch (error) {
    handleRequestError(error, 'addIcalIntegration');
    throw error;
  }
};

/**
 * Genera un token di accesso per il feed iCal pubblico.
 */
export const generateExportToken = async (propertyId: string) => {
  try {
    const response = await fetch(`${API_URL}/integrations/token/${propertyId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Errore nella generazione del token');
    }
    
    return await response.json();
  } catch (error) {
    handleRequestError(error, 'generateExportToken');
    throw error;
  }
};

/**
 * Sincronizza manualmente un'integrazione.
 */
export const syncIntegration = async (integrationId: string) => {
  try {
    const response = await fetch(`${API_URL}/integrations/sync/${integrationId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Errore nella sincronizzazione');
    }
    
    return await response.json();
  } catch (error) {
    handleRequestError(error, 'syncIntegration');
    throw error;
  }
};

/**
 * Elimina un'integrazione.
 */
export const deleteIntegration = async (integrationId: string) => {
  try {
    const response = await fetch(`${API_URL}/integrations/${integrationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Errore nell\'eliminazione dell\'integrazione');
    }
    
    return await response.json();
  } catch (error) {
    handleRequestError(error, 'deleteIntegration');
    throw error;
  }
}; 