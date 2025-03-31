import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const client = await pool.connect();
    
    // Leggi il file di migrazione
    const migrationPath = path.join(__dirname, 'migrations', 'alter_tenants_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Esegui la migrazione
    await client.query(migrationSQL);
    
    console.log('Migrazione completata con successo');
    
    client.release();
  } catch (error) {
    console.error('Errore durante la migrazione:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 