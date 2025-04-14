import { Contract, Activity, api } from '@/services/api';
import { addMonths, endOfMonth, isAfter, isBefore, differenceInCalendarMonths, format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Genera attività automatiche basate sui contratti esistenti
 * - Avvisi di scadenza per contratti in scadenza (3 mesi prima, 1 mese prima, 1 settimana prima)
 * - Avvisi di pagamento mensile per gli affitti
 */
export async function generateActivitiesFromContracts(): Promise<Activity[]> {
  try {
    // Carica tutti i contratti attivi
    const contracts = await api.contracts.getAll();
    const activeContracts = contracts.filter(c => c.status === 'active');
    
    console.log(`Trovati ${activeContracts.length} contratti attivi per la generazione di attività`);
    
    // Array per memorizzare tutte le attività generate
    const generatedActivities: Omit<Activity, 'id'>[] = [];
    
    // Genera attività per ciascun contratto
    for (const contract of activeContracts) {
      // Converti le date in oggetti Date
      const startDate = new Date(contract.start_date);
      const endDate = new Date(contract.end_date);
      const today = new Date();
      
      // Ottieni i dettagli della proprietà e dell'inquilino da visualizzare
      const properties = await api.properties.getAll();
      const tenants = await api.tenants.getAll();
      
      const property = properties.find(p => p.id.toString() === contract.property_id.toString());
      const tenant = tenants.find(t => t.id.toString() === contract.tenant_id.toString());
      
      const propertyName = property?.name || "Proprietà sconosciuta";
      const tenantName = tenant?.name || "Inquilino sconosciuto";
      
      // Assicurati che gli ID siano stringhe
      const propertyId = contract.property_id.toString();
      const tenantId = contract.tenant_id ? contract.tenant_id.toString() : undefined;
      
      // 1. Genera attività per le scadenze dei contratti
      await generateContractExpirationActivities(
        contract, 
        endDate, 
        today, 
        propertyName, 
        tenantName,
        propertyId,
        tenantId,
        generatedActivities
      );
      
      // 2. Genera attività per i pagamenti mensili degli affitti
      await generateRentPaymentActivities(
        contract, 
        startDate, 
        endDate, 
        today, 
        propertyName, 
        tenantName,
        propertyId,
        tenantId, 
        generatedActivities
      );
    }
    
    console.log(`Generate ${generatedActivities.length} attività in totale`);
    
    // Crea le attività nel database
    const createdActivities: Activity[] = [];
    
    for (const activity of generatedActivities) {
      try {
        const createdActivity = await api.activities.create(activity);
        createdActivities.push(createdActivity);
      } catch (error) {
        console.error('Errore nella creazione dell\'attività:', error);
      }
    }
    
    return createdActivities;
  } catch (error) {
    console.error('Errore nella generazione delle attività dai contratti:', error);
    return [];
  }
}

/**
 * Genera attività per le scadenze dei contratti
 */
async function generateContractExpirationActivities(
  contract: Contract,
  endDate: Date,
  today: Date,
  propertyName: string,
  tenantName: string,
  propertyId: string,
  tenantId: string | undefined,
  generatedActivities: Omit<Activity, 'id'>[]
): Promise<void> {
  const threeMonthsBefore = addDays(endDate, -90); // 3 mesi prima
  const oneMonthBefore = addDays(endDate, -30);    // 1 mese prima
  const oneWeekBefore = addDays(endDate, -7);      // 1 settimana prima
  
  // Genera attività per la scadenza a 3 mesi, se appropriato
  if (isAfter(threeMonthsBefore, today) || isSameDay(threeMonthsBefore, today)) {
    generatedActivities.push({
      description: `Contratto in scadenza tra 3 mesi con ${tenantName}`,
      property_id: propertyId,
      property_name: propertyName,
      tenant_id: tenantId,
      tenant_name: tenantName,
      date: threeMonthsBefore,
      type: 'contract_expiration',
      priority: 'low',
      status: 'pending',
      related_id: contract.id.toString()
    });
  }
  
  // Genera attività per la scadenza a 1 mese, se appropriato
  if (isAfter(oneMonthBefore, today) || isSameDay(oneMonthBefore, today)) {
    generatedActivities.push({
      description: `Contratto in scadenza tra 1 mese con ${tenantName}`,
      property_id: propertyId,
      property_name: propertyName,
      tenant_id: tenantId,
      tenant_name: tenantName,
      date: oneMonthBefore,
      type: 'contract_expiration',
      priority: 'medium',
      status: 'pending',
      related_id: contract.id.toString()
    });
  }
  
  // Genera attività per la scadenza a 1 settimana, se appropriato
  if (isAfter(oneWeekBefore, today) || isSameDay(oneWeekBefore, today)) {
    generatedActivities.push({
      description: `Contratto in scadenza tra 1 settimana con ${tenantName}`,
      property_id: propertyId,
      property_name: propertyName,
      tenant_id: tenantId,
      tenant_name: tenantName,
      date: oneWeekBefore,
      type: 'contract_expiration',
      priority: 'high',
      status: 'pending',
      related_id: contract.id.toString()
    });
  }
}

/**
 * Genera attività per i pagamenti mensili degli affitti
 */
async function generateRentPaymentActivities(
  contract: Contract,
  startDate: Date,
  endDate: Date,
  today: Date,
  propertyName: string,
  tenantName: string,
  propertyId: string,
  tenantId: string | undefined,
  generatedActivities: Omit<Activity, 'id'>[]
): Promise<void> {
  // Calcola il numero di mesi tra oggi e la data di fine contratto
  const monthsRemaining = differenceInCalendarMonths(endDate, today) + 1;
  
  // Genera un'attività per ogni mese rimanente, fino a un massimo di 12 mesi
  const monthsToGenerate = Math.min(monthsRemaining, 12);
  
  for (let i = 0; i < monthsToGenerate; i++) {
    const paymentMonth = addMonths(today, i);
    const paymentDate = new Date(paymentMonth.getFullYear(), paymentMonth.getMonth(), 1); // Primo del mese
    const formattedMonth = format(paymentMonth, 'MMMM yyyy', { locale: it });
    
    // Solo se il mese di pagamento è all'interno del periodo di contratto
    if (isAfter(paymentDate, startDate) && isBefore(paymentDate, endDate)) {
      generatedActivities.push({
        description: `Pagamento affitto per ${formattedMonth} - ${tenantName}`,
        property_id: propertyId,
        property_name: propertyName,
        tenant_id: tenantId,
        tenant_name: tenantName,
        date: paymentDate,
        type: 'rent_payment',
        priority: 'medium',
        status: 'pending',
        related_id: contract.id.toString()
      });
    }
  }
}

// Helper per verificare se due date sono nello stesso giorno
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
} 