import axios from 'axios';

const BASE_URL = '/api/lemon-squeezy';

// Client API configurato secondo lo standard JSON:API
const lemonSqueezyClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json'
  }
});

/**
 * Ottiene un prodotto Lemon Squeezy tramite il suo ID
 */
export const getProduct = async (productId: string, include?: string[]) => {
  try {
    const includeParam = include?.length ? `?include=${include.join(',')}` : '';
    const response = await lemonSqueezyClient.get(`/products/${productId}${includeParam}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero del prodotto:', error);
    throw error;
  }
};

/**
 * Ottiene tutti i prodotti dello store
 */
export const getProducts = async (include?: string[]) => {
  try {
    const includeParam = include?.length ? `?include=${include.join(',')}` : '';
    console.log('Chiamata API a:', `${BASE_URL}/products${includeParam}`);
    const response = await lemonSqueezyClient.get(`/products${includeParam}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dei prodotti:', error);
    throw error;
  }
};

/**
 * Ottiene tutte le varianti di un prodotto
 */
export const getProductVariants = async (productId: string) => {
  try {
    const response = await lemonSqueezyClient.get(`/variants?filter[product_id]=${productId}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero delle varianti del prodotto:', error);
    throw error;
  }
};

/**
 * Crea un checkout per un prodotto specifico
 */
export const createCheckout = async (
  variantId: string, 
  customerEmail?: string, 
  customData?: Record<string, any>
) => {
  try {
    console.log('Creazione checkout con dati:', { variantId, email: customerEmail, customData });
    const response = await lemonSqueezyClient.post(`/create-checkout`, {
      variantId,
      email: customerEmail,
      customData
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante la creazione del checkout:', error);
    throw error;
  }
};

/**
 * Ottiene i dettagli di un ordine
 */
export const getOrder = async (orderId: string, include?: string[]) => {
  try {
    const includeParam = include?.length ? `?include=${include.join(',')}` : '';
    const response = await lemonSqueezyClient.get(`/orders/${orderId}${includeParam}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dell\'ordine:', error);
    throw error;
  }
};

/**
 * Ottiene le sottoscrizioni dell'utente
 */
export const getUserSubscriptions = async (userId: string, include?: string[]) => {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('filter[user_id]', userId);
    if (include?.length) params.append('include', include.join(','));
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await lemonSqueezyClient.get(`/subscriptions${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero degli abbonamenti dell\'utente:', error);
    throw error;
  }
};

/**
 * Ottiene i dettagli di una sottoscrizione
 */
export const getSubscription = async (subscriptionId: string, include?: string[]) => {
  try {
    const includeParam = include?.length ? `?include=${include.join(',')}` : '';
    const response = await lemonSqueezyClient.get(`/subscriptions/${subscriptionId}${includeParam}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dell\'abbonamento:', error);
    throw error;
  }
};

/**
 * Aggiorna una sottoscrizione (ad es. upgrade/downgrade)
 */
export const updateSubscription = async (subscriptionId: string, variantId: string) => {
  try {
    const payload = {
      data: {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          variant_id: variantId
        }
      }
    };
    
    const response = await lemonSqueezyClient.patch(`/subscriptions/${subscriptionId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Errore durante l\'aggiornamento dell\'abbonamento:', error);
    throw error;
  }
};

/**
 * Cancella una sottoscrizione
 */
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const response = await lemonSqueezyClient.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante la cancellazione dell\'abbonamento:', error);
    throw error;
  }
}; 