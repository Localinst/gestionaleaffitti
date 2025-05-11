import express from 'express';
import { executeQuery } from '../db';
import { validateImportData } from '../utils/validation';

const router = express.Router();

/**
 * Endpoint specifico per importare inquilini
 * POST /api/import/tenants
 */
router.post('/tenants', async (req, res) => {
  try {
    const { tenants } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(tenants) || tenants.length === 0) {
      return res.status(400).json({ error: 'Dati inquilini non validi o mancanti' });
    }

    console.log(`Richiesta importazione diretta per ${tenants.length} inquilini da utente ${userId}`);

    // Validazione dei dati degli inquilini
    const validationErrors = validateImportData('tenant', tenants);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Verifica che tutte le proprietà appartengano all'utente
    const validPropertyIds = new Set<string | number>();
    const propertyIds = tenants
      .filter(tenant => tenant.property_id)
      .map(tenant => tenant.property_id);
    
    // Se ci sono property_id, verifica che appartengano all'utente
    if (propertyIds.length > 0) {
      await executeQuery(async (client) => {
        // Crea placeholders per la query IN
        const placeholders = propertyIds.map((_, i) => `$${i + 1}`).join(',');
        const query = `
          SELECT id FROM properties 
          WHERE id IN (${placeholders}) 
          AND user_id = $${propertyIds.length + 1}::uuid
        `;
        const result = await client.query(query, [...propertyIds, userId]);
        
        // Aggiungi al set tutte le proprietà valide
        result.rows.forEach((row: { id: number }) => {
          validPropertyIds.add(row.id);
        });
        
        console.log(`Trovate ${validPropertyIds.size}/${propertyIds.length} proprietà valide`);
      });
    }

    // Prepara gli inquilini per l'importazione
    // Assegna user_id a tutti gli inquilini
    // Filtra solo i property_id non validi (ma mantieni quelli senza property_id)
    const validTenants = tenants.map(tenant => {
      // Se property_id è presente ma non valido, lo rimuoviamo
      if (tenant.property_id && !validPropertyIds.has(tenant.property_id)) {
        console.warn(`Inquilino ${tenant.name || 'senza nome'} ha property_id non valido o non appartenente all'utente. Rimozione property_id.`);
        const { property_id, ...tenantWithoutProperty } = tenant;
        return {
          ...tenantWithoutProperty,
          user_id: userId
        };
      }
      
      // Altrimenti mantieni l'inquilino com'è, aggiungendo user_id
      return {
        ...tenant,
        user_id: userId
      };
    });
    
    console.log(`Preparati ${validTenants.length} inquilini per l'importazione`);

    // Importa tutti gli inquilini
    try {
      const importedCount = await importTenants(validTenants);
      console.log(`Importati con successo ${importedCount}/${validTenants.length} inquilini`);
      
      return res.status(200).json({ 
        message: `Importazione completata: ${importedCount} inquilini importati su ${tenants.length} totali`,
        importedCount,
        totalCount: tenants.length
      });
    } catch (dbError) {
      console.error('Errore durante l\'inserimento nel database:', dbError);
      return res.status(500).json({ 
        error: 'Errore durante l\'inserimento degli inquilini nel database',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      });
    }
  } catch (error) {
    console.error('Errore durante l\'importazione degli inquilini:', error);
    return res.status(500).json({ error: 'Errore durante l\'importazione degli inquilini' });
  }
});

/**
 * Endpoint specifico per importare contratti
 * POST /api/import/contracts
 */
