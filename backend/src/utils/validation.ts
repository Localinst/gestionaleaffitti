/**
 * Funzione per validare i dati importati in base al tipo di entità
 */
export function validateImportData(entityType: string, data: any[]): string[] {
  const errors: string[] = [];

  switch (entityType) {
    case 'property':
      validateProperties(data, errors);
      break;
    case 'tenant':
      validateTenants(data, errors);
      break;
    case 'contract':
      validateContracts(data, errors);
      break;
    case 'transaction':
      validateTransactions(data, errors);
      break;
    default:
      errors.push(`Tipo di entità '${entityType}' non supportato`);
  }

  return errors;
}

/**
 * Validazione proprietà - verifica solo il formato dei campi presenti
 */
function validateProperties(data: any[], errors: string[]): void {
  for (let i = 0; i < data.length; i++) {
    const property = data[i];
    const rowNum = i + 1;
    
    // Verifica formato dei campi numerici
    if (property.rooms && isNaN(Number(property.rooms))) {
      errors.push(`Riga ${rowNum}: Il numero di stanze deve essere un numero valido`);
    }
    
    if (property.bathrooms && isNaN(Number(property.bathrooms))) {
      errors.push(`Riga ${rowNum}: Il numero di bagni deve essere un numero valido`);
    }
    
    if (property.area && isNaN(Number(property.area))) {
      errors.push(`Riga ${rowNum}: L'area deve essere un numero valido`);
    }
    
    if (property.price && isNaN(Number(property.price))) {
      errors.push(`Riga ${rowNum}: Il prezzo deve essere un numero valido`);
    }
  }
}

/**
 * Validazione inquilini - verifica solo il formato dei campi presenti
 */
function validateTenants(data: any[], errors: string[]): void {
  for (let i = 0; i < data.length; i++) {
    const tenant = data[i];
    const rowNum = i + 1;
    
    // Verifica formato email se presente
    if (tenant.email && !isValidEmail(tenant.email)) {
      errors.push(`Riga ${rowNum}: Email inquilino non valida`);
    }
  }
}

/**
 * Validazione contratti - verifica solo il formato dei campi presenti
 */
function validateContracts(data: any[], errors: string[]): void {
  for (let i = 0; i < data.length; i++) {
    const contract = data[i];
    const rowNum = i + 1;
    
    // Verifica formato numerico degli ID
    if (contract.property_id && isNaN(Number(contract.property_id))) {
      errors.push(`Riga ${rowNum}: ID proprietà deve essere un numero`);
    }
    
    if (contract.tenant_id && isNaN(Number(contract.tenant_id))) {
      errors.push(`Riga ${rowNum}: ID inquilino deve essere un numero`);
    }
    
    // Verifica formato date
    if (contract.start_date && !isValidDate(contract.start_date)) {
      errors.push(`Riga ${rowNum}: Data inizio contratto non valida`);
    }
    
    if (contract.end_date && !isValidDate(contract.end_date)) {
      errors.push(`Riga ${rowNum}: Data fine contratto non valida`);
    }
    
    // Verifica formato importi
    if (contract.rent_amount && isNaN(Number(contract.rent_amount))) {
      errors.push(`Riga ${rowNum}: Importo affitto deve essere un numero`);
    }
    
    if (contract.deposit_amount && isNaN(Number(contract.deposit_amount))) {
      errors.push(`Riga ${rowNum}: Importo deposito deve essere un numero`);
    }
    
    // Verifica enum status
    if (contract.status && !['active', 'expired', 'terminated'].includes(contract.status.toLowerCase())) {
      errors.push(`Riga ${rowNum}: Stato contratto non valido. Valori consentiti: active, expired, terminated`);
    }
  }
}

/**
 * Validazione transazioni - verifica solo il formato dei campi presenti
 */
