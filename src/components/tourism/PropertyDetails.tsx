import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Property } from '@/types/property';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BookingForm } from './BookingForm';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import IntegrationSettings from './IntegrationSettings';
import { Home, Calendar, Palmtree, Settings, ListChecks, ArrowLeft, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function PropertyDetails() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Carica i dettagli della proprietà
  useEffect(() => {
    if (propertyId) {
      loadPropertyDetails();
    }
  }, [propertyId]);

  const loadPropertyDetails = async () => {
    try {
      setLoading(true);
      const data = await api.properties.getById(propertyId || '');
      
      // Verifica che sia una proprietà di tipo turistico
      if (!data.is_tourism) {
        toast.error('Questa non è una proprietà turistica');
        navigate('/tourism/properties');
        return;
      }
      
      setProperty(data);
    } catch (error) {
      console.error('Errore nel caricamento dei dettagli della proprietà:', error);
      toast.error('Impossibile caricare i dettagli della proprietà');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container p-4 mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="container p-4 mx-auto">
          <Button variant="outline" onClick={() => navigate('/tourism/properties')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle proprietà
          </Button>
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Proprietà non trovata</h2>
            <p className="text-muted-foreground">
              La proprietà richiesta non è stata trovata o non è accessibile.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container p-4 mx-auto">
        <div className="mb-4">
          <Button variant="outline" onClick={() => navigate('/tourism/properties')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle proprietà
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Immagine e info principali */}
          <div className="w-full lg:w-1/3">
            <Card>
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                {property.image_url ? (
                  <img 
                    src={property.image_url} 
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Home className="h-16 w-16 text-muted-foreground opacity-20" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  <Badge variant="secondary" className="mr-2">
                    {property.type}
                  </Badge>
                  <Badge>Turistica</Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle>{property.name}</CardTitle>
                <CardDescription>{property.address}, {property.city}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Proprietà:</span>
                    <span>{property.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ospiti max:</span>
                    <span>{property.max_guests || 'Non specificato'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unità:</span>
                    <span>{property.units}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valore:</span>
                    <span>€{(property.current_value || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creata il:</span>
                    <span>{property.created_at ? format(new Date(property.created_at), 'PPP', { locale: it }) : 'N/D'}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="font-medium mb-2">Descrizione</h3>
                  <p className="text-sm text-muted-foreground">
                    {property.description || 'Nessuna descrizione disponibile.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs principale */}
          <div className="w-full lg:w-2/3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="info">
                  <Home className="h-4 w-4 mr-2" />
                  Informazioni
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendario
                </TabsTrigger>
                <TabsTrigger value="integrations">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Integrazioni
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Impostazioni
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle>Dettagli proprietà</CardTitle>
                    <CardDescription>
                      Informazioni dettagliate sulla proprietà turistica
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Dettagli</h3>
                        <p className="text-sm">
                          Questa proprietà è configurata per accogliere fino a {property.max_guests || '?'} ospiti.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Statistiche</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="p-4">
                              <CardTitle className="text-base">Prenotazioni</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="text-2xl font-bold">0</div>
                              <p className="text-xs text-muted-foreground">Ultimi 30 giorni</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="p-4">
                              <CardTitle className="text-base">Occupazione</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="text-2xl font-bold">0%</div>
                              <p className="text-xs text-muted-foreground">Ultimo mese</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Azioni rapide</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setActiveTab('calendar')}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Gestisci calendario
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/tourism/bookings/new?propertyId=${property.id}`)}
                          >
                            <Palmtree className="h-4 w-4 mr-2" />
                            Nuova prenotazione
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setActiveTab('integrations')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Configura integrazioni
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendario disponibilità</CardTitle>
                    <CardDescription>
                      Visualizza e gestisci la disponibilità della proprietà
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AvailabilityCalendar propertyId={propertyId || ''} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations">
                <IntegrationSettings />
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Impostazioni</CardTitle>
                    <CardDescription>
                      Gestisci le impostazioni della proprietà
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        onClick={() => navigate(`/properties/edit/${property.id}`)}
                        variant="outline"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Modifica proprietà
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 