router.post('/contracts', async (req, res) => {
  try {
    const { contracts } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ error: 'Dati contratti non validi o mancanti' });
    }

    console.log(`Richiesta importazione diretta per ${contracts.length} contratti da utente ${userId}`);

    // Validazione dei dati dei contratti
    const validationErrors = validateImportData('contract', contracts);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Verifica che tutte le proprietà e gli inquilini appartengano all'utente
    const validPropertyIds = new Set<string | number>();
    const validTenantIds = new Set<string | number>();
    
    const propertyIds = contracts
      .filter(contract => contract.property_id)
      .map(contract => contract.property_id);
    
    const tenantIds = contracts
      .filter(contract => contract.tenant_id)
      .map(contract => contract.tenant_id);
    
    // Se ci sono property_id, verifica che appartengano all'utente
    if (propertyIds.length > 0) {
      await executeQuery(async (client) => {
        // Crea placeholders per la query IN
        const placeholders = propertyIds.map((_, i) => `$${i + 1}`).join(',');
        const query = `
          SELECT id FROM properties 
          WHERE id IN (${placeholders}) 
          AND user_id = $${propertyIds.length + 1}::uuid
        `;
        const result = await client.query(query, [...propertyIds, userId]);
        
        // Aggiungi al set tutte le proprietà valide
        result.rows.forEach((row: { id: number }) => {
          validPropertyIds.add(row.id);
        });
        
        console.log(`Trovate ${validPropertyIds.size}/${propertyIds.length} proprietà valide`);
      });
    }
    
    // Se ci sono tenant_id, verifica che appartengano all'utente
    if (tenantIds.length > 0) {
      await executeQuery(async (client) => {
        // Crea placeholders per la query IN
        const placeholders = tenantIds.map((_, i) => `$${i + 1}`).join(',');
        const query = `
          SELECT id FROM tenants 
          WHERE id IN (${placeholders}) 
          AND user_id = $${tenantIds.length + 1}::uuid
        `;
        const result = await client.query(query, [...tenantIds, userId]);
        
        // Aggiungi al set tutti gli inquilini validi
        result.rows.forEach((row: { id: number }) => {
          validTenantIds.add(row.id);
        });
        
        console.log(`Trovati ${validTenantIds.size}/${tenantIds.length} inquilini validi`);
      });
    }

    // Prepara i contratti validi per l'importazione
    const contractsToImport = contracts.map(contract => {
      const isPropertyValid = !contract.property_id || validPropertyIds.has(contract.property_id);
      const isTenantValid = !contract.tenant_id || validTenantIds.has(contract.tenant_id);
      
      // Log per debug
      if (!isPropertyValid) {
        console.warn(`Proprietà ID ${contract.property_id} non appartiene all'utente ${userId}`);
      }
      if (!isTenantValid) {
        console.warn(`Inquilino ID ${contract.tenant_id} non appartiene all'utente ${userId}`);
      }
      
      return {
        ...contract,
        user_id: userId,
        _valid: isPropertyValid && isTenantValid
      };
    });
    
    // Filtra solo i contratti validi
    const validContractsToImport = contractsToImport.filter(contract => contract._valid);
    
    console.log(`Tentativo di importazione di ${validContractsToImport.length}/${contracts.length} contratti validi`);
    
    // Rimuovi la proprietà _valid dai contratti validi
    const cleanedContractsToImport = validContractsToImport.map(({ _valid, ...rest }) => rest);
    
    // Importa i contratti
    try {
      const importedCount = await importContracts(cleanedContractsToImport);
      return res.status(200).json({ 
        success: true, 
        message: `Importati con successo ${importedCount} contratti su ${validContractsToImport.length} validi (${contracts.length} totali)` 
      });
    } catch (dbError) {
      console.error('Errore durante l\'importazione dei contratti:', dbError);
      return res.status(500).json({ 
        error: 'Errore durante l\'importazione dei contratti', 
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      });
    }
  } catch (error: unknown) {
    console.error('Errore nella gestione dell\'importazione dei contratti:', error);
    return res.status(500).json({ 
      error: 'Errore nella gestione dell\'importazione dei contratti', 
      details: (error as Error).message 
    });
  }
});

/**
 * Endpoint per importare dati da file Excel
 * POST /api/import/:entityType
 */
router.post('/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { data } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Dati non validi o mancanti' });
    }

    console.log(`Richiesta importazione per ${entityType} con ${data.length} record da utente ${userId}`);

    // Aggiunta di log dettagliati per transazioni
    if (entityType === 'transaction') {
      console.log('Endpoint transazioni standard invocato con importazione a blocchi');
      if (data.length > 0) {
        console.log('Primo record di esempio:', JSON.stringify(data[0], null, 2));
      }
    }

    // Validazione dei dati in base al tipo di entità
    const validationErrors = validateImportData(entityType, data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Aggiungi user_id a tutti i record
    const dataWithUserId = data.map(item => ({
      ...item,
      user_id: userId
    }));

    // Elaborazione in base al tipo di entità
    let importedCount = 0;
    switch (entityType) {
      case 'property':
        importedCount = await importProperties(dataWithUserId);
        break;
      case 'tenant':
        importedCount = await importTenants(dataWithUserId);
        break;
      case 'contract':
        importedCount = await importContracts(dataWithUserId);
        break;
      case 'transaction':
        console.log(`Inizio importazione ${dataWithUserId.length} transazioni...`);
        importedCount = await importTransactions(dataWithUserId);
        console.log(`Fine importazione transazioni: ${importedCount} inserite con successo`);
        break;
      default:
        return res.status(400).json({ error: `Tipo di entità '${entityType}' non supportato` });
    }

    return res.status(200).json({ 
      message: `Importazione completata con successo: ${importedCount} record importati`,
      importedCount,
      totalCount: data.length
    });
  } catch (error) {
    console.error('Errore durante l\'importazione:', error);
    return res.status(500).json({ error: 'Errore durante l\'importazione dei dati' });
  }
});

