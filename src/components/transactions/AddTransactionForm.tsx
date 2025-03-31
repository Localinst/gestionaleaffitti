import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { createTransaction, getProperties, getTenantsByProperty, Transaction, updateTransaction } from "@/services/api";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Interfaccia per le opzioni di unità
interface UnitOption {
  id: string;
  propertyId: number | string; 
  unitIndex: string;
  name: string;
  displayName: string;
}

// Estendo l'interfaccia Transaction per includere unit_index
type TransactionWithUnit = Omit<Transaction, 'id'> & {
  unit_index?: string;
};

const transactionFormSchema = z.object({
  unit_id: z.string().min(1, "Seleziona un'unità immobiliare"),
  tenant_id: z.string().optional(),
  date: z.string().min(1, "La data è obbligatoria"),
  amount: z.coerce.number().positive("L'importo deve essere positivo"),
  type: z.enum(["income", "expense"], {
    required_error: "Seleziona il tipo di transazione",
  }),
  category: z.string().min(1, "La categoria è obbligatoria"),
  description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const transactionCategories = {
  income: [
    "Affitto",
    "Deposito",
    "Altro reddito"
  ],
  expense: [
    "Manutenzione",
    "Luce",
    "Gas",
    "Acqua",
    "Assicurazione",
    "Tasse",
    "Mutuo",
    "Pulizie",
    "Lavanderia",
    "Noleggio",
    "Prodotti",
    "Altro"
  ]
};

export function AddTransactionForm({ 
  open, 
  onOpenChange,
  transaction
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  transaction?: any;
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [tenants, setTenants] = useState([]);
  const [selectedType, setSelectedType] = useState<"income" | "expense">("income");
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Determina se siamo in modalità modifica
  useEffect(() => {
    if (transaction) {
      setIsEditMode(true);
      setSelectedType(transaction.type || "income");
    } else {
      setIsEditMode(false);
      setSelectedType("income");
    }
  }, [transaction]);
  
  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();
        console.log("Proprietà caricate:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          setProperties(data);
          
          // Creiamo le opzioni per le unità
          const options: UnitOption[] = [];
          
          data.forEach(property => {
            // Se la proprietà ha più di 1 unità e unit_names è definito
            if (property.units > 1 && property.unit_names) {
              try {
                // Proviamo a parsificare i nomi delle unità
                const unitNames = Array.isArray(property.unit_names) 
                  ? property.unit_names 
                  : JSON.parse(property.unit_names as string);
                
                // Aggiungiamo un'opzione per ogni unità
                unitNames.forEach((unitName: string, index: number) => {
                  options.push({
                    id: `${property.id}-${index}`,
                    propertyId: property.id,
                    unitIndex: index.toString(),
                    name: unitName || `Unità ${index + 1}`,
                    displayName: `${property.name} - ${unitName || `Unità ${index + 1}`}`
                  });
                });
              } catch (e) {
                console.error("Errore nel parsing dei nomi delle unità:", e);
                
                // Fallback: creiamo unità numerate
                for (let i = 0; i < property.units; i++) {
                  options.push({
                    id: `${property.id}-${i}`,
                    propertyId: property.id,
                    unitIndex: i.toString(),
                    name: `Unità ${i + 1}`,
                    displayName: `${property.name} - Unità ${i + 1}`
                  });
                }
              }
            } else {
              // Se la proprietà ha solo 1 unità, aggiungiamo solo la proprietà
              options.push({
                id: `${property.id}-0`,
                propertyId: property.id,
                unitIndex: "0",
                name: property.name,
                displayName: property.name
              });
            }
          });
          
          setUnitOptions(options);
          
        } else {
          console.warn("Nessuna proprietà trovata o risposta non valida");
          toast.warning("Nessuna proprietà disponibile", {
            description: "Aggiungi prima una proprietà per poter registrare transazioni"
          });
        }
      } catch (error) {
        console.error("Errore durante il caricamento delle proprietà:", error);
        toast.error("Errore nel caricamento delle proprietà");
      }
    }
    loadProperties();
  }, []);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      unit_id: "",
      tenant_id: "none",
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      type: "income",
      category: "",
      description: "",
    },
  });
  
  // Aggiorna valori del form in modalità modifica
  useEffect(() => {
    if (transaction && open) {
      const unitId = `${transaction.propertyId || transaction.property_id}-${transaction.unit_index || '0'}`;
      
      form.reset({
        unit_id: unitId,
        tenant_id: transaction.tenantId || transaction.tenant_id || "none",
        date: new Date(transaction.date).toISOString().split('T')[0],
        amount: transaction.amount || 0,
        type: transaction.type || "income",
        category: transaction.category || "",
        description: transaction.description || "",
      });
      
      setSelectedType(transaction.type || "income");
      
      // Carica gli inquilini per la proprietà
      if (transaction.propertyId || transaction.property_id) {
        loadTenants(unitId);
      }
    }
  }, [transaction, open, form]);

  const loadTenants = async (unitId: string) => {
    if (!unitId || unitId === "") {
      console.log("UnitId vuoto o non definito, nessun inquilino da caricare");
      setTenants([]);
      return;
    }
  
    // Estrai l'ID della proprietà dalla stringa unit_id
    // Formato atteso: "property_id-unit_number" (es: "b51a8696-1234-5678-9abc-123456789abc-1")
    // Dobbiamo estrarre l'UUID completo della proprietà
    
    // Versione corretta: estrai l'UUID completo
    const propertyId = unitId.includes('-') 
      ? unitId.substring(0, unitId.lastIndexOf('-'))  // Prende tutto fino all'ultimo trattino
      : unitId;  // Se non c'è un trattino, usa l'intero valore
    
    console.log("Tentativo di caricamento inquilini per proprietà ID:", propertyId);
  
    try {
      console.log("Invio richiesta getTenantsByProperty con ID:", propertyId);
      const data = await getTenantsByProperty(propertyId);
      console.log("Inquilini caricati per la proprietà:", data);
      
      if (Array.isArray(data) && data.length > 0) {
        setTenants(data);
        console.log(`Caricati ${data.length} inquilini per la proprietà ${propertyId}`);
      } else {
        console.warn("Nessun inquilino trovato per questa proprietà");
        setTenants([]);
      }
    } catch (error) {
      console.error("Errore durante il caricamento degli inquilini:", error);
      toast.error("Errore nel caricamento degli inquilini", {
        description: "Si è verificato un errore durante il recupero degli inquilini"
      });
      setTenants([]);
    }
  };

  const onSubmit = async (data: z.infer<typeof transactionFormSchema>) => {
    // Estrai l'ID della proprietà e l'indice dell'unità dalla stringa unit_id
    const unitIdParts = data.unit_id.split('-');
    let propertyId: string | null = null;
    let unitIndex: string | null = null;
    
    // Verifica se unit_id è nel formato corretto
    if (unitIdParts.length >= 2) {
      // Formato: property_id-unit_index
      // Per gli UUID, dobbiamo prendere tutto fino all'ultimo trattino
      const lastDashIndex = data.unit_id.lastIndexOf('-');
      propertyId = data.unit_id.substring(0, lastDashIndex);
      unitIndex = data.unit_id.substring(lastDashIndex + 1) || "0";
      
      console.log("Formato con trattini multipli:", {
        unitId: data.unit_id,
        propertyId,
        unitIndex
      });
    } else {
      // Potrebbe essere solo l'ID della proprietà
      propertyId = data.unit_id;
      unitIndex = "0";
      
      console.log("Formato senza trattini:", {
        unitId: data.unit_id,
        propertyId,
        unitIndex
      });
    }
    
    // Validazione: property_id non può essere null o vuoto
    if (!propertyId) {
      toast.error("Errore nella creazione della transazione", {
        description: "È necessario selezionare una proprietà valida"
      });
      return;
    }
    
    // Trova l'opzione di unità corrispondente per ottenere il propertyId corretto
    const selectedUnit = unitOptions.find(unit => unit.id === data.unit_id);
    console.log("Unità selezionata:", selectedUnit);
    
    // Crea l'oggetto transazione
    const transactionData: TransactionWithUnit = {
      property_id: selectedUnit?.propertyId || propertyId,
      unit_index: unitIndex || "0",
      tenant_id: data.tenant_id && data.tenant_id !== "none" ? Number(data.tenant_id) : null,
      date: new Date(data.date),
      amount: data.amount,
      type: data.type,
      category: data.category,
      description: data.description || "",
    };
    
    // Log dei dati della transazione per debug
    console.log("Invio transazione:", transactionData);
    
    try {
      setIsSubmitting(true);
      
      if (isEditMode && transaction) {
        // Aggiorna una transazione esistente
        const updatedTransaction = await updateTransaction(transaction.id, transactionData);
        toast.success("Transazione aggiornata con successo", {
          description: `${data.type === 'income' ? 'Entrata' : 'Uscita'} di €${data.amount} aggiornata.`,
        });
      } else {
        // Crea una nuova transazione
        await createTransaction(transactionData);
        toast.success("Transazione aggiunta con successo", {
          description: `${data.type === 'income' ? 'Entrata' : 'Uscita'} di €${data.amount} registrata.`,
        });
      }
      
      form.reset();
      onOpenChange(false);
      navigate("/transactions");
    } catch (apiError: any) {
      console.error("Errore API:", apiError);
      const errorMessage = apiError.message || "Errore sconosciuto";
      toast.error(isEditMode ? "Errore durante l'aggiornamento della transazione" : "Errore durante l'aggiunta della transazione", {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {isEditMode ? "Modifica Transazione" : "Aggiungi Nuova Transazione"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? "Modifica i dettagli della transazione." : "Inserisci i dettagli per registrare una nuova transazione."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unità Immobiliare</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      loadTenants(value);
                    }}
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un'unità immobiliare" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inquilino (opzionale)</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un inquilino (opzionale)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessun inquilino</SelectItem>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importo (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        placeholder="es. 1000.00" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedType(value as "income" | "expense");
                        form.setValue("category", "");
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona il tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Entrata</SelectItem>
                        <SelectItem value="expense">Uscita</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona la categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionCategories[selectedType].map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione (opzionale)</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Affitto mese di Gennaio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (isEditMode ? "Salvataggio in corso..." : "Aggiunta in corso...") : (isEditMode ? "Salva Modifiche" : "Aggiungi Transazione")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
