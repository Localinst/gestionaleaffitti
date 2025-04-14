import { createClient } from '@supabase/supabase-js';

// URL e chiave di Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fdufcrgckojbaghdvhgj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Opzioni per il client Supabase
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};

// Crea un client Supabase con le opzioni configurate
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey || ''
);

// Estrai il project_ref dall'URL di Supabase
export const getProjectRef = () => {
  const url = new URL(supabaseUrl);
  return url.hostname.split('.')[0];
};

// Funzione di verifica diretta della chiave API
export const verifyApiKey = async () => {
  try {
    // Una query semplice per verificare se la chiave API funziona
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Funzione di utilità per verificare lo stato di Supabase
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('auth.users').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}; 