/**
 * Endpoint per importare dati a blocchi (chunk)
 * POST /api/import/:entityType/chunk
 */
router.post('/:entityType/chunk', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { data } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Dati non validi o mancanti' });
    }

    console.log(`Richiesta importazione chunk per ${entityType} con ${data.length} record da utente ${userId}`);

    // Validazione dei dati in base al tipo di entità
    const validationErrors = validateImportData(entityType, data);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Aggiungi user_id a tutti i record
    const dataWithUserId = data.map(item => ({
      ...item,
      user_id: userId
    }));

    // Elaborazione in base al tipo di entità
    let importedCount = 0;
    switch (entityType) {
      case 'properties':
        importedCount = await importProperties(dataWithUserId);
        break;
      case 'tenants':
        importedCount = await importTenants(dataWithUserId);
        break;
      case 'contracts':
        importedCount = await importContracts(dataWithUserId);
        break;
      case 'transactions':
        importedCount = await importTransactions(dataWithUserId);
        break;
      default:
        return res.status(400).json({ error: `Tipo di entità '${entityType}' non supportato` });
    }

    return res.status(200).json({ 
      message: `Chunk importato con successo: ${importedCount} record importati`,
      importedCount,
      totalCount: data.length
    });
  } catch (error) {
    console.error('Errore durante l\'importazione del chunk:', error);
    return res.status(500).json({ error: 'Errore durante l\'importazione del chunk di dati' });
  }
});

// Funzione per importare inquilini
async function importTenants(data: any[]): Promise<number> {
  let importedCount = 0;
  
  console.log(`Tentativo di importare ${data.length} inquilini`);
  
  for (const tenant of data) {
    try {
      console.log(`Importazione inquilino: ${tenant.name || 'senza nome'}`);
      
      await executeQuery(async (client) => {
        // Costruisci dinamicamente la query in base ai campi presenti
        const fields: string[] = [];
        const placeholders: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        // Mappa solo i campi presenti nei dati
        const possibleFields = [
          'name', 'email', 'phone', 'fiscal_code', 
          'address', 'city', 'postal_code', 'notes', 
          'property_id', 'unit', 'status', 'user_id',
          'lease_start', 'lease_end', 'rent'
        ];
        
        possibleFields.forEach(field => {
          if (tenant[field] !== undefined && tenant[field] !== null) {
            fields.push(field);
            placeholders.push(`$${paramIndex}`);
            values.push(tenant[field]);
            paramIndex++;
          }
        });
        
        if (fields.length === 0) {
          console.warn('Nessun campo valido trovato per l\'inquilino');
          return;
        }
        
        // Assicurati che user_id sia incluso
        if (!fields.includes('user_id') && tenant.user_id) {
          fields.push('user_id');
          placeholders.push(`$${paramIndex}`);
          values.push(tenant.user_id);
          paramIndex++;
        }
        
        const query = `
          INSERT INTO tenants 
          (${fields.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING id
        `;
        
        console.log(`Query per inquilino ${tenant.name || 'senza nome'}:`, query);
        console.log('Campi:', fields);
        
        try {
          const result = await client.query(query, values);
          
          if (result.rows.length > 0) {
            console.log(`Inquilino ${tenant.name} inserito con ID:`, result.rows[0].id);
            importedCount++;
          } else {
            console.warn(`Inquilino ${tenant.name} non inserito: nessun ID restituito`);
          }
        } catch (queryError: any) {
          console.error(`Errore nella query per inquilino ${tenant.name}:`, queryError.message);
          throw queryError; // Rilancia l'errore per gestirlo a livello superiore
        }
      });
    } catch (error: any) {
      console.error(`Errore nell'importazione dell'inquilino: ${tenant.name || 'senza nome'}`, error.message);
      throw error; // Rilancia l'errore per gestirlo a livello superiore
    }
  }
  
  console.log(`Importazione completata: ${importedCount} inquilini inseriti`);
  return importedCount;
}

