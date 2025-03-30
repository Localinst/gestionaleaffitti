import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Contract, Property, Tenant, api } from "@/services/api";

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

// Schema di validazione per il form
const contractFormSchema = z.object({
  property_id: z.string().min(1, "Seleziona una proprietà"),
  tenant_id: z.string().min(1, "Seleziona un inquilino"),
  start_date: z.string().min(1, "La data di inizio è obbligatoria"),
  end_date: z.string().min(1, "La data di fine è obbligatoria"),
  rent_amount: z.coerce.number().positive("L'importo del canone deve essere positivo"),
  deposit_amount: z.coerce.number().positive("L'importo della cauzione deve essere positivo"),
  status: z.enum(["active", "expired", "terminated"], {
    required_error: "Seleziona lo stato del contratto",
  }),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

export function AddContractForm({ 
  open, 
  onOpenChange,
  onContractAdded
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onContractAdded?: () => void;
}) {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      property_id: "",
      tenant_id: "",
      start_date: "",
      end_date: "",
      rent_amount: 0,
      deposit_amount: 0,
      status: "active"
    },
  });

  // Carica le proprietà quando il form si apre
  useEffect(() => {
    if (open) {
      loadProperties();
    }
  }, [open]);

  // Carica gli inquilini quando viene selezionata una proprietà
  useEffect(() => {
    if (selectedProperty) {
      loadTenantsByProperty(selectedProperty);
    }
  }, [selectedProperty]);

  // Funzione per caricare tutte le proprietà
  const loadProperties = async () => {
    try {
      const data = await api.properties.getAll();
      setProperties(data);
    } catch (error) {
      console.error("Errore nel caricamento delle proprietà:", error);
      toast.error("Impossibile caricare le proprietà");
    }
  };

  // Funzione per caricare gli inquilini di una proprietà specifica
  const loadTenantsByProperty = async (propertyId: string) => {
    try {
      const data = await api.tenants.getByProperty(propertyId);
      setTenants(data);
    } catch (error) {
      console.error("Errore nel caricamento degli inquilini:", error);
      toast.error("Impossibile caricare gli inquilini");
    }
  };

  // Gestione del cambio della proprietà selezionata
  const handlePropertyChange = (value: string) => {
    setSelectedProperty(value);
    form.setValue("property_id", value);
    form.setValue("tenant_id", ""); // Resetta l'inquilino quando cambia la proprietà
  };

  // Funzione per aggiungere un nuovo contratto
  const onSubmit = async (data: ContractFormValues) => {
    setIsSubmitting(true);

    // Mantieni gli ID come stringhe UUID, non convertirli in numeri
    const contractData = {
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      start_date: data.start_date,
      end_date: data.end_date,
      rent_amount: data.rent_amount,
      deposit_amount: data.deposit_amount,
      status: data.status
    };

    try {
      // Utilizziamo la funzione createContract dell'API
      await api.contracts.create(contractData);
      
      toast.success("Contratto aggiunto con successo");
      onOpenChange(false);
      form.reset();
      if (onContractAdded) {
        onContractAdded();
      }
    } catch (error) {
      console.error("Errore durante l'aggiunta del contratto:", error);
      toast.error("Impossibile aggiungere il contratto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Aggiungi nuovo contratto</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli del nuovo contratto di locazione
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
                    onValueChange={(value) => handlePropertyChange(value)} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona una proprietà" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
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
                  <FormLabel>Inquilino</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!selectedProperty}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedProperty ? "Seleziona un inquilino" : "Prima seleziona una proprietà"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inizio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fine</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rent_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canone Mensile (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="es. 850"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deposit_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposito Cauzionale (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="es. 1700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stato del contratto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona lo stato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Attivo</SelectItem>
                      <SelectItem value="expired">Scaduto</SelectItem>
                      <SelectItem value="terminated">Terminato</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Aggiunta in corso..." : "Aggiungi Contratto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 