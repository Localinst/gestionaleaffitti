/**
 * Script di test CORS per verificare se le intestazioni CORS sono impostate correttamente
 * Eseguire con: node cors-test.js
 */

// Importazione moduli
const fetch = require('node-fetch');

// URL API backend
const API_URL = 'https://gestionale-affitti-api.onrender.com';

// URL Client frontend
const CLIENT_URL = 'https://statuesque-malabi-216764.netlify.app';

async function testCORS() {
  console.log('Esecuzione test CORS...');
  
  // Test 1: Richiesta GET semplice
  console.log('\n1. Test ping - GET semplice:');
  try {
    const response = await fetch(`${API_URL}/api/ping`, {
      method: 'GET',
      headers: {
        'Origin': CLIENT_URL
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
    
    if (response.headers.get('access-control-allow-origin') === CLIENT_URL) {
      console.log('✅ CORS: OK - Header Access-Control-Allow-Origin impostato correttamente');
    } else {
      console.log('❌ CORS: ERRORE - Header Access-Control-Allow-Origin non impostato correttamente');
    }
    
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }

  // Test 2: Richiesta OPTIONS preflight
  console.log('\n2. Test preflight OPTIONS:');
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': CLIENT_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
    
    if (response.headers.get('access-control-allow-origin') === CLIENT_URL) {
      console.log('✅ Preflight: OK - Header Access-Control-Allow-Origin impostato correttamente');
    } else {
      console.log('❌ Preflight: ERRORE - Header Access-Control-Allow-Origin non impostato correttamente');
    }
    
    if (response.headers.get('access-control-allow-methods')) {
      console.log('✅ Preflight: OK - Header Access-Control-Allow-Methods impostato');
    } else {
      console.log('❌ Preflight: ERRORE - Header Access-Control-Allow-Methods non impostato');
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

// Esegui il test
testCORS(); 