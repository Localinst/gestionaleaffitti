import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProperty } from "@/services/api";

// Schema di validazione
const formSchema = z.object({
  name: z.string().min(3, { message: "Il nome deve avere almeno 3 caratteri" }),
  address: z.string().min(5, { message: "L'indirizzo deve avere almeno 5 caratteri" }),
  city: z.string().min(2, { message: "La città deve avere almeno 2 caratteri" }),
  type: z.string({
    required_error: "Seleziona il tipo di proprietà",
  }),
  units: z.coerce.number().min(1, { message: "Inserisci almeno 1 unità" }),
});

// Tipo per i valori del form
type PropertyFormValues = z.infer<typeof formSchema>;

// Props per il componente
interface AddPropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Componente principale
export function AddPropertyForm({ open, onOpenChange }: AddPropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Inizializza il form
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      type: "",
      units: 1,
    },
  });

  // Gestione dell'invio del form
  const onSubmit = async (data: PropertyFormValues) => {
    console.log("onSubmit chiamato con dati:", data);
    try {
      setIsSubmitting(true);
      
      const propertyData = {
        name: data.name,
        address: data.address,
        city: data.city,
        type: data.type,
        units: data.units,
        image_url: ""
      };
      
      await createProperty(propertyData);
      
      toast.success("Proprietà aggiunta con successo", {
        description: `${data.name} è stata aggiunta al tuo portfolio.`,
      });
      
      form.reset();
      onOpenChange(false);
      navigate("/properties");
    } catch (error) {
      console.error("Errore durante l'aggiunta della proprietà:", error);
      toast.error("Errore durante l'aggiunta della proprietà", {
        description: error instanceof Error 
          ? error.message 
          : "Si è verificato un errore. Riprova più tardi."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyTypes = ["Condominio", "Casa Singola", "Commerciale", "Plurifamiliare", "Appartamento"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Aggiungi Nuova Proprietà
          </DialogTitle>
          <DialogDescription>
            Inserisci i dettagli per aggiungere una nuova proprietà al tuo portfolio.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Proprietà</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Marina Towers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Via Roma 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Città</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Milano" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di Proprietà</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona il tipo di proprietà" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero di Unità</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="es. 24" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Aggiunta in corso..." : "Aggiungi Proprietà"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
