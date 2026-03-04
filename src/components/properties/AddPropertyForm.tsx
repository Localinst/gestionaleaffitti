import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createProperty, updateProperty } from "@/services/api";
import { Property } from "@/services/api";

// Schema di validazione
const formSchema = z.object({
  name: z.string().min(3, { message: "Il nome deve avere almeno 3 caratteri" }),
  address: z.string().min(5, { message: "L'indirizzo deve avere almeno 5 caratteri" }),
  city: z.string().min(2, { message: "La città deve avere almeno 2 caratteri" }),
  type: z.string({
    required_error: "Seleziona il tipo di proprietà",
  }),
  units: z.coerce.number().min(1, { message: "Inserisci almeno 1 unità" }),
  unitNames: z.array(z.string()).optional(),
  is_tourism: z.boolean().default(false),
  max_guests: z.coerce.number().min(0).optional(),
  tourismUnits: z.array(z.number()).optional(), // Indici delle unità in locazione turistica
});

// Tipo per i valori del form
type PropertyFormValues = z.infer<typeof formSchema>;

// Props per il componente
interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property; // Proprietà esistente da modificare (opzionale)
  onSuccess?: () => void; // Callback chiamato dopo successo
}

// Componente principale
export function AddPropertyForm({ open, onOpenChange, property, onSuccess }: PropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitCount, setUnitCount] = useState(property?.units || 1);
  const [isTourism, setIsTourism] = useState(property?.is_tourism || false);
  const [tourismUnits, setTourismUnits] = useState<number[]>(() => {
    if (!property?.tourism_units) return [];
    if (Array.isArray(property.tourism_units)) {
      return property.tourism_units;
    }
    try {
      const parsed = JSON.parse(property.tourism_units as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const queryClient = useQueryClient();
  const isEditing = !!property;

  // Inizializza il form
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: property?.name || "",
      address: property?.address || "",
      city: property?.city || "",
      type: property?.type || "",
      units: property?.units || 1,
      unitNames: getInitialUnitNames(property),
      is_tourism: property?.is_tourism || false,
      max_guests: property?.max_guests || 0,
      tourismUnits: tourismUnits,
    },
  });

  // Funzione per ottenere i nomi delle unità iniziali
  function getInitialUnitNames(property?: Property): string[] {
    if (!property) return Array(1).fill("");
    
    if (property.unit_names) {
      if (Array.isArray(property.unit_names)) {
        return property.unit_names;
      } else {
        try {
          const parsedNames = JSON.parse(property.unit_names as string);
          return Array.isArray(parsedNames) ? parsedNames : Array(property.units).fill("");
        } catch (e) {
          return Array(property.units).fill("");
        }
      }
    }
    
    return Array(property.units).fill("");
  }

  // Aggiorna il titolo in base alla modalità (aggiungi o modifica)
  const formTitle = isEditing ? "Modifica Proprietà" : "Aggiungi Nuova Proprietà";
  const formDescription = isEditing
    ? "Modifica i dettagli della proprietà selezionata"
    : "Inserisci i dettagli per aggiungere una nuova proprietà al tuo portfolio";
  const submitButtonText = isEditing ? "Salva Modifiche" : "Aggiungi Proprietà";

  // Monitora il cambio di unità per aggiornare il contatore e l'array dei nomi
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "units") {
        const units = Number(value.units) || 1;
        setUnitCount(units);
        
        // Aggiorna l'array dei nomi delle unità per corrispondere al nuovo numero di unità
        const currentNames = form.getValues("unitNames") || [];
        
        if (units > currentNames.length) {
          // Se abbiamo aumentato il numero di unità, aggiungiamo elementi vuoti all'array
          const newNames = [...currentNames, ...Array(units - currentNames.length).fill("")];
          form.setValue("unitNames", newNames);
        } else if (units < currentNames.length) {
          // Se abbiamo diminuito il numero di unità, riduciamo l'array
          const newNames = currentNames.slice(0, units);
          form.setValue("unitNames", newNames);
          
          // Rimuovi le unità che non esistono più da tourismUnits
          const updatedTourismUnits = tourismUnits.filter(idx => idx < units);
          setTourismUnits(updatedTourismUnits);
          form.setValue("tourismUnits", updatedTourismUnits);
        }
      } else if (name === "is_tourism") {
        setIsTourism(!!value.is_tourism);
        // Se disabiliti il turismo per tutta la proprietà, svuota tourismUnits
        if (!value.is_tourism) {
          setTourismUnits([]);
          form.setValue("tourismUnits", []);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, tourismUnits]);

  // Gestione dell'invio del form
  const onSubmit = async (data: PropertyFormValues) => {
    console.log("onSubmit chiamato con dati:", data);
    try {
      setIsSubmitting(true);
      
      // Assicuriamo che unitNames abbia la giusta lunghezza
      const unitNames = data.unitNames || [];
      if (unitNames.length > data.units) {
        // Tronchiamo l'array se necessario
        data.unitNames = unitNames.slice(0, data.units);
      } else if (unitNames.length < data.units) {
        // Aggiungiamo elementi vuoti se necessario
        data.unitNames = [...unitNames, ...Array(data.units - unitNames.length).fill("")];
      }
      
      // Se il turismo è disabilitato, svuota tourismUnits
      const finalTourismUnits = data.is_tourism ? (data.tourismUnits || []) : [];
      
      const propertyData = {
        name: data.name,
        address: data.address,
        city: data.city,
        type: data.type,
        units: data.units,
        unitNames: data.unitNames || [],
        image_url: property?.image_url || "",
        is_tourism: data.is_tourism,
        max_guests: data.is_tourism && finalTourismUnits.length > 0 ? data.max_guests : 0,
        tourismUnits: finalTourismUnits.length > 0 ? finalTourismUnits : [],
      };
      
      if (isEditing && property) {
        // Aggiorna una proprietà esistente
        await updateProperty(property.id, propertyData);
        toast.success("Proprietà aggiornata con successo", {
          description: `${data.name} è stata aggiornata correttamente.`,
        });
      } else {
        // Crea una nuova proprietà
        await createProperty(propertyData);
        toast.success("Proprietà aggiunta con successo", {
          description: `${data.name} è stata aggiunta al tuo portfolio.`,
        });
      }
      
      // Invalida la query per forzare il refresh e aspetta che si ricarichino
      await queryClient.invalidateQueries({ queryKey: ['properties', 'list'] });
      
      // Chiama il callback di successo se fornito
      if (onSuccess) {
        onSuccess();
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(`Errore durante ${isEditing ? 'l\'aggiornamento' : 'l\'aggiunta'} della proprietà:`, error);
      toast.error(`Errore durante ${isEditing ? 'l\'aggiornamento' : 'l\'aggiunta'} della proprietà`, {
        description: error instanceof Error 
          ? error.message 
          : "Si è verificato un errore. Riprova più tardi."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Genera campi per i nomi delle unità
  const renderUnitNameFields = () => {
    if (unitCount <= 1) return null;
    
    const fields = [];
    for (let i = 0; i < unitCount; i++) {
      fields.push(
        <FormItem key={i}>
          <FormLabel>Nome Unità {i + 1}</FormLabel>
          <FormControl>
            <Input 
              placeholder={`es. Appartamento ${i + 1}`} 
              {...form.register(`unitNames.${i}` as const)}
            />
          </FormControl>
        </FormItem>
      );
    }
    return (
      <div className="space-y-3 mt-3 p-3 border rounded-md">
        <h3 className="text-sm font-medium">Dettagli delle unità</h3>
        {fields}
      </div>
    );
  };

  // Genera checkbox per selezionare quali unità sono in locazione turistica
  const renderTourismUnitCheckboxes = () => {
    if (!isTourism || unitCount <= 1) return null;
    
    return (
      <div className="space-y-3 mt-4 p-3 border rounded-md bg-blue-50">
        <h3 className="text-sm font-medium">Quali unità mettere in locazione turistica?</h3>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: unitCount }).map((_, index) => {
            const unitName = form.getValues(`unitNames.${index}`) || `Unità ${index + 1}`;
            const isChecked = tourismUnits.includes(index);
            
            return (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`tourism-unit-${index}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    let newTourismUnits: number[];
                    if (checked) {
                      newTourismUnits = [...tourismUnits, index].sort((a, b) => a - b);
                    } else {
                      newTourismUnits = tourismUnits.filter(idx => idx !== index);
                    }
                    setTourismUnits(newTourismUnits);
                    form.setValue("tourismUnits", newTourismUnits);
                  }}
                />
                <label htmlFor={`tourism-unit-${index}`} className="text-sm cursor-pointer">
                  {unitName}
                </label>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Seleziona almeno una unità per attivare la locazione turistica
        </p>
      </div>
    );
  };

  const propertyTypes = ["Condominio", "Casa Singola", "Commerciale", "Plurifamiliare", "Appartamento"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {formTitle}
          </DialogTitle>
          <DialogDescription>
            {formDescription}
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
              
              {renderUnitNameFields()}
            </div>

            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="text-sm font-medium">Impostazioni locazione turistica</h3>
              
              <FormField
                control={form.control}
                name="is_tourism"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Proprietà per locazione turistica</FormLabel>
                      <FormDescription>
                        Seleziona questa opzione se la proprietà verrà utilizzata per affitti turistici
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isTourism && (
                <FormField
                  control={form.control}
                  name="max_guests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero massimo di ospiti</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="es. 4" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Inserisci il numero massimo di ospiti che possono essere alloggiati
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isTourism && renderTourismUnitCheckboxes()}
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
                {isSubmitting ? 
                  (isEditing ? "Salvataggio in corso..." : "Aggiunta in corso...") : 
                  submitButtonText
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
