import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// !! USARE LA CHIAVE SERVICE ROLE PER IL BACKEND !!
// Questa chiave bypassa la RLS ed è necessaria per operazioni admin.
// NON USARE MAI QUESTA CHIAVE NEL FRONTEND.
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Controllo di sicurezza: assicurati che le variabili siano caricate
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL non è definito nel file .env del backend');
}
if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY non è definito nel file .env del backend. Questa chiave è necessaria per le operazioni admin.');
}

// Crea un client Supabase usando la chiave SERVICE ROLE
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  // Opzioni aggiuntive se necessario, ad esempio per gestire l'auth lato server:
  auth: {
    // autoRefreshToken: false, // Disabilita il refresh automatico se non usi sessioni utente qui
    // persistSession: false // Non persistere sessioni nel backend (stateless)
  }
});

console.log('Client Supabase inizializzato (backend) con CHIAVE SERVICE ROLE');
console.log('Utilizzo URL Supabase:', supabaseUrl);
console.log('Chiave API Supabase di lunghezza:', supabaseServiceRoleKey.length); 