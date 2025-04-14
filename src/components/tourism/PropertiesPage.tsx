import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTutorial } from '@/hooks';
import { api } from '@/services/api';
import { Property } from '@/types/property';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PlusCircle, Search, Building2, ArrowRight, Calendar, Users, ExternalLink } from 'lucide-react';
import { AddPropertyForm } from '@/components/properties/AddPropertyForm';
import { PropertyDetailDialog } from '@/components/properties/PropertyDetailDialog';
import { Badge } from '@/components/ui/badge';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const navigate = useNavigate();

  // Aggiungo l'hook per il tutorial
  usePageTutorial();

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = properties.filter(property => 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(properties);
    }
  }, [searchTerm, properties]);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const data = await api.properties.getAll();
      
      // Filtra solo le proprietà di tipo turistico
      const tourismProperties = data.filter(p => p.is_tourism);
      
      setProperties(tourismProperties);
      setFilteredProperties(tourismProperties);
    } catch (error) {
      console.error('Errore nel caricamento delle proprietà:', error);
      toast.error('Impossibile caricare le proprietà');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProperty = () => {
    setShowAddForm(true);
  };

  const handlePropertyAdded = () => {
    loadProperties();
    setShowAddForm(false);
  };

  const handleViewDetails = (property: Property) => {
    navigate(`/tourism/property/${property.id}`);
  };

  return (
    <AppLayout>
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Proprietà Turistiche</h1>
            <p className="text-muted-foreground">Gestisci le tue proprietà per affitti turistici</p>
          </div>
          <Button onClick={handleAddProperty}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuova Proprietà
          </Button>
        </div>

        {/* Barra di ricerca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Cerca proprietà..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Elenco delle proprietà turistiche */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-semibold">Nessuna proprietà turistica trovata</h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm ? `Nessun risultato per "${searchTerm}"` : 'Inizia aggiungendo la tua prima proprietà turistica'}
                </p>
                {!searchTerm && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddProperty}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Aggiungi proprietà
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <Card key={property.id} className="overflow-hidden">
                    <div className="relative h-40 overflow-hidden">
                      {property.image_url ? (
                        <img
                          src={property.image_url}
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-muted-foreground opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
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
                          <span className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-1 h-4 w-4" /> 
                            Ospiti max:
                          </span>
                          <span>{property.max_guests || 'Non specificato'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="flex items-center text-sm text-muted-foreground">
                            <Building2 className="mr-1 h-4 w-4" /> 
                            Unità:
                          </span>
                          <span>{property.units}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/tourism/bookings?propertyId=${property.id}`)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Prenotazioni
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleViewDetails(property)}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Gestisci
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog per aggiungere una nuova proprietà */}
      <AddPropertyForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={handlePropertyAdded}
      />

      {/* Dialog per visualizzare i dettagli di una proprietà */}
      {selectedProperty && (
        <PropertyDetailDialog
          property={selectedProperty}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </AppLayout>
  );
} 