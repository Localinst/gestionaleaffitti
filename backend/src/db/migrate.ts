import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const client = await pool.connect();
    
    // Leggi i file di migrazione
    const migrationsPath = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordina i file per eseguire le migrazioni in ordine
    
    console.log('Esecuzione delle migrazioni:', migrationFiles);
    
    // Esegui ogni migrazione in sequenza
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsPath, file);
      const migrationSQL = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Esecuzione della migrazione: ${file}`);
      await client.query(migrationSQL);
      console.log(`Migrazione completata: ${file}`);
    }
    
    console.log('Tutte le migrazioni sono state completate con successo');
    
    client.release();
  } catch (error) {
    console.error('Errore durante la migrazione:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 