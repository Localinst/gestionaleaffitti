import { Pool } from 'pg';

// Ottieni la stringa di connessione dalla variabile d'ambiente
const connectionString = process.env.DATABASE_URL;

// Configurazione della connessione al database
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Necessario per connessioni SSL a Supabase
  }
});

// Testa la connessione all'avvio dell'applicazione
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Errore di connessione al database:', err);
    console.error('Stringa di connessione utilizzata:', connectionString ? 'Impostata' : 'Non impostata');
  } else {
    console.log('Connessione al database stabilita:', res.rows[0].now);
  }
});

// Funzione helper per eseguire query
export async function query(text: string, params?: any[]) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Errore nell\'esecuzione della query:', error);
    throw error;
  }
}

export default pool; 