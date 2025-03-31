import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { createTenant, getProperties } from "@/services/api";
import type { Property, Tenant } from "@/services/api";

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
  propertyId: string;
  name: string;
  displayName: string;
  unitIndex: string;
}

const tenantFormSchema = z.object({
  unit_id: z.string().min(1, "Seleziona un'unità immobiliare"),
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Inserisci un'email valida").optional().or(z.literal("")),
  phone: z.string().min(1, "Il numero di telefono è obbligatorio").optional().or(z.literal("")),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

export function AddTenantForm({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  
  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();
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
                  id: `${property.id}::${index}`,
                  propertyId: property.id.toString(),
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
                  id: `${property.id}::${i}`,
                  propertyId: property.id.toString(),
                  unitIndex: i.toString(),
                  name: `Unità ${i + 1}`,
                  displayName: `${property.name} - Unità ${i + 1}`
                });
              }
            }
          } else {
            // Se la proprietà ha solo 1 unità, aggiungiamo solo la proprietà
            options.push({
              id: `${property.id}::0`,
              propertyId: property.id.toString(),
              unitIndex: "0",
              name: property.name,
              displayName: property.name
            });
          }
        });
        
        setUnitOptions(options);
      } catch (error) {
        console.error("Errore durante il caricamento delle proprietà:", error);
        toast.error("Errore nel caricamento delle proprietà");
      }
    }
    loadProperties();
  }, []);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      unit_id: "",
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (data: TenantFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Estraiamo l'ID della proprietà e il numero dell'unità usando il nuovo separatore ::
      const [propertyId, unitIndex] = data.unit_id.split('::');
      
      console.log("propertyId:", propertyId, "unitIndex:", unitIndex);
      
      const tenantData: Omit<Tenant, 'id'> = {
        property_id: propertyId,
        name: data.name,
        email: data.email || "",
        phone: data.phone || "",
        unit: unitIndex || "0",
        status: "active"
      };
      
      console.log("Dati inquilino da salvare:", tenantData);

      // Salviamo l'inquilino
      const tenant = await createTenant(tenantData);
      
      toast.success("Inquilino aggiunto con successo", {
        description: `${data.name} è stato aggiunto come inquilino.`,
      });
      
      form.reset();
      onOpenChange(false);
      
      // Reindirizza alla dashboard per vedere l'aggiornamento
      navigate("/dashboard");

    } catch (error) {
      console.error("Errore durante l'aggiunta dell'inquilino:", error);
      toast.error("Errore durante l'aggiunta dell'inquilino", {
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
            <Users className="h-5 w-5" />
            Aggiungi Nuovo Inquilino
          </DialogTitle>
          <DialogDescription>
            Inserisci i dettagli per aggiungere un nuovo inquilino.
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
                    onValueChange={(value) => field.onChange(value)}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="es. Mario Rossi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="es. mario.rossi@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input placeholder="es. +39 123 456 7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Aggiunta in corso..." : "Aggiungi Inquilino"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
