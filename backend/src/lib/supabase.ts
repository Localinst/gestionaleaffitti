import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// URL di Supabase e chiave anonima dai valori correnti in .env
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Crea un client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Client Supabase inizializzato (backend)');
console.log('Utilizzo URL Supabase:', supabaseUrl);
console.log('Chiave API Supabase di lunghezza:', supabaseKey.length); 