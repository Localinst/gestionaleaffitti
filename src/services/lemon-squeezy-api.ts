import axios from 'axios';

const API_URL = '/api/lemon-squeezy';

/**
 * Ottiene un prodotto Lemon Squeezy tramite il suo ID
 */
export const getProduct = async (productId: string) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero del prodotto:', error);
    throw error;
  }
};

/**
 * Ottiene tutti i prodotti dello store
 */
export const getProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dei prodotti:', error);
    throw error;
  }
};

/**
 * Ottiene tutte le varianti di un prodotto
 */
export const getProductVariants = async (productId: string) => {
  try {
    const response = await axios.get(`${API_URL}/variants?productId=${productId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero delle varianti del prodotto:', error);
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
    const response = await axios.post(`${API_URL}/create-checkout`, {
      variantId,
      email: customerEmail,
      customData
    });
    return response.data;
  } catch (error) {
    console.error('Errore nella creazione del checkout:', error);
    throw error;
  }
};

/**
 * Ottiene i dettagli di un ordine
 */
export const getOrder = async (orderId: string) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dell\'ordine:', error);
    throw error;
  }
};

/**
 * Ottiene le sottoscrizioni dell'utente
 */
export const getUserSubscriptions = async (userId: string) => {
  try {
    const response = await axios.get(`${API_URL}/subscriptions?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero delle sottoscrizioni:', error);
    throw error;
  }
};

/**
 * Ottiene i dettagli di una sottoscrizione
 */
export const getSubscription = async (subscriptionId: string) => {
  try {
    const response = await axios.get(`${API_URL}/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero della sottoscrizione:', error);
    throw error;
  }
};

/**
 * Aggiorna una sottoscrizione (ad es. upgrade/downgrade)
 */
export const updateSubscription = async (subscriptionId: string, variantId: string) => {
  try {
    const response = await axios.patch(`${API_URL}/subscriptions/${subscriptionId}`, {
      variantId
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento della sottoscrizione:', error);
    throw error;
  }
};

/**
 * Cancella una sottoscrizione
 */
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const response = await axios.delete(`${API_URL}/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nella cancellazione della sottoscrizione:', error);
    throw error;
  }
}; 