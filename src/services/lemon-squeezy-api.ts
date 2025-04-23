import axios from 'axios';

const API_URL = 'https://api.lemonsqueezy.com/v1';
const API_KEY = process.env.LEMON_SQUEEZY_API_KEY || '';
const STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID || '';

// Configurazione di base per le chiamate axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

/**
 * Ottiene un prodotto Lemon Squeezy tramite il suo ID
 */
export const getProduct = async (productId: string) => {
  try {
    const response = await api.get(`/products/${productId}`);
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
    const response = await api.get(`/products?filter[store_id]=${STORE_ID}`);
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
    const response = await api.get(`/variants?filter[product_id]=${productId}`);
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
    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            redirect_url: window.location.origin + '/abbonamento-confermato',
            receipt_button_text: 'Torna al Gestionale',
            receipt_link_url: window.location.origin + '/dashboard',
            receipt_thank_you_note: 'Grazie per il tuo acquisto!'
          },
          checkout_data: {
            email: customerEmail,
            custom: customData
          }
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: STORE_ID
            }
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId
            }
          }
        }
      }
    };

    const response = await api.post('/checkouts', payload);
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
    const response = await api.get(`/orders/${orderId}`);
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
    const response = await api.get(`/subscriptions?filter[user_id]=${userId}`);
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
    const response = await api.get(`/subscriptions/${subscriptionId}`);
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
    const payload = {
      data: {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          variant_id: variantId
        }
      }
    };

    const response = await api.patch(`/subscriptions/${subscriptionId}`, payload);
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
    const response = await api.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Errore nella cancellazione della sottoscrizione:', error);
    throw error;
  }
}; 