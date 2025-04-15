import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import ExcelJS from "exceljs";
import { api } from "@/services/api";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Map, Settings, Send } from "lucide-react";

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

  // Carica il file Excel/CSV e leggi le intestazioni
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const selectedFile = fileList[0];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    setFile(selectedFile);
    
    try {
      const workbook = new ExcelJS.Workbook();
      let worksheet: ExcelJS.Worksheet;

      // ---> LOGICA PER TIPO FILE <---
      if (fileExtension === 'xlsx') {
         console.log("Rilevato file .xlsx, uso xlsx.load()");
         await workbook.xlsx.load(await selectedFile.arrayBuffer());
         worksheet = workbook.worksheets[0];
      } else if (fileExtension === 'csv') {
         console.log("Rilevato file .csv, uso csv.read()");
         // Per CSV, leggiamo come testo e usiamo csv.read
         // Potrebbe essere necessario specificare opzioni di parsing (delimitatore, encoding) se diverse dallo standard
         worksheet = await workbook.csv.read(selectedFile.stream()); // Usiamo lo stream
      } else {
         toast.error("Formato file non supportato. Usa .xlsx o .csv");
         return;
      }
      // ---> FINE LOGICA PER TIPO FILE <---

      // Verifica se il worksheet è stato caricato
      if (!worksheet) {
        toast.error("Impossibile leggere il contenuto del file.");
        return;
      }

      const headerRow = worksheet.getRow(1);
      const columnHeaders: string[] = [];
      // La lettura degli header potrebbe variare leggermente tra xlsx e csv
      headerRow.eachCell({ includeEmpty: false }, (cell) => { // includeEmpty: false potrebbe aiutare
        const value = cell.value?.toString()?.trim();
        if (value) {
          columnHeaders.push(value);
        }
      });
      
      console.log("Intestazioni lette dal file:", columnHeaders);
      if (columnHeaders.length === 0) {
         toast.warning("Nessuna intestazione trovata nella prima riga del file. Assicurati che la prima riga contenga i nomi delle colonne.");
         // Non resettare tutto, ma magari non passare allo step 2?
         // return; 
      }
      setHeaders(columnHeaders);
      
      // Carica mappature salvate se esistono
      const savedMapping = savedMappings[entityType];
      setMappings(savedMapping || {}); // Resetta se non c'è mappatura salvata per il nuovo tipo
      
      // Genera anteprima dei dati (limitata per CSV potenzialmente grandi)
      const previewData: any[] = [];
      // Usiamo un ciclo sicuro che non si blocchi se worksheet.rowCount non è affidabile (CSV)
      let rowCount = 0;
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber > 1 && rowCount < 5) { // Salta header, max 5 righe preview
          const rowData: Record<string, any> = {};
          columnHeaders.forEach((header, index) => {
             // Per CSV l'indice potrebbe non essere +1, ma basato su header
             // Usiamo l'indice trovato in headers
             const cell = row.getCell(index + 1); // Tentativo, potrebbe variare per CSV
             const value = cell?.value; // Accedi in modo sicuro
            if (value !== null && value !== undefined) {
              rowData[header] = formatPreviewValue(value);
            }
          });
          previewData.push(rowData);
          rowCount++;
        }
      });
      console.log("Anteprima generata:", previewData);
      setPreview(previewData);
      setValidationErrors([]);
      setStep(2);

    } catch (error) {
      toast.error(`Errore nella lettura del file ${fileExtension?.toUpperCase()}`);
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
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      const workbook = new ExcelJS.Workbook();
      let worksheet: ExcelJS.Worksheet;

      // ---> LOGICA PER TIPO FILE <---
      if (fileExtension === 'xlsx') {
         await workbook.xlsx.load(await file.arrayBuffer());
         worksheet = workbook.worksheets[0];
      } else if (fileExtension === 'csv') {
         worksheet = await workbook.csv.read(file.stream());
      } else {
         toast.error("Formato file non supportato.");
         setIsImporting(false);
         return;
      }
      // ---> FINE LOGICA PER TIPO FILE <---

      if (!worksheet) {
        toast.error("Impossibile leggere il contenuto del file per l'importazione.");
        setIsImporting(false);
        return;
      }
      
      let rawData: any[] = []; 
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Salta intestazione
        
        const rowData: Record<string, any> = {};
        let hasValue = false; 
        headers.forEach((header, index) => {
          const mappedField = mappings[header] || 'none';
          if (mappedField && mappedField !== 'none') {
            const cell = row.getCell(index + 1); // Tentativo, potrebbe variare per CSV
            const value = cell?.value;
            rowData[mappedField] = value; 
            if (value !== null && value !== undefined && value.toString().trim() !== '') {
              hasValue = true;
            }
          }
        });

        if (hasValue) {
          rawData.push(rowData);
        }
      });

      console.log("Dati GREZZI letti dal file (prima di trasformazioni/normalizzazioni):", rawData);

      let dataToImport = rawData;

      // Normalizza i dati SE sono transazioni
      if (entityType === 'transaction') {
        console.log("Dati transazioni prima della normalizzazione:", rawData);
        dataToImport = normalizeTransactionData(rawData);
        console.log("Dati transazioni dopo la normalizzazione:", dataToImport);
      } else {
        // Per altri tipi di entità, applica la trasformazione originale
        dataToImport = rawData.map(row => {
          const transformedRow: Record<string, any> = {};
          for (const field in row) {
            transformedRow[field] = transformValue(field, row[field]);
          }
          return transformedRow;
        });
      }

      if (dataToImport.length === 0) {
        toast.info("Nessun dato valido da importare trovato nel file.");
        setIsImporting(false);
        return;
      }

      // Chiamata API per importare i dati
      try {
        console.log(`Importazione di ${dataToImport.length} record di tipo ${entityType}...`);
        const result = await api.import.data(entityType, dataToImport);
        toast.success("Importazione completata con successo!");
        setStep(3); // Vai allo step di successo/riepilogo
      } catch (importError: any) {
        // Gestisci l'errore ma considera l'importazione parzialmente riuscita
        console.error("Errore API durante l'importazione:", importError);
        let errorMessage = importError.message || "Errore sconosciuto durante l'importazione.";
        // Prova a estrarre dettagli dall'errore del backend, se presenti
        if (importError.response?.data?.details) {
          errorMessage += ` Dettagli: ${importError.response.data.details}`;
        } else if (importError.response?.data?.error) {
          errorMessage = importError.response.data.error;
        }

        if (importError.message && importError.message.includes('403')) {
          toast.warning("Importazione completata parzialmente. Alcuni record potrebbero non essere stati importati a causa di permessi insufficienti.", { duration: 10000 });
          setStep(3); // Passa comunque allo step successivo
        } else {
          toast.error(errorMessage, { duration: 10000 });
          // Non resettare per permettere all'utente di vedere l'errore e magari correggere
        }
      }
    } catch (error) {
      toast.error(`Errore durante la lettura del file ${fileExtension?.toUpperCase()} per l'importazione`);
      console.error(`Errore lettura ${fileExtension} per import:`, error);
    } finally {
       setIsImporting(false); 
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
                  accept=".xlsx, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv" 
                  onChange={handleFileChange} 
                 />
                <p className="text-xs text-muted-foreground mt-1">La prima riga del file deve contenere le intestazioni delle colonne.</p>
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
        </CardContent>
      </Card>
    </div>
  );
} 