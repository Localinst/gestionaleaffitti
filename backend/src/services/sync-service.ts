import cron from 'node-cron';
import { executeQuery } from '../db';
import { syncIcalCalendar } from '../routes/integrations';

// Definizione dell'interfaccia per le integrazioni
interface Integration {
  id: number;
  user_id: string;
  property_id: number;
  integration_type: string;
  sync_url: string;
  external_id?: string;
  is_active?: boolean;
}

/**
 * Avvia il servizio di sincronizzazione periodica per i calendari esterni.
 */
export function startSyncService() {
  console.log('Avvio del servizio di sincronizzazione calendari...');
  
  // Sincronizza ogni ora (è possibile modificare la frequenza)
  cron.schedule('0 * * * *', async () => {
    console.log('Esecuzione sincronizzazione calendari pianificata:', new Date().toISOString());
    
    try {
      // Recupera tutte le integrazioni attive
      const integrations = await executeQuery(async (client) => {
        return client.query(
          `SELECT * FROM external_integrations 
           WHERE is_active = TRUE 
           AND integration_type = 'ical'`
        );
      });
      
      if (integrations.rows.length === 0) {
        console.log('Nessuna integrazione da sincronizzare');
        return;
      }
      
      console.log(`Trovate ${integrations.rows.length} integrazioni da sincronizzare`);
      
      // Conta quante sincronizzazioni sono state completate
      let completedSync = 0;
      let failedSync = 0;
      
      // Esecuzione sequenziale per evitare sovraccarichi
      for (const integration of integrations.rows as Integration[]) {
        try {
          console.log(`Sincronizzazione integrazione ID ${integration.id} per proprietà ${integration.property_id}`);
          
          // Aggiorna il timestamp prima di iniziare
          await executeQuery(async (client) => {
            return client.query(
              `UPDATE external_integrations 
               SET last_sync = NOW() 
               WHERE id = $1`,
              [integration.id]
            );
          });
          
          await syncIcalCalendar(
            integration.user_id,
            integration.property_id,
            integration.sync_url
          );
          
          completedSync++;
        } catch (error: unknown) {
          failedSync++;
          // Type assertion per error
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
          console.error(`Errore nella sincronizzazione dell'integrazione ${integration.id}:`, error);
          
          // Registra l'errore nell'integrazione
          try {
            await executeQuery(async (client) => {
              return client.query(
                `UPDATE external_integrations 
                 SET credentials = jsonb_set(credentials, '{last_error}', $1::jsonb)
                 WHERE id = $2`,
                [JSON.stringify({
                  message: errorMessage,
                  timestamp: new Date().toISOString()
                }), integration.id]
              );
            });
          } catch (updateError) {
            console.error('Errore nel registrare l\'errore di sincronizzazione:', updateError);
          }
        }
      }
      
      console.log(`Sincronizzazione completata: ${completedSync} successi, ${failedSync} fallimenti su ${integrations.rows.length} integrazioni`);
    } catch (error) {
      console.error('Errore generale nel servizio di sincronizzazione:', error);
    }
  });
  
  console.log('Servizio di sincronizzazione calendari avviato con successo');
}

/**
 * Funzione di supporto per sincronizzare manualmente tutte le integrazioni.
 */
export async function syncAllIntegrations() {
  console.log('Avvio sincronizzazione manuale di tutte le integrazioni...');
  
  try {
    // Recupera tutte le integrazioni attive
    const integrations = await executeQuery(async (client) => {
      return client.query(
        `SELECT * FROM external_integrations 
         WHERE is_active = TRUE 
         AND integration_type = 'ical'`
      );
    });
    
    console.log(`Trovate ${integrations.rows.length} integrazioni da sincronizzare`);
    
    // Conta quante sincronizzazioni sono state completate
    let completedSync = 0;
    
    // Esegui sincronizzazioni in parallelo (con limite di concorrenza)
    const results = await Promise.allSettled(
      (integrations.rows as Integration[]).map(integration => 
        syncIcalCalendar(
          integration.user_id,
          integration.property_id,
          integration.sync_url
        )
      )
    );
    
    // Conta i risultati
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        completedSync++;
      }
    });
    
    console.log(`Sincronizzazione manuale completata: ${completedSync}/${integrations.rows.length} calendari`);
    return { success: true, completed: completedSync, total: integrations.rows.length };
  } catch (error) {
    console.error('Errore nella sincronizzazione manuale:', error);
    throw error;
  }
} 