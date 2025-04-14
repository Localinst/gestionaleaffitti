import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { PlusCircle, Search, Calendar, Filter, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Booking } from '@/types/tourism';
import { Property, api } from '@/services/api';
import { tourismApi } from '@/services/tourism-api';
import { AppLayout } from '@/components/layout/AppLayout';
import { BookingForm } from './BookingForm';
import { AvailabilityCalendar } from './AvailabilityCalendar';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  // Carica i dati delle proprietà e delle prenotazioni
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carica in parallelo proprietà e prenotazioni
      const [propertiesData, bookingsData] = await Promise.all([
        api.properties.getAll(),
        tourismApi.bookings.getAll()
      ]);
      
      // Filtra solo le proprietà di tipo turistico
      const tourismProperties = propertiesData.filter(p => p.is_tourism);
      
      setProperties(tourismProperties);
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      toast.error('Impossibile caricare i dati delle prenotazioni');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra le prenotazioni in base ai criteri selezionati
  useEffect(() => {
    let result = bookings;
    
    // Filtra per proprietà
    if (selectedProperty !== 'all') {
      result = result.filter(booking => booking.property_id === selectedProperty);
    }
    
    // Filtra per stato
    if (statusFilter !== 'all') {
      result = result.filter(booking => booking.status === statusFilter);
    }
    
    // Filtra per termine di ricerca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(booking => 
        booking.guest_name.toLowerCase().includes(search) ||
        (booking.guest_email && booking.guest_email.toLowerCase().includes(search)) ||
        (booking.guest_phone && booking.guest_phone.toLowerCase().includes(search)) ||
        (booking.booking_reference && booking.booking_reference.toLowerCase().includes(search))
      );
    }
    
    setFilteredBookings(result);
  }, [bookings, selectedProperty, statusFilter, searchTerm]);

  // Gestione del form di prenotazione
  const handleAddBooking = async (data: any) => {
    try {
      if (selectedBooking) {
        // Aggiornamento prenotazione esistente
        await tourismApi.bookings.update(selectedBooking.id, data);
        toast.success('Prenotazione aggiornata con successo');
      } else {
        // Creazione nuova prenotazione
        await tourismApi.bookings.create(data);
        toast.success('Prenotazione creata con successo');
      }
      
      // Chiudi il form e ricarica i dati
      setShowAddForm(false);
      setSelectedBooking(null);
      loadData();
    } catch (error) {
      console.error('Errore nella gestione della prenotazione:', error);
      toast.error('Si è verificato un errore. Riprova più tardi.');
    }
  };

  // Gestisci l'apertura del form di modifica
  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowAddForm(true);
  };

  // Gestisci l'eliminazione della prenotazione
  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
      try {
        await tourismApi.bookings.delete(id);
        toast.success('Prenotazione eliminata con successo');
        loadData();
      } catch (error) {
        console.error('Errore nell\'eliminazione della prenotazione:', error);
        toast.error('Impossibile eliminare la prenotazione');
      }
    }
  };

  // Ottieni il nome della proprietà
  const getPropertyName = (propertyId: string): string => {
    const property = properties.find(p => p.id.toString() === propertyId.toString());
    return property ? property.name : 'Proprietà sconosciuta';
  };

  // Formatta lo stato della prenotazione con un badge colorato
  const renderStatus = (status: string) => {
    const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: 'In attesa', variant: 'outline' },
      confirmed: { label: 'Confermata', variant: 'default' },
      completed: { label: 'Completata', variant: 'secondary' },
      cancelled: { label: 'Cancellata', variant: 'destructive' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Contenuto quando non ci sono prenotazioni
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Calendar className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium mb-2">Nessuna prenotazione trovata</h3>
      <p className="text-sm text-gray-500 mb-4">
        Non ci sono prenotazioni che corrispondono ai criteri di ricerca.
      </p>
      <Button onClick={() => {
        setSelectedBooking(null);
        setShowAddForm(true);
      }}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Aggiungi Prenotazione
      </Button>
    </div>
  );

  // Contenuto durante il caricamento
  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2">Caricamento prenotazioni...</span>
    </div>
  );

  return (
    <AppLayout>
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Prenotazioni Turistiche</h1>
            <p className="text-gray-500">Gestisci le prenotazioni delle tue strutture turistiche</p>
          </div>
          <Button onClick={() => {
            setSelectedBooking(null);
            setShowAddForm(true);
          }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuova Prenotazione
          </Button>
        </div>

        <Tabs
          defaultValue="list"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="list">Lista Prenotazioni</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Filtri */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Cerca per nome, email, telefono..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select
                    value={selectedProperty}
                    onValueChange={setSelectedProperty}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tutte le proprietà" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le proprietà</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tutti gli stati" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="pending">In attesa</SelectItem>
                      <SelectItem value="confirmed">Confermate</SelectItem>
                      <SelectItem value="completed">Completate</SelectItem>
                      <SelectItem value="cancelled">Cancellate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabella prenotazioni */}
            {isLoading ? (
              renderLoading()
            ) : filteredBookings.length === 0 ? (
              renderEmptyState()
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ospite</TableHead>
                        <TableHead>Proprietà</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Totale</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="font-medium">{booking.guest_name}</div>
                            {booking.guest_email && (
                              <div className="text-sm text-gray-500">{booking.guest_email}</div>
                            )}
                          </TableCell>
                          <TableCell>{getPropertyName(booking.property_id)}</TableCell>
                          <TableCell>
                            {booking.check_in_date && format(
                              typeof booking.check_in_date === 'string' ?
                                parseISO(booking.check_in_date) : booking.check_in_date,
                              'dd MMM yyyy',
                              { locale: it }
                            )}
                          </TableCell>
                          <TableCell>
                            {booking.check_out_date && format(
                              typeof booking.check_out_date === 'string' ?
                                parseISO(booking.check_out_date) : booking.check_out_date,
                              'dd MMM yyyy',
                              { locale: it }
                            )}
                          </TableCell>
                          <TableCell>€{Number(booking.total_price).toFixed(2)}</TableCell>
                          <TableCell>{renderStatus(booking.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  ...
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                                  Modifica
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  className="text-red-600"
                                >
                                  Elimina
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Calendario Disponibilità</CardTitle>
                    <CardDescription>Visualizza e gestisci la disponibilità delle tue proprietà</CardDescription>
                  </div>
                  
                  <Select
                    value={selectedProperty === 'all' ? '' : selectedProperty}
                    onValueChange={(value) => setSelectedProperty(value || 'all')}
                  >
                    <SelectTrigger className="w-[230px]">
                      <SelectValue placeholder="Seleziona una proprietà" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedProperty !== 'all' ? (
                  <AvailabilityCalendar propertyId={selectedProperty} />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Seleziona una proprietà</h3>
                    <p className="text-sm text-gray-500">
                      Seleziona una proprietà per visualizzare il calendario delle disponibilità.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog per aggiungere/modificare prenotazione */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedBooking ? 'Modifica Prenotazione' : 'Nuova Prenotazione'}
              </DialogTitle>
              <DialogDescription>
                {selectedBooking 
                  ? 'Modifica i dettagli della prenotazione esistente' 
                  : 'Inserisci i dettagli per creare una nuova prenotazione'}
              </DialogDescription>
            </DialogHeader>
            
            <BookingForm
              booking={selectedBooking || undefined}
              properties={properties}
              onSubmit={handleAddBooking}
              onCancel={() => {
                setShowAddForm(false);
                setSelectedBooking(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 