function validateTransactions(data: any[], errors: string[]): void {
  console.log(`Validazione di ${data.length} transazioni`);
  
  // Logger per le prime 5 transazioni per debug
  if (data.length > 0) {
    console.log("Esempio prima transazione:", JSON.stringify(data[0], null, 2));
  }
  
  let infoLog = `Tipo dei campi nella prima transazione:\n`;
  if (data.length > 0) {
    Object.keys(data[0]).forEach(key => {
      infoLog += `- ${key}: ${typeof data[0][key]} (valore: ${JSON.stringify(data[0][key])})\n`;
    });
  }
  console.log(infoLog);
  
  for (let i = 0; i < data.length; i++) {
    const transaction = data[i];
    const rowNum = i + 1;
    
    try {
      // Verifica formato data (più tollerante)
      if (transaction.date) {
        // Converti in oggetto Date se è una stringa
        const dateObj = new Date(transaction.date);
        if (isNaN(dateObj.getTime())) {
          errors.push(`Riga ${rowNum}: Data transazione non valida: '${transaction.date}'`);
          console.warn(`Transazione ${rowNum}: Data non valida: ${transaction.date}`);
        } else {
          // Sostituisci la data con un formato standard ISO se è valida
          transaction.date = dateObj.toISOString().split('T')[0];
        }
      }
      
      // Verifica formato importo
      if (transaction.amount !== undefined) {
        // Se è una stringa, prova a convertirla in numero
        if (typeof transaction.amount === 'string') {
          const cleanedAmount = transaction.amount.replace(/,/g, '.').replace(/[^\d.-]/g, '');
          const numAmount = parseFloat(cleanedAmount);
          
          if (isNaN(numAmount)) {
            errors.push(`Riga ${rowNum}: Importo transazione deve essere un numero. Valore attuale: '${transaction.amount}'`);
            console.warn(`Transazione ${rowNum}: Importo non numerico: ${transaction.amount}`);
          } else {
            // Sostituisci con il valore numerico
            transaction.amount = numAmount;
          }
        } else if (typeof transaction.amount !== 'number') {
          errors.push(`Riga ${rowNum}: Importo transazione deve essere un numero. Tipo attuale: ${typeof transaction.amount}`);
          console.warn(`Transazione ${rowNum}: Importo tipo non valido: ${typeof transaction.amount}`);
        }
      }
      
      // Verifica enum tipo
      if (transaction.type && typeof transaction.type === 'string') {
        const normalizedType = transaction.type.toString().toLowerCase().trim();
        if (!['income', 'expense'].includes(normalizedType)) {
          errors.push(`Riga ${rowNum}: Tipo transazione '${transaction.type}' non valido. Valori consentiti: income, expense`);
          console.warn(`Transazione ${rowNum}: Tipo non valido: ${transaction.type}`);
        } else {
          // Normalizza il tipo
          transaction.type = normalizedType;
        }
      }
      
      // Verifica property_id e tenant_id (più permissiva, visto che non sono campi obbligatori)
      if (transaction.property_id !== undefined && transaction.property_id !== null && transaction.property_id !== '') {
        // Non validare il formato, sarà compito del backend gestire la conversione
        // Ma segnala comunque a fini di debug
        console.log(`Transazione ${rowNum}: property_id=${transaction.property_id} (${typeof transaction.property_id})`);
      }
      
      if (transaction.tenant_id !== undefined && transaction.tenant_id !== null && transaction.tenant_id !== '') {
        // Non validare il formato, sarà compito del backend gestire la conversione
        // Ma segnala comunque a fini di debug
        console.log(`Transazione ${rowNum}: tenant_id=${transaction.tenant_id} (${typeof transaction.tenant_id})`);
      }
    } catch (e: any) {
      console.error(`Errore durante la validazione della transazione ${rowNum}:`, e);
      errors.push(`Riga ${rowNum}: Errore generico nella validazione: ${e.message || 'errore sconosciuto'}`);
    }
  }
}

/**
 * Verifica validità email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Verifica validità data
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
} 