// Funzione per importare proprietà
async function importProperties(data: any[]): Promise<number> {
  let importedCount = 0;
  
  for (const property of data) {
    try {
      await executeQuery(async (client) => {
        // Costruisci dinamicamente la query in base ai campi presenti
        const fields: string[] = [];
        const placeholders: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        // Tutti i campi devono essere facoltativi, assegniamo valori predefiniti per i campi obbligatori
        const propertyWithDefaults = {
          ...property,
          // Se address è mancante, usa un valore predefinito
          address: property.address || "Indirizzo non specificato",
          // Se name è mancante, usa un valore predefinito
          name: property.name || "Nuova Proprietà",
          // Se city è mancante, usa un valore predefinito
          city: property.city || "Città non specificata",
          // Se type è mancante, usa un valore predefinito
          type: property.type || "Altro"
        };
        
        // Mappa solo i campi presenti nei dati
        const possibleFields = ['name', 'address', 'city', 'postal_code', 'type', 'rooms', 'bathrooms', 'area', 'price', 'notes'];
        
        possibleFields.forEach(field => {
          if (propertyWithDefaults[field] !== undefined && propertyWithDefaults[field] !== null) {
            fields.push(field);
            placeholders.push(`$${paramIndex}`);
            values.push(propertyWithDefaults[field]);
            paramIndex++;
          }
        });
        
        if (fields.length === 0) {
          console.warn('Nessun campo valido trovato per la proprietà');
          return;
        }
        
        // Assicurati che user_id sia incluso
        if (propertyWithDefaults.user_id) {
          fields.push('user_id');
          placeholders.push(`$${paramIndex}::uuid`);  // Aggiungi il cast ::uuid
          values.push(propertyWithDefaults.user_id);
          paramIndex++;
        }
        
        const query = `
          INSERT INTO properties 
          (${fields.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING id
        `;
        
        const result = await client.query(query, values);
        
        if (result.rows.length > 0) {
          importedCount++;
        }
      });
    } catch (error) {
      console.error(`Errore nell'importazione della proprietà: ${property.name || 'senza nome'}`, error);
    }
  }
  
  return importedCount;
}

/**
 * Funzione per importare contratti
 * @param data Array di contratti da importare
 * @returns Numero di contratti importati con successo
 */
