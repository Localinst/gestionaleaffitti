import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { createTransaction, getProperties, getTenantsByProperty, Transaction, updateTransaction } from "@/services/api";
import { useTranslation } from "react-i18next";

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
import { Textarea } from "@/components/ui/textarea";

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
  const { t } = useTranslation();
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
        
        if (Array.isArray(data) && data.length > 0) {
          setProperties(data);
          
          // Prepara le opzioni per le unità immobiliari
          const options: UnitOption[] = [];
          
          data.forEach(property => {
            // Se la proprietà ha più di 1 unità e unit_names è definito
            if (property.units > 1 && property.unit_names && Array.isArray(property.unit_names)) {
              // Aggiungi ogni unità come opzione separata
              property.unit_names.forEach((unitName, index) => {
                options.push({
                  id: `${property.id}-${index}`,
                  propertyId: property.id,
                  unitIndex: index.toString(),
                  name: unitName,
                  displayName: `${property.name} - ${unitName}`
                });
              });
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
          toast.warning(t("transactions.form.noProperties"), {
            description: t("transactions.form.addPropertyFirst")
          });
        }
      } catch (error) {
        console.error("Errore durante il caricamento delle proprietà:", error);
        toast.error(t("errors.network"));
      }
    }
    loadProperties();
  }, [t]);

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
        toast.success(t("transactions.form.updateSuccess"), {
          description: `${data.type === 'income' ? t("transactions.types.income") : t("transactions.types.expense")} ${t("common.status.success")}`,
        });
      } else {
        // Crea una nuova transazione
        await createTransaction(transactionData);
        toast.success(t("transactions.form.createSuccess"), {
          description: `${data.type === 'income' ? t("transactions.types.income") : t("transactions.types.expense")} ${t("common.status.success")}`,
        });
      }
      
      form.reset();
      onOpenChange(false);
      navigate("/transactions");
    } catch (apiError: any) {
      console.error("Errore API:", apiError);
      const errorMessage = apiError.message || t("errors.general");
      toast.error(isEditMode ? t("transactions.form.updateError") : t("transactions.form.createError"), {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("transactions.menu.edit") : t("transactions.addTransaction")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? t("transactions.form.updateTransaction") 
              : t("transactions.form.addTransactionDesc")}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contracts.form.unit")}</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={(value) => {
                      field.onChange(value);
                      loadTenants(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("transactions.form.selectUnit")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.displayName}
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
                  <FormLabel>{t("transactions.transactionDetails.tenant")}</FormLabel>
                  <Select 
                    value={field.value || "none"} 
                    onValueChange={field.onChange}
                    disabled={!propertyId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("transactions.form.selectTenant")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t("transactions.form.noTenant")}</SelectItem>
                      {tenants
                        .filter(tenant => tenant.property_id === propertyId)
                        .map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id?.toString()}>
                            {tenant.name}
                          </SelectItem>
                        ))
                      }
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
                    <FormLabel>{t("transactions.transactionDetails.date")}</FormLabel>
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
                    <FormLabel>{t("transactions.transactionDetails.amount")} (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        placeholder={t("transactions.form.enterAmount")} 
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
                    <FormLabel>{t("transactions.transactionDetails.type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("transactions.form.selectType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">{t("transactions.types.income")}</SelectItem>
                        <SelectItem value="expense">{t("transactions.types.expense")}</SelectItem>
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
                    <FormLabel>{t("transactions.transactionDetails.category")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("transactions.form.selectCategory")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch("type") === "income" ? (
                          <>
                            <SelectItem value="Rent">{t("transactions.categories.income.rent")}</SelectItem>
                            <SelectItem value="Deposit">{t("transactions.categories.income.deposit")}</SelectItem>
                            <SelectItem value="Late Payment">{t("transactions.categories.income.latePayment")}</SelectItem>
                            <SelectItem value="Other">{t("transactions.categories.income.other")}</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Maintenance">{t("transactions.categories.expense.maintenance")}</SelectItem>
                            <SelectItem value="Utilities">{t("transactions.categories.expense.utilities")}</SelectItem>
                            <SelectItem value="Tax">{t("transactions.categories.expense.tax")}</SelectItem>
                            <SelectItem value="Insurance">{t("transactions.categories.expense.insurance")}</SelectItem>
                            <SelectItem value="Mortgage">{t("transactions.categories.expense.mortgage")}</SelectItem>
                            <SelectItem value="Other">{t("transactions.categories.expense.other")}</SelectItem>
                          </>
                        )}
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
                  <FormLabel>{t("transactions.transactionDetails.description")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("transactions.form.enterDescription")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                {t("transactions.form.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.status.processing") : t("transactions.form.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
