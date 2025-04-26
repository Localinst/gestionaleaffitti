import axios from 'axios';

const BASE_URL = '/api/paddle';

// Client API configurato secondo le specifiche di Paddle
const paddleClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Ottiene un prodotto Paddle tramite il suo ID
 */
export const getProduct = async (productId: string, include?: string[]) => {
  try {
    const includeParam = include?.length ? `?include=${include.join(',')}` : '';
    const response = await paddleClient.get(`/products/${productId}${includeParam}`);
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
    const response = await paddleClient.get(`/products${includeParam}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dei prodotti:', error);
    throw error;
  }
};

/**
 * Ottiene tutte le varianti di un prodotto (prezzi in Paddle)
 */
export const getProductVariants = async (productId: string) => {
  try {
    const response = await paddleClient.get(`/prices?filter[product_id]=${productId}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dei prezzi del prodotto:', error);
    throw error;
  }
};

/**
 * Crea un checkout per un prodotto specifico
 */
export const createCheckout = async (
  priceId: string, 
  customerEmail?: string, 
  customData?: Record<string, any>
) => {
  try {
    console.log('Creazione checkout con dati:', { priceId, email: customerEmail, customData });
    
    // Inviamo la richiesta al backend per creare un checkout
    const response = await paddleClient.post(`/create-checkout`, {
      priceId,
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
export const getTransaction = async (transactionId: string, include?: string[]) => {
  try {
    const includeParam = include?.length ? `?include=${include.join(',')}` : '';
    const response = await paddleClient.get(`/transactions/${transactionId}${includeParam}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero della transazione:', error);
    throw error;
  }
};

/**
 * Ottiene le sottoscrizioni dell'utente
 */
export const getUserSubscriptions = async (userId: string, include?: string[]) => {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('filter[customer_id]', userId);
    if (include?.length) params.append('include', include.join(','));
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await paddleClient.get(`/subscriptions${queryString}`);
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
    const response = await paddleClient.get(`/subscriptions/${subscriptionId}${includeParam}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il recupero dell\'abbonamento:', error);
    throw error;
  }
};

/**
 * Aggiorna una sottoscrizione (ad es. upgrade/downgrade)
 */
export const updateSubscription = async (subscriptionId: string, priceId: string) => {
  try {
    const payload = {
      items: [
        { 
          priceId: priceId,
          quantity: 1 
        }
      ],
      prorationBillingMode: "prorated_immediately"
    };
    
    const response = await paddleClient.patch(`/subscriptions/${subscriptionId}`, payload);
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
    const response = await paddleClient.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante la cancellazione dell\'abbonamento:', error);
    throw error;
  }
};

/**
 * Test diagnostico per la connessione Paddle
 */
export const testPaddleConnection = async () => {
  try {
    console.log('Test diagnostico connessione Paddle');
    // Prima verifica se il server è raggiungibile
    const pingResponse = await paddleClient.get('/ping');
    console.log('Risposta ping:', pingResponse.data);
    
    // Prova a caricare i prodotti
    const productsResponse = await getProducts();
    console.log('Prodotti disponibili:', productsResponse);
    
    return {
      success: true,
      pingResponse: pingResponse.data,
      productsResponse: productsResponse
    };
  } catch (error: any) {
    console.error('Test diagnostico fallito:', error);
    return {
      success: false,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    };
  }
}; 