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

const tenantFormSchema = z.object({
  property_id: z.string().min(1, "Seleziona una proprietà"),
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Inserisci un'email valida"),
  phone: z.string().min(1, "Il numero di telefono è obbligatorio"),
  lease_start: z.string().min(1, "La data di inizio è obbligatoria"),
  lease_end: z.string().min(1, "La data di fine è obbligatoria"),
  rent: z.coerce.number().positive("L'importo dell'affitto deve essere positivo"),
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
  
  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties();
        setProperties(data);
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
      property_id: "",
      name: "",
      email: "",
      phone: "",
      lease_start: "",
      lease_end: "",
      rent: 0
    },
  });

  const onSubmit = async (data: TenantFormValues) => {
    try {
      setIsSubmitting(true);
      
      const tenantData: Omit<Tenant, 'id'> = {
        property_id: data.property_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        lease_start: data.lease_start,
        lease_end: data.lease_end,
        rent: data.rent,
        rent_amount: data.rent
      };

      // Salviamo l'inquilino normalmente
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
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proprietà</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value || ""}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lease_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Inizio Contratto</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lease_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fine Contratto</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo Affitto Mensile (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="es. 1000" 
                      {...field}
                    />
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
                {isSubmitting ? "Aggiunta in corso..." : "Aggiungi Inquilino"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
