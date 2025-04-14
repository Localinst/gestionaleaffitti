import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, Euro, Users } from 'lucide-react';
import { Booking } from '@/types/tourism';
import { Property } from '@/services/api';
import { tourismApi } from '@/services/tourism-api';

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const bookingSchema = z.object({
  property_id: z.string().min(1, { message: 'La proprietà è obbligatoria' }),
  guest_name: z.string().min(2, { message: 'Il nome dell\'ospite è obbligatorio' }),
  guest_email: z.string().email({ message: 'Email non valida' }).optional().or(z.literal('')),
  guest_phone: z.string().optional(),
  check_in_date: z.string().min(1, { message: 'La data di check-in è obbligatoria' }),
  check_out_date: z.string().min(1, { message: 'La data di check-out è obbligatoria' }),
  num_guests: z.number().min(1, { message: 'Il numero di ospiti deve essere almeno 1' }),
  total_price: z.number().min(0, { message: 'Il prezzo totale non può essere negativo' }),
  deposit_amount: z.number().min(0, { message: 'Il deposito non può essere negativo' }).optional(),
  status: z.string().min(1, { message: 'Lo stato è obbligatorio' }),
  booking_source: z.string().optional(),
  booking_reference: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  booking?: Booking;
  properties: Property[];
  onSubmit: (data: BookingFormValues) => void;
  onCancel: () => void;
}

export function BookingForm({ booking, properties, onSubmit, onCancel }: BookingFormProps) {
  const [loadingRates, setLoadingRates] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [numberOfNights, setNumberOfNights] = useState(0);

  // Inizializza il form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: booking ? {
      ...booking,
      check_in_date: booking.check_in_date ? 
        typeof booking.check_in_date === 'string' ? 
          booking.check_in_date.split('T')[0] : 
          format(new Date(booking.check_in_date), 'yyyy-MM-dd') : 
        '',
      check_out_date: booking.check_out_date ? 
        typeof booking.check_out_date === 'string' ? 
          booking.check_out_date.split('T')[0] : 
          format(new Date(booking.check_out_date), 'yyyy-MM-dd') : 
        '',
      num_guests: booking.num_guests || 1,
      total_price: booking.total_price || 0,
      deposit_amount: booking.deposit_amount || 0,
      status: booking.status || 'pending',
      booking_source: booking.booking_source || 'direct',
    } : {
      property_id: '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in_date: '',
      check_out_date: '',
      num_guests: 1,
      total_price: 0,
      deposit_amount: 0,
      status: 'pending',
      booking_source: 'direct',
      booking_reference: '',
      notes: '',
    }
  });

  const { watch, setValue, getValues } = form;
  
  // Osserva i cambiamenti delle date e della proprietà per calcolare il prezzo suggerito
  const propertyId = watch('property_id');
  const checkInDate = watch('check_in_date');
  const checkOutDate = watch('check_out_date');
  const numGuests = watch('num_guests');

  // Calcola il numero di notti quando cambiano le date
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const startDate = new Date(checkInDate);
      const endDate = new Date(checkOutDate);
      const nights = differenceInDays(endDate, startDate);
      
      if (nights > 0) {
        setNumberOfNights(nights);
      }
    } else {
      setNumberOfNights(0);
    }
  }, [checkInDate, checkOutDate]);

  // Calcola prezzo suggerito basato su tariffe stagionali
  useEffect(() => {
    const calculateSuggestedPrice = async () => {
      if (!propertyId || !checkInDate || !checkOutDate || numberOfNights <= 0) {
        setSuggestedPrice(null);
        return;
      }

      setLoadingRates(true);
      try {
        // Carica le tariffe stagionali per il periodo selezionato
        const data = await tourismApi.bookings.getAvailability(
          propertyId,
          checkInDate,
          checkOutDate
        );

        if (data.rates && data.rates.length > 0) {
          // Simulazione calcolo prezzo (in produzione, questo dovrebbe essere fatto lato server)
          // Usiamo la prima tariffa trovata per semplicità
          const rate = data.rates[0];
          let basePrice = rate.daily_rate * numberOfNights;
          
          // Applica sconti per soggiorni lunghi
          if (numberOfNights >= 7 && rate.weekly_discount_percent) {
            basePrice = basePrice * (1 - rate.weekly_discount_percent / 100);
          } else if (numberOfNights >= 30 && rate.monthly_discount_percent) {
            basePrice = basePrice * (1 - rate.monthly_discount_percent / 100);
          }
          
          setSuggestedPrice(Math.round(basePrice));
          
          // Suggerisci anche un deposito (ad esempio 20% del totale)
          const depositAmount = Math.round(basePrice * 0.2);
          setValue('deposit_amount', depositAmount);
        } else {
          setSuggestedPrice(null);
        }
      } catch (error) {
        console.error('Errore nel calcolo del prezzo:', error);
        toast.error('Impossibile calcolare il prezzo suggerito');
        setSuggestedPrice(null);
      } finally {
        setLoadingRates(false);
      }
    };

    calculateSuggestedPrice();
  }, [propertyId, checkInDate, checkOutDate, numberOfNights, setValue]);

  // Funzione di submit del form
  const handleSubmit = (values: BookingFormValues) => {
    onSubmit(values);
  };

  // Usa il prezzo suggerito
  const applySuggestedPrice = () => {
    if (suggestedPrice !== null) {
      setValue('total_price', suggestedPrice);
    }
  };

  const getSelectedPropertyCapacity = () => {
    if (!propertyId) return 0;
    const property = properties.find(p => p.id.toString() === propertyId);
    // Assumiamo che max_guests sia una proprietà delle strutture turistiche
    return property?.max_guests || 0;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonna sinistra */}
          <div className="space-y-6">
            {/* Selezione Proprietà */}
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Proprietà*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? properties.find(
                                (property) => property.id.toString() === field.value
                              )?.name
                            : "Seleziona una proprietà"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput
                          placeholder="Cerca proprietà..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>Nessuna proprietà trovata.</CommandEmpty>
                          <CommandGroup>
                            {properties
                              .filter(property => property.is_tourism)
                              .map((property) => (
                                <CommandItem
                                  key={property.id}
                                  value={property.name}
                                  onSelect={() => {
                                    setValue("property_id", property.id.toString());
                                  }}
                                >
                                  {property.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informazioni sull'ospite */}
            <FormField
              control={form.control}
              name="guest_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome dell'ospite*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo dell'ospite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="guest_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email dell'ospite" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guest_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="Numero di telefono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date di check-in e check-out */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="check_in_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in*</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input
                          type="date"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="check_out_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out*</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Numero di ospiti */}
            <FormField
              control={form.control}
              name="num_guests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero di ospiti*</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input
                        type="number"
                        min={1}
                        max={getSelectedPropertyCapacity()}
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            field.onChange(value);
                          }
                        }}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center ml-2">
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Capacità massima: {getSelectedPropertyCapacity() || 'N/A'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Colonna destra */}
          <div className="space-y-6">
            {/* Dettagli prezzo */}
            <div className="flex flex-col space-y-4">
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Soggiorno:</span>
                    <span className="font-semibold">{numberOfNights} notti</span>
                  </div>
                  
                  {suggestedPrice !== null && (
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium">Prezzo suggerito:</span>
                      <div className="flex items-center">
                        <span className="font-semibold">€{suggestedPrice.toFixed(2)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={applySuggestedPrice}
                          className="ml-2 h-6 px-2 text-xs"
                        >
                          Usa
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="total_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prezzo totale*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                field.onChange(value);
                              } else {
                                field.onChange(0);
                              }
                            }}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Euro className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
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
                      <FormLabel>Deposito</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                field.onChange(value);
                              } else {
                                field.onChange(0);
                              }
                            }}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Euro className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Stato e fonte prenotazione */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona lo stato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">In attesa</SelectItem>
                        <SelectItem value="confirmed">Confermata</SelectItem>
                        <SelectItem value="completed">Completata</SelectItem>
                        <SelectItem value="cancelled">Cancellata</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="booking_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte prenotazione</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona fonte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="direct">Diretta</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="booking">Booking.com</SelectItem>
                        <SelectItem value="expedia">Expedia</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Riferimento prenotazione esterna */}
            <FormField
              control={form.control}
              name="booking_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Riferimento prenotazione</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice di riferimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Inserisci eventuali note sulla prenotazione"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Pulsanti di azione */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit">
            {booking ? 'Aggiorna Prenotazione' : 'Crea Prenotazione'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 