async function importContracts(data: any[]): Promise<number> {
  let importedCount = 0;
  
  for (const contract of data) {
    try {
      console.log(`Importazione contratto: ${contract.name || 'senza nome'} - Start date: ${contract.start_date || 'N/A'}`);
      
      // Imposta valori predefiniti per i campi obbligatori
      const contractWithDefaults = {
        ...contract,
        // Se start_date non è definita, imposta a oggi
        start_date: contract.start_date || new Date().toISOString().split('T')[0],
        // Se end_date non è definita, imposta a un anno dopo la data di inizio
        end_date: contract.end_date || (() => {
          const startDate = new Date(contract.start_date || new Date());
          const endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          return endDate.toISOString().split('T')[0];
        })(),
        // Imposta valori predefiniti per gli importi
        rent_amount: contract.rent_amount || 0,
        deposit_amount: contract.deposit_amount || 0,
        // Imposta stato predefinito se non specificato
        status: contract.status || 'active'
      };
      
      await executeQuery(async (client) => {
        // Costruisci dinamicamente la query in base ai campi presenti
        const fields: string[] = [];
        const placeholders: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        // Mappa solo i campi presenti nei dati
        const possibleFields = [
          'property_id', 'tenant_id', 'name', 'start_date', 'end_date', 
          'rent_amount', 'deposit_amount', 'payment_frequency', 'payment_day', 
          'status', 'contract_type', 'notes', 'user_id',
          'deposit_paid', 'automatic_renewal'
        ];
        
        possibleFields.forEach(field => {
          if (contractWithDefaults[field] !== undefined && contractWithDefaults[field] !== null) {
            // Aggiungi il cast ::uuid solo per il campo user_id
            if (field === 'user_id') {
              fields.push(field);
              placeholders.push(`$${paramIndex}::uuid`);
            } else {
              fields.push(field);
              placeholders.push(`$${paramIndex}`);
            }
            values.push(contractWithDefaults[field]);
            paramIndex++;
          }
        });
        
        if (fields.length === 0) {
          console.warn('Nessun campo valido trovato per il contratto');
          return;
        }
        
        // Assicurati che user_id sia incluso
        if (!fields.includes('user_id') && contractWithDefaults.user_id) {
          fields.push('user_id');
          placeholders.push(`$${paramIndex}::uuid`);  // Aggiungi il cast ::uuid
          values.push(contractWithDefaults.user_id);
          paramIndex++;
        }
        
        const query = `
          INSERT INTO contracts 
          (${fields.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING id
        `;
        
        console.log(`Query per contratto ${contractWithDefaults.name || 'senza nome'}:`, query);
        console.log('Campi:', fields);
        
        try {
          const result = await client.query(query, values);
          
          if (result.rows.length > 0) {
            console.log(`Contratto ${contractWithDefaults.name || 'senza nome'} inserito con ID:`, result.rows[0].id);
            importedCount++;
          } else {
            console.warn(`Contratto ${contractWithDefaults.name || 'senza nome'} non inserito: nessun ID restituito`);
          }
        } catch (queryError: any) {
          console.error(`Errore nella query per contratto ${contractWithDefaults.name || 'senza nome'}:`, queryError.message);
          throw queryError; // Rilancia l'errore per gestirlo a livello superiore
        }
      });
    } catch (error: any) {
      console.error(`Errore nell'importazione del contratto: ${contract.name || 'senza nome'}`, error.message);
      throw error; // Rilancia l'errore per gestirlo a livello superiore
    }
  }
  
  console.log(`Importazione completata: ${importedCount} contratti inseriti`);
  return importedCount;
}

