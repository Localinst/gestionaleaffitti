// Configurazione dell'URL API di base
function getAPIBaseUrl() {
  // Per debugging, mostra sempre quale URL viene usato
  const result = getActualAPIBaseUrl();
  console.log('API Base URL configurato:', result);
  return result;
}

// La funzione interna che determina l'URL effettivo
function getActualAPIBaseUrl() {
  // In ambiente di produzione, usa l'URL diretto del backend
  if (window.location.hostname !== 'localhost') {
    return 'https://gestionaleaffitti2.onrender.com/api';
  }
  
  // In ambiente di sviluppo locale, usa localhost
  return `${window.location.protocol}//${window.location.hostname}:3000/api`;
}

// URL base dell'API
export const API_URL = getAPIBaseUrl(); 