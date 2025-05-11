import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle, FileUp, Map, Settings, Send, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";
import Papa from 'papaparse'; // Importa PapaParse
import { api } from "@/services/api";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next"; // Aggiungo l'importazione di useTranslation

// Tipi di entità che possono essere importate
type EntityType = "property" | "tenant" | "contract" | "transaction";

// Schema di mappatura per ogni tipo di entità
const entitySchemas: Record<EntityType, string[]> = {
  property: ["name", "address", "city", "postal_code", "type", "rooms", "bathrooms", "area", "price"],
  tenant: ["name", "email", "phone", "fiscal_code", "address", "city", "postal_code", "property_id"],
  contract: ["property_id", "tenant_id", "start_date", "end_date", "rent_amount", "deposit_amount", "status"],
  transaction: ["date", "amount", "type", "category", "description", "property_id", "tenant_id", "income_column", "expense_column"]
};

// Tipo per il metodo di formattazione delle transazioni
type TransactionFormattingMethod = 'sign' | 'label' | 'separate_columns';

export function ExcelImportWizard() {
  const { t } = useTranslation(); // Aggiungo l'hook useTranslation
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<EntityType>("property");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedMappings, setSavedMappings] = useState<Record<string, Record<string, string>>>({});

  // Stato per la formattazione delle transazioni
  const [transactionFormattingMethod, setTransactionFormattingMethod] = useState<TransactionFormattingMethod>('sign');
  const [incomeLabel, setIncomeLabel] = useState('Entrate'); // Valore predefinito
  const [expenseLabel, setExpenseLabel] = useState('Uscite'); // Valore predefinito
  const [isImporting, setIsImporting] = useState(false); // Stato per indicare l'importazione
  const [parsedCsvData, setParsedCsvData] = useState<any[]>([]); // Stato per dati CSV parsati
  
  // Nuovi stati per la gestione dei fogli Excel
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>("");

  // Nuovi stati per l'importazione resiliente
  const [importProgress, setImportProgress] = useState(0);
  const [isResuming, setIsResuming] = useState(false);
  const [savedImportState, setSavedImportState] = useState<any>(null);

  // Dopo gli stati
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyMap, setPropertyMap] = useState<{ [name: string]: string }>({});

  // Verifica se c'è un'importazione in sospeso
  useEffect(() => {
    const checkSavedImport = () => {
      try {
        const savedState = localStorage.getItem(`import_state_${entityType}`);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          if (parsedState.timestamp && (Date.now() - parsedState.timestamp < 24 * 60 * 60 * 1000)) {
            // Se lo stato salvato è più recente di 24 ore, lo consideriamo valido
            setSavedImportState(parsedState);
          } else {
            // Altrimenti, rimuoviamo lo stato obsoleto
            localStorage.removeItem(`import_state_${entityType}`);
          }
        }
      } catch (e) {
        console.error("Errore nel recupero dello stato di importazione salvato:", e);
        localStorage.removeItem(`import_state_${entityType}`);
      }
    };
    
    checkSavedImport();
  }, [entityType]);
  
  // Riprendi un'importazione in sospeso
  const resumeImport = async () => {
    if (!savedImportState || !savedImportState.data) {
      toast.error("Nessuno stato di importazione valido trovato");
      return;
    }
    
    setIsResuming(true);
    setIsImporting(true);
    
    try {
      const { data, progress } = savedImportState;
      setImportProgress(progress || 0);
      
      console.log(`Ripresa importazione per ${entityType} da ${progress}%. Record rimanenti: ${data.length}`);
      
      // Usa l'importazione a blocchi
      const result = await api.import.dataInChunks(
        entityType, 
        data, 
        50, // dimensione del blocco
        (progress) => {
          setImportProgress(progress);
          // Salva lo stato corrente
          const remainingData = data.slice(Math.floor(data.length * progress / 100));
          localStorage.setItem(`import_state_${entityType}`, JSON.stringify({
            entityType,
            data: remainingData,
            progress,
            timestamp: Date.now()
          }));
        }
      );
      
      // Rimuovi lo stato salvato dopo un'importazione riuscita
      localStorage.removeItem(`import_state_${entityType}`);
      
      toast.success(`${result.importedCount} ${entityType}(s) importati con successo!`);
      setStep(5); // Vai allo step di completamento
    } catch (error: any) {
      console.error("Errore durante la ripresa dell'importazione:", error);
      toast.error(`Errore durante l'importazione: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      setIsResuming(false);
      setIsImporting(false);
    }
  };

  // Carica il file Excel/CSV e leggi le intestazioni + anteprima
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const selectedFile = fileList[0];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    setFile(selectedFile);
    setParsedCsvData([]); // Resetta dati CSV precedenti
    setHeaders([]);
    setPreview([]);
    setWorksheets([]); // Resetta l'elenco dei fogli
    setSelectedWorksheet(""); // Resetta il foglio selezionato
    setMappings(savedMappings[entityType] || {}); // Carica mappatura salvata se esiste

    try {
      let columnHeaders: string[] = [];
      let previewData: any[] = [];

      if (fileExtension === 'xlsx') {
         console.log("Rilevato file .xlsx, uso ExcelJS");
         const workbook = new ExcelJS.Workbook();
         await workbook.xlsx.load(await selectedFile.arrayBuffer());
         
         // Estrai i nomi dei fogli di lavoro
         const worksheetNames = workbook.worksheets.map(ws => ws.name);
         setWorksheets(worksheetNames);
         
         if (worksheetNames.length === 0) {
           throw new Error("Nessun foglio di lavoro trovato nel file Excel.");
         }
         
         // Seleziona automaticamente il primo foglio
         const firstWorksheet = workbook.worksheets[0];
         setSelectedWorksheet(firstWorksheet.name);
         
         // Se c'è un solo foglio, procedi con la lettura
         if (worksheetNames.length === 1) {
           // Leggi headers da ExcelJS
           const headerRow = firstWorksheet.getRow(1);
           headerRow.eachCell({ includeEmpty: false }, (cell) => {
             const value = cell.value?.toString()?.trim();
             if (value) columnHeaders.push(value);
           });

           // Leggi anteprima da ExcelJS
           let rowCount = 0;
           firstWorksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => { 
             if (rowNumber > 1 && rowCount < 5) { 
               const rowData: Record<string, any> = {};
               columnHeaders.forEach((header, index) => {
                 const cell = row.getCell(index + 1); 
                 rowData[header] = formatPreviewValue(cell?.value);
               });
               previewData.push(rowData);
               rowCount++;
             }
           });
         } else {
           // Se ci sono più fogli, mostra un messaggio e attendi la selezione dell'utente
           toast.info(`Il file contiene ${worksheetNames.length} fogli. Seleziona un foglio per continuare.`);
           setStep(1.5); // Usa uno step intermedio per la selezione del foglio
           return;
         }

      } else if (fileExtension === 'csv') {
         console.log("Rilevato file .csv, uso PapaParse");
         // Usa PapaParse per CSV
         await new Promise<void>((resolve, reject) => {
            Papa.parse(selectedFile, {
                header: true,       // Tratta la prima riga come intestazione
                skipEmptyLines: true,
                preview: 6,         // Leggi solo le prime righe per header e anteprima (1 header + 5 dati)
                complete: (results) => {
                    console.log("PapaParse results (preview):", results);
                    if (results.errors.length > 0) {
                        console.error('Errori PapaParse (preview):', results.errors);
                        toast.error("Errore durante la lettura delle prime righe del CSV.");
                        // Non bloccare tutto, ma segnala errore
                    }
                    if (results.meta.fields) {
                         columnHeaders = results.meta.fields.map(h => h.trim()).filter(h => h); // Pulisci e filtra headers
                    } else {
                         toast.warning("Nessuna intestazione trovata nel file CSV.");
                         // Permetti comunque di procedere, magari l'utente mappa manualmente
                    }
                    // Prendi i dati per l'anteprima (escludendo potenzialmente l'header se incluso nei dati)
                    previewData = results.data.slice(0, 5).map(row => { 
                         const formattedRow: Record<string, string> = {};
                         // Usa Object.keys invece di for...in
                         Object.keys(row as any).forEach(key => { 
                             formattedRow[key] = formatPreviewValue((row as any)[key]);
                         });
                         return formattedRow;
                     });
                    resolve();
                },
                error: (error) => {
                    console.error("Errore PapaParse (preview):", error);
                    toast.error(`Errore PapaParse: ${error.message}`);
                    reject(error);
                }
            });
         });

      } else {
         toast.error("Formato file non supportato. Usa .xlsx o .csv");
         setFile(null);
         return;
      }
      
      console.log("Intestazioni lette:", columnHeaders);
      if (columnHeaders.length === 0 && fileExtension !== 'csv') { // CSV warning è già gestito
         toast.warning("Nessuna intestazione trovata nella prima riga del file.");
      }
      setHeaders(columnHeaders);
      console.log("Anteprima generata:", previewData);
      setPreview(previewData);
      setValidationErrors([]);
      setStep(2);

    } catch (error: any) {
      toast.error(`Errore nella lettura del file: ${error.message || 'Errore sconosciuto'}`);
      console.error(`Errore lettura ${fileExtension}:`, error);
      setFile(null);
      setHeaders([]);
      setMappings({});
      setPreview([]);
    }
  };
  
  // Funzione per gestire la selezione del foglio di lavoro
  const handleWorksheetSelect = async () => {
    if (!file || !selectedWorksheet) return;
    
    try {
      console.log(`Lettura del foglio di lavoro: ${selectedWorksheet}`);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.getWorksheet(selectedWorksheet);
      
      if (!worksheet) {
        throw new Error(`Foglio di lavoro '${selectedWorksheet}' non trovato.`);
      }
      
      // Leggi le intestazioni
      const columnHeaders: string[] = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value?.toString()?.trim();
        if (value) columnHeaders.push(value);
      });
      
      // Leggi l'anteprima
      let previewData: any[] = [];
      let rowCount = 0;
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => { 
        if (rowNumber > 1 && rowCount < 5) { 
          const rowData: Record<string, any> = {};
          columnHeaders.forEach((header, index) => {
            const cell = row.getCell(index + 1); 
            rowData[header] = formatPreviewValue(cell?.value);
          });
          previewData.push(rowData);
          rowCount++;
        }
      });
      
      setHeaders(columnHeaders);
      setPreview(previewData);
      setValidationErrors([]);
      setStep(2);
      
    } catch (error: any) {
      toast.error(`Errore nella lettura del foglio di lavoro: ${error.message || 'Errore sconosciuto'}`);
      console.error(`Errore nella lettura del foglio:`, error);
    }
  };

  // Formatta valori per l'anteprima
  const formatPreviewValue = (value: any): string => {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  };

  // Valida la mappatura corrente
  const validateMapping = () => {
    const errors: string[] = [];
    
    // Verifica duplicati
    const usedFields = new Set<string>();
    Object.values(mappings).forEach(field => {
      if (field && field !== 'none' && usedFields.has(field)) {
        errors.push(`Il campo ${field} è mappato più volte`);
      }
      if (field && field !== 'none') {
        usedFields.add(field);
      }
    });
    
    // Se sono transazioni, valida le etichette se il metodo è 'label'
    if (entityType === 'transaction' && transactionFormattingMethod === 'label') {
      if (!incomeLabel.trim()) {
        errors.push('L\'etichetta per le entrate è obbligatoria');
      }
      if (!expenseLabel.trim()) {
        errors.push('L\'etichetta per le uscite è obbligatoria');
      }
      if (incomeLabel.trim().toLowerCase() === expenseLabel.trim().toLowerCase()) {
        errors.push('Le etichette per entrate e uscite devono essere diverse');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Salva la mappatura corrente
  const saveMapping = () => {
    if (!validateMapping()) {
      toast.error("Correggi gli errori nella mappatura prima di salvare.");
      return;
    }
    setSavedMappings({
      ...savedMappings,
      [entityType]: mappings
    });
    toast.success("Mappatura salvata con successo per il tipo: " + entityType);
  };

  // Aggiungi questo nuovo useEffect per caricare le proprietà
  useEffect(() => {
    // Carica la lista delle proprietà quando si seleziona il tipo "transaction"
    if (entityType === "transaction") {
      const loadProperties = async () => {
        try {
          const props = await api.properties.getAll();
          setProperties(props);
          
          // Crea una mappa nome → id per conversione rapida
          const nameToIdMap: { [name: string]: string } = {};
          props.forEach(p => {
            if (p.name) {
              // Normalizza il nome (lowercase) per match meno sensibile
              const normalizedName = p.name.toLowerCase().trim();
              nameToIdMap[normalizedName] = p.id;
              // Aggiungi anche una versione abbreviata (primi 10 caratteri)
              if (normalizedName.length > 10) {
                nameToIdMap[normalizedName.substring(0, 10)] = p.id;
              }
              // Gestisci anche nomi con spazi rimossi
              if (normalizedName.includes(' ')) {
                nameToIdMap[normalizedName.replace(/\s+/g, '')] = p.id;
              }
            }
            
            // Includi anche indirizzo come possibile identificativo
            if (p.address) {
              const normalizedAddress = p.address.toLowerCase().trim();
              nameToIdMap[normalizedAddress] = p.id;
              
              // Aggiungi anche con la città se disponibile per match più preciso
              if (p.city) {
                const addressWithCity = `${normalizedAddress}, ${p.city.toLowerCase().trim()}`;
                nameToIdMap[addressWithCity] = p.id;
              }
            }
          });
          
          console.log("Mappa di conversione proprietà creata:", nameToIdMap);
          setPropertyMap(nameToIdMap);
        } catch (error) {
          console.error("Errore nel caricamento delle proprietà:", error);
          toast.error("Impossibile caricare l'elenco delle proprietà");
        }
      };
      
      loadProperties();
    }
  }, [entityType]);

  // Normalizza i dati delle transazioni prima dell'importazione
  const normalizeTransactionData = (rawData: any[]): any[] => {
    const incomeLblLower = incomeLabel.trim().toLowerCase();
    const expenseLblLower = expenseLabel.trim().toLowerCase();

    console.log(`Normalizzazione di ${rawData.length} transazioni...`);
    
    return rawData.map((transaction, index) => {
      try {
        const normalizedTransaction: any = {}; // Crea un nuovo oggetto invece di usare spread
        
        // Imposta sempre una descrizione valida
        normalizedTransaction.description = transaction.description || `Transazione ${index+1}`;
        
        // Imposta sempre una categoria valida
        normalizedTransaction.category = transaction.category || "Altro";
        
        // GESTIONE DATA: Assicurati che la data sia nel formato corretto YYYY-MM-DD
        let formattedDate = null;
        if (transaction.date) {
          try {
            // Se è già una stringa in formato ISO, usala direttamente
            if (typeof transaction.date === 'string' && transaction.date.match(/^\d{4}-\d{2}-\d{2}/)) {
              formattedDate = transaction.date.split('T')[0]; // Prendi solo la parte della data
            } 
            // Se è una data JavaScript
            else if (transaction.date instanceof Date) {
              formattedDate = transaction.date.toISOString().split('T')[0];
            } 
            // Altrimenti prova a convertirla
            else {
              const dateObj = new Date(transaction.date);
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toISOString().split('T')[0];
              }
            }
          } catch (e) {
            console.warn(`Riga ${index + 2}: Errore nella conversione della data '${transaction.date}'.`);
          }
        }
        
        // Se non abbiamo una data valida, usiamo oggi
        if (!formattedDate) {
          formattedDate = new Date().toISOString().split('T')[0];
          console.warn(`Riga ${index + 2}: Data non valida o mancante. Utilizzata data corrente.`);
        }
        
        normalizedTransaction.date = formattedDate;
        
        // GESTIONE AMOUNT E TYPE
        if (transactionFormattingMethod === 'separate_columns') {
          // Gestione delle colonne separate per entrate e uscite
          let amount = 0;
          let type = 'expense'; // Default
          
          const incomeValue = transaction.income_column !== undefined ? transaction.income_column : null;
          const expenseValue = transaction.expense_column !== undefined ? transaction.expense_column : null;
          
          // Determina se è un'entrata o un'uscita e imposta l'importo
          if (incomeValue !== null && incomeValue !== undefined && incomeValue !== '') {
            // È un'entrata
            const amountString = typeof incomeValue === 'string' 
              ? incomeValue.replace(/,/g, '.').replace(/[^\d.-]/g, '')
              : String(incomeValue);
            const parsedAmount = parseFloat(amountString);
            
            if (!isNaN(parsedAmount)) {
              amount = Math.abs(parsedAmount);
              type = 'income';
            } else {
              console.warn(`Riga ${index + 2}: Valore entrata non numerico: '${incomeValue}'`);
            }
          } else if (expenseValue !== null && expenseValue !== undefined && expenseValue !== '') {
            // È un'uscita
            const amountString = typeof expenseValue === 'string'
              ? expenseValue.replace(/,/g, '.').replace(/[^\d.-]/g, '')
              : String(expenseValue);
            const parsedAmount = parseFloat(amountString);
            
            if (!isNaN(parsedAmount)) {
              amount = Math.abs(parsedAmount);
              type = 'expense';
            } else {
              console.warn(`Riga ${index + 2}: Valore uscita non numerico: '${expenseValue}'`);
            }
          } else {
            console.warn(`Riga ${index + 2}: Nessun valore trovato nelle colonne di entrata/uscita.`);
          }
          
          normalizedTransaction.amount = amount;
          normalizedTransaction.type = type;
        } else {
          // Gestione esistente per sign e label
          // Assicurati che amount sia un numero, prendi il valore assoluto
          let amount = 0;
          if (transaction.amount !== undefined && transaction.amount !== null && transaction.amount !== '') {
            const amountString = typeof transaction.amount === 'string'
              ? transaction.amount.replace(/,/g, '.').replace(/[^\d.-]/g, '')
              : String(transaction.amount);
            const parsedAmount = parseFloat(amountString);
            if (!isNaN(parsedAmount)) {
              amount = Math.abs(parsedAmount); // Usa sempre il valore assoluto
            } else {
              console.warn(`Riga ${index + 2}: Valore importo non numerico: '${transaction.amount}'`);
            }
          } else {
            console.warn(`Riga ${index + 2}: Importo mancante, utilizzo valore 0.`);
          }
          
          normalizedTransaction.amount = amount;

          // Determina il tipo (income/expense)
          let type = 'expense'; // Default
          
          if (transactionFormattingMethod === 'sign') {
            // Ottieni il valore originale per determinare il segno
            const originalAmountString = typeof transaction.amount === 'string'
              ? transaction.amount.replace(/,/g, '.').replace(/[^\d.-]/g, '')
              : String(transaction.amount);
            const originalParsedAmount = parseFloat(originalAmountString);
            if (!isNaN(originalParsedAmount) && originalParsedAmount < 0) {
              type = 'expense';
            } else {
              type = 'income'; // Positivo o zero è income
            }
          } else { // Metodo 'label'
            const typeString = (transaction.type?.toString() || '').trim().toLowerCase();
            if (typeString === incomeLblLower) {
              type = 'income';
            } else if (typeString === expenseLblLower) {
              type = 'expense';
            } else {
              console.warn(`Riga ${index + 2}: Etichetta tipo transazione '${transaction.type}' non riconosciuta, impostato default 'expense'.`);
            }
          }
          
          normalizedTransaction.type = type;
        }
        
        // GESTIONE PROPERTY_ID - Converte il nome della proprietà in ID
        let propertyId = null;
        
        // Controlla se abbiamo un property_id diretto
        if (transaction.property_id && typeof transaction.property_id === 'string') {
          // Se sembra un UUID, usalo direttamente
          if (transaction.property_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            propertyId = transaction.property_id;
            console.log(`Riga ${index + 2}: Trovato property_id in formato UUID: ${propertyId}`);
          } 
          // Altrimenti, prova a cercarlo nella mappa per nome
          else {
            const normalizedPropertyName = transaction.property_id.toLowerCase().trim();
            if (propertyMap[normalizedPropertyName]) {
              propertyId = propertyMap[normalizedPropertyName];
              console.log(`Riga ${index + 2}: Convertito nome proprietà "${transaction.property_id}" in ID: ${propertyId}`);
            } else {
              console.warn(`Riga ${index + 2}: Nome proprietà "${transaction.property_id}" non trovato nel sistema.`);
            }
          }
        }
        
        // Controlla se abbiamo un "property_name" o un campo alternativo
        if (!propertyId && transaction.property_name) {
          const normalizedPropertyName = transaction.property_name.toLowerCase().trim();
          if (propertyMap[normalizedPropertyName]) {
            propertyId = propertyMap[normalizedPropertyName];
            console.log(`Riga ${index + 2}: Convertito property_name "${transaction.property_name}" in ID: ${propertyId}`);
          }
        }
        
        // Se abbiamo trovato un ID valido, usalo
        normalizedTransaction.property_id = propertyId;
        
        // Gestisci correttamente gli ID - trasformali sempre in null se non validi
        normalizedTransaction.tenant_id = (transaction.tenant_id && 
                                         transaction.tenant_id !== "none" && 
                                         transaction.tenant_id !== "") ? 
                                         transaction.tenant_id : null;
        
        // Log di debug per ogni transazione normalizzata
        if (index === 0) {
          console.log("Prima transazione normalizzata:", normalizedTransaction);
        }
        
        return normalizedTransaction;
      } catch (error) {
        console.error(`Errore nella normalizzazione della transazione ${index+1}:`, error);
        // Restituisci una transazione minima valida in caso di errore
        return {
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          type: 'expense',
          description: `Transazione ${index+1} (errore normalizzazione)`,
          category: 'Altro',
          property_id: null,
          tenant_id: null
        };
      }
    });
  };

  // Importa i dati mappati
  const importData = async () => {
    if (!file || !validateMapping()) return;
    setIsImporting(true);
    setImportProgress(0);
    console.log(`[Import Step 4/5] Inizio importazione per tipo: ${entityType}`); 
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let dataToImport: any[] = [];

    try {
      // ---> LETTURA COMPLETA del file <---
      console.log(`[Import Step 4/5] Lettura completa del file ${fileExtension}...`);

      let allRows: any[] = [];

      if (fileExtension === 'xlsx') {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(await file.arrayBuffer());
          
          // Usa il foglio selezionato o il primo se non specificato
          const worksheetToUse = selectedWorksheet || workbook.worksheets[0].name;
          const worksheet = workbook.getWorksheet(worksheetToUse);
          
          if (!worksheet) throw new Error(`Foglio di lavoro Excel "${worksheetToUse}" non trovato.`);
          console.log(`[Import Step 4/5] File XLSX riletto. Foglio: ${worksheetToUse}, Righe: ${worksheet.rowCount}`);

          // Ottieni gli indici delle colonne Excel basati sugli headers letti
          const headerIndexMap: Record<string, number> = {};
          headers.forEach((header, index) => {
              headerIndexMap[header] = index + 1; 
          });

          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
              if (rowNumber > 1) { // Salta header
                  const rawRowData: Record<string, any> = {};
                  headers.forEach(header => {
                      const cellIndex = headerIndexMap[header];
                      if (cellIndex) {
                          rawRowData[header] = row.getCell(cellIndex)?.value ?? null;
                      } else {
                           rawRowData[header] = null; // Header non trovato?
                      }
                  });
                  allRows.push(rawRowData);
              }
          });
          console.log(`[Import Step 4/5] Righe lette da XLSX: ${allRows.length}`);

      } else if (fileExtension === 'csv') {
          console.log("[Import Step 4/5] Rilettura CSV con PapaParse...");
          // Usa PapaParse per leggere l'intero CSV
          await new Promise<void>((resolve, reject) => {
              Papa.parse(file, {
                  header: true, // Usa le intestazioni per creare oggetti
                  skipEmptyLines: true,
                  complete: (results) => {
                      console.log("PapaParse results (full):"); // Non loggare tutti i dati
                      if (results.errors.length > 0) {
                          console.error('Errori PapaParse (full):', results.errors);
                          toast.warning("Alcune righe del CSV potrebbero contenere errori.");
                          // Non blocchiamo, ma segnaliamo
                      }
                      allRows = results.data; // PapaParse restituisce già oggetti mappati header->valore
                      console.log(`[Import Step 4/5] Righe lette da CSV: ${allRows.length}`);
                      resolve();
                  },
                  error: (error) => {
                      console.error("Errore PapaParse (full):", error);
                      reject(new Error(`Errore durante la lettura completa del CSV: ${error.message}`));
                  }
              });
          });
      } else {
           throw new Error("Formato file non supportato per l'importazione.");
      }

      // ---> APPLICA MAPPATURA E TRASFORMAZIONE <---
      console.log("[Import Step 4/5] Applicazione mappatura e trasformazione...");

      const expectedSchema = entitySchemas[entityType];
      let processedRowCount = 0;
      let skippedRowCount = 0;

      allRows.forEach((rawRowData, index) => {
           processedRowCount++;
           const rowNumber = index + 2; // +2 perché index è 0-based e saltiamo header
           // console.log(`\n[Import Step 4/5] Processo Riga ${rowNumber}`); 
           // console.log(`[Import Step 4/5]   Dati Grezzi Riga ${rowNumber}:`, JSON.stringify(rawRowData)); 

           const mappedData: Record<string, any> = {};
           expectedSchema.forEach(systemField => {
               // Usa direttamente 'mappings' per trovare l'header del file corrispondente al campo di sistema
               const fileHeaderMapped = mappings[systemField]; // Es: mappings['name'] restituisce 'Nome Inquilino'
               if (fileHeaderMapped && rawRowData.hasOwnProperty(fileHeaderMapped)) {
                   // Prendi il valore dalla colonna corretta usando l'header del file
                   mappedData[systemField] = rawRowData[fileHeaderMapped];
               } else {
                   mappedData[systemField] = null; // Campo non mappato o colonna non trovata nei dati grezzi
               }
           });
           // console.log(`[Import Step 4/5]   Dati Mappati Riga ${rowNumber}:`, JSON.stringify(mappedData)); 

           const transformedRow: Record<string, any> = {};
           let isValidRow = true;

           expectedSchema.forEach(field => {
               try {
                   const transformedValue = transformValue(field, mappedData[field]);
                   transformedRow[field] = transformedValue;
                   
                   // --- VALIDAZIONE CAMPI OBBLIGATORI (RIMOSSA) ---
                   // if (entityType === 'property') {
                   //     const requiredPropertyFields = ["name", "address", "city", "postal_code", "type"];
                   //     if (requiredPropertyFields.includes(field) && 
                   //         (transformedValue === null || transformedValue === undefined || String(transformedValue).trim() === '')) {
                   //          isValidRow = false;
                   //          missingRequiredFields.push(field); 
                   //      }
                   // }
                   // TODO: Aggiungere validazioni simili per Tenant, Contract, Transaction se necessario
                   
               } catch (transformError: any) {
                   console.error(`[Import Step 4/5] Errore trasformazione campo '${field}' Riga ${rowNumber}:`, transformError.message, "Valore originale:", mappedData[field]);
                   isValidRow = false;
               }
           });
           // console.log(`[Import Step 4/5]   Dati Trasformati Riga ${rowNumber}:`, JSON.stringify(transformedRow), `Valida: ${isValidRow}`);

           if (isValidRow) {
               dataToImport.push(transformedRow);
           } else {
               skippedRowCount++;
               // Messaggio generico per righe scartate a causa di errori di trasformazione
               console.warn(`[Import Step 4/5] Riga ${rowNumber} scartata: errore durante la trasformazione dei dati.`);
               // let skipReason = "errore trasformazione/validazione";
               // if (missingRequiredFields.length > 0) {
               //     skipReason = `campo/i obbligatorio/i mancante/i: ${missingRequiredFields.join(', ')}`;
               // }
               // console.warn(`[Import Step 4/5] Riga ${rowNumber} scartata: ${skipReason}.`);
           }
       });
       console.log(`\n[Import Step 4/5] Righe totali processate: ${processedRowCount}, Righe valide: ${dataToImport.length}, Righe scartate: ${skippedRowCount}`);

      // Normalizzazione Transazioni (invariata)
      if (entityType === 'transaction') {
        console.log("[Import Step 4/5] Normalizzazione dati transazioni...");
        const normalizedTransactions = normalizeTransactionData(dataToImport);
        console.log("[Import Step 4/5] Dati transazioni normalizzati:", normalizedTransactions.length);
        dataToImport.splice(0, dataToImport.length, ...normalizedTransactions);
      }

      console.log(`[Import Step 4/5] Dati finali pronti per l'invio (${dataToImport.length} righe)`); 

      if (dataToImport.length === 0) {
        toast.warning("Nessun dato valido trovato da importare dopo la validazione. Controlla la mappatura e il contenuto del file.");
        setIsImporting(false);
        return; 
      }

      // ---> SALVA LO STATO INIZIALE <---
      localStorage.setItem(`import_state_${entityType}`, JSON.stringify({
        entityType,
        data: dataToImport,
        progress: 0,
        timestamp: Date.now()
      }));

      // ---> INVIO AL BACKEND A BLOCCHI <---
      console.log(`[Import Step 4/5] Invio ${dataToImport.length} righe a blocchi...`);
      
      // Assicurati che il tipo sia corretto (singolare)
      let importEntityType = entityType;
      // Se è transaction, assicurati che sia usato il singolare
      if (importEntityType === "transaction" || importEntityType === "transactions") {
        importEntityType = "transaction"; // Forza al singolare
        console.log(`[Import Step 4/5] Normalizzato tipo entità a '${importEntityType}'`);
      }

      // Usa una dimensione di blocco ottimizzata
      const blockSize = importEntityType === 'transaction' ? 100 : 50;
      console.log(`[Import Step 4/5] Dimensione blocco impostata a ${blockSize} per ${importEntityType}`);

      // Mostra messaggio all'utente per importazioni grandi
      if (dataToImport.length > 500) {
        toast.info(`Importazione di ${dataToImport.length} record in corso... Potrebbero volerci alcuni minuti.`, {
          duration: 5000,
        });
      }

      const result = await api.import.dataInChunks(
        importEntityType, 
        dataToImport, 
        blockSize,
        (progress) => {
          setImportProgress(progress);
          // Aggiorna lo stato salvato con i dati rimanenti
          const remainingData = dataToImport.slice(Math.floor(dataToImport.length * progress / 100));
          localStorage.setItem(`import_state_${entityType}`, JSON.stringify({
            entityType,
            data: remainingData,
            progress,
            timestamp: Date.now()
          }));
        }
      );
      
      // Rimuovi lo stato salvato dopo un'importazione riuscita
      localStorage.removeItem(`import_state_${entityType}`);

      toast.success(`${result.importedCount} ${entityType}(s) importati con successo!`);
      setStep(5); // Vai allo step di completamento

    } catch (error: any) {
      console.error("[Import Step 4/5] Errore durante il processo di importazione:", error);
      toast.error(`Errore durante l'importazione: ${error.message || 'Errore sconosciuto'}`);
      
      // Lo stato di avanzamento è già stato salvato nei callback di progresso
      toast.info("Lo stato dell'importazione è stato salvato. Puoi riprendere in seguito.");
    } finally {
      setIsImporting(false); 
      console.log("[Import Step 4/5] Fine processo importazione.");
    }
  };

  // Trasforma i valori in base al tipo di campo (USATO SOLO PER TIPI DIVERSI DA TRANSACTION ORA)
  const transformValue = (field: string, value: any): any => {
    if (value === null || value === undefined) return null;
    
    // Gestisci correttamente gli oggetti Date
    if (value instanceof Date) {
      // Per campi di tipo data, lascia l'oggetto Date così com'è o formatalo come ISO string
      if (['date', 'start_date', 'end_date', 'lease_start', 'lease_end'].includes(field)) {
        return value.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }
      // Per altri campi, converti in stringa
      return value.toISOString().split('T')[0];
    }
    
    // Trasformazioni specifiche per tipo di campo
    switch (field) {
      case 'date':
      case 'start_date':
      case 'end_date':
      case 'lease_start':
      case 'lease_end':
        // La conversione della data viene fatta in formatPreviewValue o gestita dalla libreria Excel
        // Qui restituiamo solo il valore, potenzialmente già stringa
        return value.toString();
        
      // Nota: La gestione di amount/rent ecc. viene fatta ora in normalizeTransactionData
      // case 'amount':
      // case 'rent_amount': ...

      case 'status':
        return value.toString().toLowerCase();
        
      case 'property_id':
      case 'tenant_id':
        // Assicurati che sia una stringa o null
        return value ? value.toString() : null;
        
      default:
        return value.toString();
    }
  };

  // Funzione per tornare indietro di uno step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setValidationErrors([]); // Pulisci errori quando torni indietro
    }
  };

  // Funzione per iniziare una nuova importazione
  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setEntityType("property");
    setHeaders([]);
    setMappings({});
    setPreview([]);
    setValidationErrors([]);
    setTransactionFormattingMethod('sign');
    setIncomeLabel('Entrate');
    setExpenseLabel('Uscite');
    setIsImporting(false);
    // Non resettare savedMappings
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Importazione Dati da Excel/CSV</h1>

      {/* Indicatore di Step */}
      <div className="flex justify-between mb-4 text-sm text-muted-foreground">
        <span className={step >= 1 ? 'font-semibold text-primary' : ''}><FileUp className="inline-block h-4 w-4 mr-1" /> Seleziona File</span>
        <span className={step >= 2 ? 'font-semibold text-primary' : ''}><Map className="inline-block h-4 w-4 mr-1" /> Mappa Colonne</span>
        <span className={step >= 3 ? 'font-semibold text-primary' : ''}><CheckCircle2 className="inline-block h-4 w-4 mr-1" /> Completato</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 ? 'Step 1: Seleziona File e Tipo Entità' : 
             step === 1.5 ? 'Step 1.5: Seleziona Foglio di Lavoro' :
             step === 2 ? 'Step 2: Mappa Colonne' : 
             'Step 3: Risultato Importazione'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Selezione File */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="entityType">1. Tipo di entità da importare</Label>
                <Select value={entityType} onValueChange={(value: EntityType) => setEntityType(value)}>
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property">Proprietà</SelectItem>
                    <SelectItem value="tenant">Inquilini</SelectItem>
                    <SelectItem value="contract">Contratti</SelectItem>
                    <SelectItem value="transaction">Transazioni</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Scegli il tipo di dati che vuoi importare.</p>
              </div>

              <div>
                <Label htmlFor="fileInput">2. Seleziona il file Excel (.xlsx) o CSV (.csv)</Label>
                <Input 
                  id="fileInput" 
                  type="file" 
                  // Tentativo con solo MIME types principali
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv" 
                  onChange={handleFileChange} 
                 />
                <p className="text-xs text-muted-foreground mt-1">La prima riga del file deve contenere le intestazioni delle colonne.</p>
                {/* Aggiunta nota per l'utente mobile */}
                <p className="text-xs text-blue-600 mt-1 md:hidden"> 
                  (Se vedi "Fotocamera" o simili, cerca l'opzione "File" o "Sfoglia" per trovare il tuo documento.)
                </p>
              </div>

              {/* Nello step 1, aggiungo la notifica di importazione in sospeso */}
              {step === 1 && savedImportState && (
                <Alert className="mb-4 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Importazione in sospeso</AlertTitle>
                  <AlertDescription>
                    Hai un'importazione di {savedImportState.data?.length || 0} record {entityType} in sospeso (progresso: {savedImportState.progress || 0}%).
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={resumeImport} disabled={isResuming}>
                        {isResuming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Riprendendo...
                          </>
                        ) : "Riprendi importazione"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2" 
                        onClick={() => {
                          localStorage.removeItem(`import_state_${entityType}`);
                          setSavedImportState(null);
                        }}
                      >
                        Annulla
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Step 1.5: Selezione Foglio di Lavoro */}
          {step === 1.5 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="worksheetSelect">Seleziona il foglio di lavoro</Label>
                <Select value={selectedWorksheet} onValueChange={setSelectedWorksheet}>
                  <SelectTrigger id="worksheetSelect">
                    <SelectValue placeholder="Seleziona foglio" />
                  </SelectTrigger>
                  <SelectContent>
                    {worksheets.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Il file Excel contiene più fogli di lavoro. Seleziona quello da importare.</p>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Indietro</Button>
                <Button onClick={handleWorksheetSelect} disabled={!selectedWorksheet}>
                  Continua
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Mappatura Colonne */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Anteprima dei Dati (prime 5 righe)</h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((row, index) => (
                        <TableRow key={index}>
                          {headers.map(header => <TableCell key={header}>{row[header] ?? ''}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Mappa le colonne del tuo file ai campi richiesti</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Associa ogni campo richiesto per "{entityType}" a una colonna del tuo file. Seleziona "Ignora" se una colonna non deve essere importata.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entitySchemas[entityType]
                    .filter(field => {
                      // Nascondi il campo amount quando si usano label o colonne separate
                      if (entityType === 'transaction' && field === 'amount' && 
                          (transactionFormattingMethod === 'label' || transactionFormattingMethod === 'separate_columns')) {
                        return false;
                      }
                      // Nascondi i campi income_column e expense_column quando non si usa separate_columns
                      if (entityType === 'transaction' && 
                          (field === 'income_column' || field === 'expense_column') && 
                          transactionFormattingMethod !== 'separate_columns') {
                        return false;
                      }
                      return true;
                    })
                    .map(field => (
                    <div key={field}>
                      <Label htmlFor={`map-${field}`}>
                        {t(`import.fields.${field}`, { defaultValue: field.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) })}
                      </Label>
                      <Select value={mappings[field] || 'none'} onValueChange={(value) => setMappings({...mappings, [field]: value === 'none' ? '' : value })}>
                        <SelectTrigger id={`map-${field}`}>
                          <SelectValue placeholder={t("import.selectColumn")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("import.ignoreField")}</SelectItem>
                          {headers.map(header => (
                            <SelectItem key={header} value={header}>{header}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                {/* Pulsante Salva Mappatura */}
                <Button variant="outline" size="sm" onClick={saveMapping} className="mt-4">
                  Salva questa mappatura per "{entityType}"
                </Button>
              </div>

              {/* Sezione Condizionale per Formattazione Transazioni */}
              {entityType === 'transaction' && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2 flex items-center"><Settings className="h-4 w-4 mr-2"/> Formattazione Entrate/Uscite</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Indica come sono rappresentate le entrate e le uscite nel tuo file.
                  </p>
                  <RadioGroup value={transactionFormattingMethod} onValueChange={(value: TransactionFormattingMethod) => setTransactionFormattingMethod(value)} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sign" id="r-sign" />
                      <Label htmlFor="r-sign">Usa segno positivo/negativo nella colonna "Importo"</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="label" id="r-label" />
                      <Label htmlFor="r-label">Usa etichette di testo nella colonna "Tipo"</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="separate_columns" id="r-columns" />
                      <Label htmlFor="r-columns">Usa colonne separate per entrate e uscite</Label>
                    </div>
                  </RadioGroup>

                  {/* Input per etichette personalizzate */}
                  {transactionFormattingMethod === 'label' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-6">
                      <div>
                        <Label htmlFor="incomeLabel">Etichetta per Entrate</Label>
                        <Input
                          id="incomeLabel"
                          value={incomeLabel}
                          onChange={(e) => setIncomeLabel(e.target.value)}
                          placeholder="Es: Entrate, Incasso, E, income"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expenseLabel">Etichetta per Uscite</Label>
                        <Input
                          id="expenseLabel"
                          value={expenseLabel}
                          onChange={(e) => setExpenseLabel(e.target.value)}
                          placeholder="Es: Uscite, Spesa, U, expense"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Input per mappatura colonne separate */}
                  {transactionFormattingMethod === 'separate_columns' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pl-6">
                      <div>
                        <Label htmlFor="map-income_column">Colonna Entrate</Label>
                        <Select 
                          value={mappings['income_column'] || 'none'} 
                          onValueChange={(value) => setMappings({...mappings, ['income_column']: value === 'none' ? '' : value })}>
                          <SelectTrigger id="map-income_column">
                            <SelectValue placeholder="Seleziona colonna entrate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ignora questo campo</SelectItem>
                            {headers.map(header => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="map-expense_column">Colonna Uscite</Label>
                        <Select 
                          value={mappings['expense_column'] || 'none'} 
                          onValueChange={(value) => setMappings({...mappings, ['expense_column']: value === 'none' ? '' : value })}>
                          <SelectTrigger id="map-expense_column">
                            <SelectValue placeholder="Seleziona colonna uscite" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ignora questo campo</SelectItem>
                            {headers.map(header => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messaggi di errore validazione */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Errori nella mappatura</AlertTitle>
                  <AlertDescription>
                    <ul>
                      {validationErrors.map((err, i) => <li key={i}>- {err}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Pulsanti Step 2 */}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={goBack}>Indietro</Button>
                <Button onClick={importData} disabled={isImporting}>
                  {isImporting ? "Importazione in corso..." : <>Importa Dati <Send className="ml-2 h-4 w-4"/></>}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Completato */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Importazione Completata</h2>
              <p className="text-muted-foreground">
                I tuoi dati sono stati importati. Alcuni record potrebbero essere stati saltati se contenevano errori o permessi insufficienti (controlla i messaggi precedenti).
              </p>
              <Button onClick={resetWizard}>Importa un altro file</Button>
            </div>
          )}

          {/* Step 4: Importing (handled by importData) */}
          {/* Step 5: Completion - Modificato */}
           {step === 5 && (
               <CardContent className="text-center py-10"> {/* Aggiunto padding per estetica */}
                    <p className="text-xl font-semibold">Importazione completata</p>
                    {/* Rimosso: Icona CheckCircle2 */}
                    {/* Rimosso: Titolo h3 "Importazione Completata!" */}
                    {/* Rimosso: Descrizione p "I tuoi dati sono stati importati..." */}
                    {/* Rimosso: Pulsante "Importa un altro file" */}
               </CardContent>
           )}

           {/* Nello step 4, modifico il pulsante di importazione per mostrare il progresso */}
           {step === 4 && (
             <div className="space-y-4">
               {/* ... existing code ... */}
               
               {isImporting && (
                 <div className="space-y-2 mt-4">
                   <div className="flex justify-between text-sm text-gray-500">
                     <span>Importazione in corso...</span>
                     <span>{importProgress}%</span>
                   </div>
                   <Progress value={importProgress} className="h-2" />
                   <p className="text-xs text-muted-foreground mt-1">
                     Non chiudere questa finestra o spegnere lo schermo del dispositivo. Se l'importazione si interrompe,
                     potrai riprenderla in seguito.
                   </p>
                 </div>
               )}
               
               <div className="flex justify-end space-x-2 mt-6">
                 <Button type="button" variant="outline" onClick={goBack} disabled={isImporting}>
                   Indietro
                 </Button>
                 <Button 
                   type="button" 
                   onClick={importData} 
                   disabled={isImporting || !validateMapping()}
                 >
                   {isImporting ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Importazione in corso ({importProgress}%)
                     </>
                   ) : (
                     <>
                       <Send className="mr-2 h-4 w-4" />
                       Importa dati
                     </>
                   )}
                 </Button>
               </div>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
} 