// Funzione per importare transazioni con bulk insert
async function importTransactions(data: any[]): Promise<number> {
  let importedCount = 0;
  let errorCount = 0;
  
  console.log(`Tentativo di importare ${data.length} transazioni`);
  
  // Carica tutte le proprietà dell'utente per la conversione nome->id (mantieni questa parte)
  let propertiesMap = new Map<string, string>(); // mappa per nome in minuscolo → id
  
  try {
    // Usa executeQuery per ottenere tutte le proprietà dell'utente
    await executeQuery(async (client) => {
      const query = "SELECT id, name, address FROM properties WHERE user_id = $1";
      const result = await client.query(query, [data[0]?.user_id]); // Assume che user_id sia lo stesso per tutte le transazioni
      
      // Popola la mappa
      for (const property of result.rows) {
        if (property.name) {
          propertiesMap.set(property.name.toLowerCase().trim(), property.id);
        }
        if (property.address) {
          propertiesMap.set(property.address.toLowerCase().trim(), property.id);
        }
      }
      
      console.log(`Caricate ${result.rows.length} proprietà per conversione nome→id`);
    });
  } catch (error) {
    console.warn("Errore nel caricamento delle proprietà per la conversione nome→id:", error);
    // Continua comunque, useremo solo gli ID diretti
  }
  
  // OTTIMIZZAZIONE: Utilizza il batch insert
  try {
    console.log(`Inizio batch insert per ${data.length} transazioni`);
    
    // Prepara le transazioni normalizzate
    const normalizedTransactions = data.map(transaction => {
      // Gestione speciale per property_id
      if (transaction.property_id && typeof transaction.property_id === 'string') {
        // Controlla se non sembra un UUID valido
        if (!transaction.property_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // Potrebbe essere un nome, cerca nella mappa
          const normalizedName = transaction.property_id.toLowerCase().trim();
          if (propertiesMap.has(normalizedName)) {
            transaction.property_id = propertiesMap.get(normalizedName);
          } else {
            transaction.property_id = null;
          }
        }
      }

      // Normalizzazione dei dati per un inserimento sicuro
      return {
        // Campi obbligatori con valori predefiniti
        date: transaction.date || new Date().toISOString().split('T')[0],
        amount: typeof transaction.amount === 'number' ? transaction.amount : 
                parseFloat(String(transaction.amount).replace(/,/g, '.').replace(/[^\d.-]/g, '')) || 0,
        type: String(transaction.type || 'expense').toLowerCase(),
        // Campi opzionali
        category: transaction.category || 'Altro',
        description: transaction.description || null,
        // IDs
        property_id: transaction.property_id || null,
        tenant_id: transaction.tenant_id || null,
        user_id: transaction.user_id
      };
    });

    // Dividi in batch di massimo 200 transazioni per insert
    const batchSize = 200;
    const batches: any[][] = [];
    for (let i = 0; i < normalizedTransactions.length; i += batchSize) {
      batches.push(normalizedTransactions.slice(i, i + batchSize));
    }
    
    console.log(`Creati ${batches.length} batch per l'inserimento (${batchSize} transazioni per batch)`);

    // Processa ogni batch
    await executeQuery(async (client) => {
      for (const [batchIndex, batch] of batches.entries()) {
        try {
          console.log(`Elaborazione batch ${batchIndex + 1}/${batches.length}`);
        
          // Crea una query di bulk insert con VALUES multiple
          let queryParts = ['INSERT INTO transactions (date, amount, type, category, description, property_id, tenant_id, user_id) VALUES'];
          const values = [];
          let valueStrings = [];
          let paramCounter = 1;
          
          for (const transaction of batch) {
            // Crea i placeholder per questa transazione
            const placeholders = [
              `$${paramCounter++}`, // date
              `$${paramCounter++}`, // amount
              `$${paramCounter++}`, // type
              `$${paramCounter++}`, // category
              `$${paramCounter++}`, // description
              transaction.property_id ? `$${paramCounter++}::uuid` : 'NULL', // property_id
              transaction.tenant_id ? `$${paramCounter++}::uuid` : 'NULL', // tenant_id
              `$${paramCounter++}::uuid` // user_id
            ];
            
            // Aggiungi i valori all'array
            values.push(
              transaction.date, 
              transaction.amount, 
              transaction.type,
              transaction.category,
              transaction.description
            );
            
            // Aggiungi gli UUID solo se presenti
            if (transaction.property_id) values.push(transaction.property_id);
            if (transaction.tenant_id) values.push(transaction.tenant_id);
          values.push(transaction.user_id);
            
            // Aggiungi la stringa di placeholder
            valueStrings.push(`(${placeholders.join(', ')})`);
          }
          
          // Completa la query
          const fullQuery = queryParts.join(' ') + ' ' + valueStrings.join(', ') + ' RETURNING id';
          
          try {
            const result = await client.query(fullQuery, values);
            const inserted = result.rows.length;
            importedCount += inserted;
            console.log(`Batch ${batchIndex + 1}: inserite ${inserted} transazioni su ${batch.length}`);
          } catch (batchError) {
            console.error(`Errore nel batch ${batchIndex + 1}:`, batchError);
            errorCount += batch.length;
            
            // Se il batch insert fallisce, prova con insert singoli per recuperare il più possibile
            console.log(`Tentativo di recupero con insert singoli per il batch ${batchIndex + 1}`);
            for (const transaction of batch) {
              try {
                // Crea query singola
                const singleQuery = `
          INSERT INTO transactions 
                  (date, amount, type, category, description, property_id, tenant_id, user_id)
                  VALUES ($1, $2, $3, $4, $5, $6::uuid, $7::uuid, $8::uuid)
          RETURNING id
        `;
        
                const singleResult = await client.query(singleQuery, [
                  transaction.date,
                  transaction.amount,
                  transaction.type,
                  transaction.category,
                  transaction.description,
                  transaction.property_id,
                  transaction.tenant_id,
                  transaction.user_id
                ]);
          
                if (singleResult.rows.length > 0) {
            importedCount++;
                  errorCount--;
          }
              } catch (singleError: any) {
                // Log ma non fare nulla, continua con il prossimo
                console.error(`Fallimento anche con insert singolo per una transazione:`, singleError.message);
              }
        }
          }
        } catch (error) {
          console.error(`Errore generale nel batch ${batchIndex + 1}:`, error);
          errorCount += batch.length;
    }
  }
    });
  
    console.log(`Importazione completata: ${importedCount} transazioni inserite, ${errorCount} errori`);
  return importedCount;
  } catch (error) {
    console.error('Errore generale nell\'importazione delle transazioni:', error);
    return importedCount;
  }
}

export const importRouter = router; 