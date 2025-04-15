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
  for (let i = 0; i < data.length; i++) {
    const transaction = data[i];
    const rowNum = i + 1;
    
    // Verifica formato data
    if (transaction.date && !isValidDate(transaction.date)) {
      errors.push(`Riga ${rowNum}: Data transazione non valida`);
    }
    
    // Verifica formato importo
    if (transaction.amount && isNaN(Number(transaction.amount))) {
      errors.push(`Riga ${rowNum}: Importo transazione deve essere un numero`);
    }
    
    // Verifica enum tipo
    if (transaction.type && !['income', 'expense'].includes(transaction.type.toLowerCase())) {
      errors.push(`Riga ${rowNum}: Tipo transazione non valido. Valori consentiti: income, expense`);
    }
    
    // Verifica formato ID proprietà
    if (transaction.property_id && isNaN(Number(transaction.property_id))) {
      errors.push(`Riga ${rowNum}: ID proprietà deve essere un numero`);
    }
    
    // Verifica formato ID inquilino
    if (transaction.tenant_id && isNaN(Number(transaction.tenant_id))) {
      errors.push(`Riga ${rowNum}: ID inquilino deve essere un numero`);
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