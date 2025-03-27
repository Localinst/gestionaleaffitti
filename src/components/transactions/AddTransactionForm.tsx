import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { createTransaction, getProperties, getTenantsByProperty } from "@/services/api";

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

const transactionFormSchema = z.object({
  property_id: z.string().min(1, "Seleziona una proprietà"),
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
    "Utenze",
    "Assicurazione",
    "Tasse",
    "Mutuo",
    "Altro"
  ]
};

export function AddTransactionForm({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedType, setSelectedType] = useState<"income" | "expense">("income");
  
  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();
        console.log("Proprietà caricate:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Non filtriamo più le proprietà, accettiamo tutte quelle restituite dall'API
          setProperties(data);
          
          // Log di debug per verificare le proprietà
          data.forEach((p, index) => {
            console.log(`Proprietà ${index+1}:`, p.name, "ID:", p.id, "Tipo ID:", typeof p.id);
          });
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
      property_id: "",
      tenant_id: "none",
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      type: "income",
      category: "",
      description: "",
    },
  });

  // Carica gli inquilini quando cambia la proprietà
  const loadTenants = async (propertyId: string) => {
    console.log("Tentativo di caricamento inquilini per proprietà ID:", propertyId, "tipo:", typeof propertyId);

    if (!propertyId || propertyId === "") {
      console.log("PropertyId vuoto o non definito, nessun inquilino da caricare");
      setTenants([]);
      return;
    }

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

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Log dei dati del form per debug
      console.log("Form data da inviare:", data);
      
      // Verifica se l'utente è autenticato
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast.error("Utente non autenticato", {
          description: "Effettua il login per aggiungere una transazione"
        });
        setIsSubmitting(false);
        return;
      }

      // Verifica che property_id sia un valore valido
      if (!data.property_id || data.property_id.trim() === "" || data.property_id === "invalid" || data.property_id === "nessuna") {
        toast.error("Proprietà non selezionata", {
          description: "Seleziona una proprietà valida prima di procedere"
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log("Proprietà ID selezionata:", data.property_id);
      
      // Cerca la proprietà nell'array delle proprietà
      const selectedProperty = properties.find(p => 
        p.id?.toString() === data.property_id
      );
      
      if (!selectedProperty) {
        toast.error("Proprietà non trovata", {
          description: "La proprietà selezionata non è nell'elenco"
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log("Proprietà trovata:", selectedProperty);
      
      // Crea un oggetto che corrisponde all'interfaccia Omit<Transaction, 'id'>
      const transactionData = {
        property_id: selectedProperty.id,
        tenant_id: data.tenant_id && data.tenant_id !== "none" ? data.tenant_id : null,
        date: new Date(data.date),
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description || "",
      };
      
      console.log("Invio transazione:", transactionData, "Token presente:", !!authToken);
      
      try {
        await createTransaction(transactionData);
        
        toast.success("Transazione aggiunta con successo", {
          description: `${data.type === 'income' ? 'Entrata' : 'Uscita'} di €${data.amount} registrata.`,
        });
        
        form.reset();
        onOpenChange(false);
        navigate("/transactions");
      } catch (apiError: any) {
        console.error("Errore API:", apiError);
        const errorMessage = apiError.message || "Errore sconosciuto";
        toast.error("Errore durante l'aggiunta della transazione", {
          description: errorMessage
        });
      }
    } catch (error) {
      console.error("Errore durante l'aggiunta della transazione:", error);
      toast.error("Errore durante l'aggiunta della transazione", {
        description: "Si è verificato un errore. Riprova più tardi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Aggiungi Nuova Transazione
          </DialogTitle>
          <DialogDescription>
            Inserisci i dettagli per registrare una nuova transazione.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proprietà</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      console.log("Proprietà selezionata, valore:", value);
                      field.onChange(value);
                      // Resetta l'inquilino quando cambia la proprietà
                      form.setValue("tenant_id", "none");
                      // Carica gli inquilini della proprietà selezionata
                      loadTenants(value);
                    }}
                    defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona una proprietà" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.length > 0 ? (
                        properties.map((property) => {
                          // Usa l'ID direttamente come stringa (UUID)
                          const idValue = property.id?.toString() || "invalid";
                          
                          return (
                            <SelectItem 
                              key={idValue}
                              value={idValue}
                            >
                              {property.name}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="nessuna" disabled>
                          Nessuna proprietà disponibile
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo di selezione inquilino */}
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inquilino (opzionale)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      console.log("Inquilino selezionato, valore:", value);
                      field.onChange(value);
                    }}
                    value={field.value || "none"}
                    disabled={!form.getValues("property_id") || tenants.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un inquilino" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessun inquilino</SelectItem>
                      {tenants.length > 0 ? (
                        tenants.map((tenant) => {
                          // Visualizza i valori dell'inquilino per debug
                          console.log("Rendering inquilino:", tenant.id, tenant.name);
                          const idValue = tenant.id?.toString();
                          
                          return (
                            <SelectItem 
                              key={idValue}
                              value={idValue}
                            >
                              {tenant.name || "Nome non disponibile"}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="nessuno" disabled>
                          {form.getValues("property_id") 
                            ? "Nessun inquilino per questa proprietà" 
                            : "Seleziona prima una proprietà"}
                        </SelectItem>
                      )}
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
                {isSubmitting ? "Aggiunta in corso..." : "Aggiungi Transazione"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
