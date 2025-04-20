import { useState } from "react";
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

// Tipi di entità che possono essere importate
type EntityType = "property" | "tenant" | "contract" | "transaction";

// Schema di mappatura per ogni tipo di entità
const entitySchemas: Record<EntityType, string[]> = {
  property: ["name", "address", "city", "postal_code", "type", "rooms", "bathrooms", "area", "price"],
  tenant: ["name", "email", "phone", "fiscal_code", "address", "city", "postal_code", "property_id"],
  contract: ["property_id", "tenant_id", "start_date", "end_date", "rent_amount", "deposit_amount", "status"],
  transaction: ["date", "amount", "type", "category", "description", "property_id", "tenant_id"]
};

// Tipo per il metodo di formattazione delle transazioni
type TransactionFormattingMethod = 'sign' | 'label';

export function ExcelImportWizard() {
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
    setMappings(savedMappings[entityType] || {}); // Carica mappatura salvata se esiste

    try {
      let columnHeaders: string[] = [];
      let previewData: any[] = [];

      if (fileExtension === 'xlsx') {
         console.log("Rilevato file .xlsx, uso ExcelJS");
         const workbook = new ExcelJS.Workbook();
         await workbook.xlsx.load(await selectedFile.arrayBuffer());
         const worksheet = workbook.worksheets[0];
         if (!worksheet) throw new Error("Foglio di lavoro Excel non trovato.");

         // Leggi headers da ExcelJS
         const headerRow = worksheet.getRow(1);
         headerRow.eachCell({ includeEmpty: false }, (cell) => {
           const value = cell.value?.toString()?.trim();
           if (value) columnHeaders.push(value);
         });

         // Leggi anteprima da ExcelJS
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

  // Normalizza i dati delle transazioni prima dell'importazione
  const normalizeTransactionData = (rawData: any[]): any[] => {
    const incomeLblLower = incomeLabel.trim().toLowerCase();
    const expenseLblLower = expenseLabel.trim().toLowerCase();

    return rawData.map((transaction, index) => {
      const normalizedTransaction = { ...transaction }; // Crea una copia

      // Assicurati che amount sia un numero, prendi il valore assoluto
      let amount = 0;
      if (transaction.amount !== null && transaction.amount !== undefined) {
        const amountString = transaction.amount.toString().replace(/,/g, '.').replace(/[^0-9.-]/g, ''); // Sostituisci virgola con punto e rimuovi altri caratteri non numerici
        const parsedAmount = parseFloat(amountString);
        if (!isNaN(parsedAmount)) {
          amount = Math.abs(parsedAmount); // Usa sempre il valore assoluto
        }
      }
      normalizedTransaction.amount = amount;

      // Determina il tipo (income/expense)
      if (transactionFormattingMethod === 'sign') {
        const originalAmountString = transaction.amount?.toString() ?? '0';
        const originalParsedAmount = parseFloat(originalAmountString.replace(/,/g, '.').replace(/[^0-9.-]/g, ''));
        if (!isNaN(originalParsedAmount) && originalParsedAmount < 0) {
          normalizedTransaction.type = 'expense';
        } else {
          normalizedTransaction.type = 'income'; // Positivo o zero è income
        }
      } else { // Metodo 'label'
        const typeString = transaction.type?.toString().trim().toLowerCase() ?? '';
        if (typeString === incomeLblLower) {
          normalizedTransaction.type = 'income';
        } else if (typeString === expenseLblLower) {
          normalizedTransaction.type = 'expense';
        } else {
          // Se l'etichetta non corrisponde, cosa fare?
          console.warn(`Riga ${index + 2}: Etichetta tipo transazione non riconosciuta '${transaction.type}'. Impostata come 'expense' per default.`);
          normalizedTransaction.type = 'expense'; // Imposta un default o gestisci come errore
        }
      }

      // Assicura che altri campi potenzialmente mancanti siano null
      normalizedTransaction.category = normalizedTransaction.category || null;
      normalizedTransaction.description = normalizedTransaction.description || null;
      normalizedTransaction.property_id = normalizedTransaction.property_id || null;
      normalizedTransaction.tenant_id = normalizedTransaction.tenant_id || null;

      return normalizedTransaction;
    });
  };

  // Importa i dati mappati
  const importData = async () => {
    if (!file || !validateMapping()) return;
    setIsImporting(true);
    console.log(`[Import Step 4/5] Inizio importazione per tipo: ${entityType}`); 
    // ---> Log dello stato mappings all'inizio <--- 
    console.log("[Import Step 4/5] Mappings allo start di importData:", mappings);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let dataToImport: any[] = [];

    try {
      // ---> LETTURA COMPLETA del file <---
      console.log(`[Import Step 4/5] Lettura completa del file ${fileExtension}...`);

      let allRows: any[] = [];

      if (fileExtension === 'xlsx') {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(await file.arrayBuffer());
          const worksheet = workbook.worksheets[0];
          if (!worksheet) throw new Error("Foglio di lavoro Excel non trovato.");
          console.log(`[Import Step 4/5] File XLSX riletto. Righe: ${worksheet.rowCount}`);

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
        console.log("[Import Step 4/5] Dati transazioni normalizzati:", normalizedTransactions.length); // Log count
        dataToImport.splice(0, dataToImport.length, ...normalizedTransactions);
      }

      console.log(`[Import Step 4/5] Dati finali pronti per l'invio (${dataToImport.length} righe)`); 

      if (dataToImport.length === 0) {
        toast.warning("Nessun dato valido trovato da importare dopo la validazione. Controlla la mappatura e il contenuto del file.");
        setIsImporting(false);
        return; 
      }

      // ---> INVIO AL BACKEND <---
      console.log(`[Import Step 4/5] Invio ${dataToImport.length} righe a /import/${entityType}...`);
      await api.import.data(entityType, dataToImport);

      toast.success(`${dataToImport.length} ${entityType}(s) importati con successo! ${skippedRowCount > 0 ? `(${skippedRowCount} righe scartate)` : ''}`);
      setStep(5); // Vai allo step di completamento

    } catch (error: any) {
      console.error("[Import Step 4/5] Errore durante il processo di importazione:", error);
      toast.error(`Errore durante l'importazione: ${error.message || 'Errore sconosciuto'}`);
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
          <CardTitle>Step {step}: {step === 1 ? 'Seleziona File e Tipo Entità' : step === 2 ? 'Mappa Colonne' : 'Risultato Importazione'}</CardTitle>
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
                  {entitySchemas[entityType].map(field => (
                    <div key={field}>
                      <Label htmlFor={`map-${field}`}>{field.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</Label>
                      <Select value={mappings[field] || 'none'} onValueChange={(value) => setMappings({...mappings, [field]: value === 'none' ? '' : value })}>
                        <SelectTrigger id={`map-${field}`}>
                          <SelectValue placeholder="Seleziona colonna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ignora questo campo</SelectItem>
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
        </CardContent>
      </Card>
    </div>
  );
} 