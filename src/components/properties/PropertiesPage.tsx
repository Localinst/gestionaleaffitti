import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Home, Plus, Loader2, Eye, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Property, api } from "@/services/api";
import { AddPropertyForm } from "./AddPropertyForm";
import { PropertyDetailDialog } from "./PropertyDetailDialog";
import { Badge } from "@/components/ui/badge";
import {AppLayout, PageHeader}  from "@/components/layout/AppLayout";

import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-query-hooks";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePageTutorial } from '@/hooks';

// Componente ActionButton
interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  showLabel?: boolean;
  className?: string;
  "aria-label"?: string;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  showLabel = true,
  className = "",
  "aria-label": ariaLabel,
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel || label}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span className="ml-2">{label}</span>}
    </Button>
  );
}

export default function PropertiesPage() {
  const [openAddForm, setOpenAddForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Utilizzo del hook personalizzato per caricare le proprietà
  const { data: properties = [], isLoading: loading, error } = useProperties();
  
  // Aggiungo l'hook per il tutorial
  usePageTutorial();
  
  // Utilizzo di useMutation per l'eliminazione delle proprietà
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.properties.delete(id),
    onSuccess: () => {
      // Invalida la query delle proprietà per forzare un aggiornamento dei dati
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success("Proprietà eliminata con successo");
      setDeleteDialogOpen(false);
      setSelectedProperty(null);
    },
    onError: (error) => {
      console.error("Error deleting property:", error);
      toast.error("Errore durante l'eliminazione della proprietà");
    }
  });

  const handleView = (property: Property) => {
    setSelectedProperty(property);
    setDetailDialogOpen(true);
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setOpenEditForm(true);
  };

  const handleDelete = (property: Property) => {
    setSelectedProperty(property);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProperty) return;
    deleteMutation.mutate(selectedProperty.id);
  };

  // Mostra un messaggio di errore se c'è stato un problema nel caricamento
  if (error) {
    toast.error("Errore nel caricamento delle proprietà", {
      description: "Non è stato possibile recuperare le proprietà. Riprova più tardi."
    });
  }

  return (
    <AppLayout>
    <div className="min-h-screen flex flex-col md:flex-row">
      
      <div className="flex-1 pl-0 md:pl-64 md:pt-0 transition-all">
        <div className="container mx-auto p-4">
        <PageHeader
         title="Le Tue Proprietà"
         description="Gestisci il tuo portfolio immobiliare"
        
        />
            <Button 
              onClick={() => {
                setSelectedProperty(null);
                setOpenAddForm(true);
              }} 
              size="sm" 
              className="h-9"
              data-tutorial="properties-add"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Proprietà
            </Button>
        

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-lg mt-4">
              <Home className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Nessuna proprietà trovata</h3>
              <p className="mt-2 text-sm text-gray-500">
                Inizia aggiungendo la tua prima proprietà al portfolio.
              </p>
              <Button onClick={() => {
                setSelectedProperty(null);
                setOpenAddForm(true);
              }} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Proprietà
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6" data-tutorial="properties-list">
              {properties.map((property) => (
                <Card key={property.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{property.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {property.address}, {property.city}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{property.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Unità:</span>
                        <span>{property.units}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                    <ActionButton 
                      icon={Eye} 
                      label="View" 
                      onClick={() => handleView(property)} 
                      variant="secondary"
                      showLabel={false}
                      className="rounded-full h-9 w-9 p-0 flex items-center justify-center"
                      aria-label="Visualizza dettagli proprietà"
                    />
                    <ActionButton 
                      icon={Edit} 
                      label="Edit" 
                      onClick={() => handleEdit(property)} 
                      variant="secondary"
                      showLabel={false}
                      className="rounded-full h-9 w-9 p-0 flex items-center justify-center"
                      aria-label="Modifica proprietà"
                    />
                    <ActionButton 
                      icon={Trash2} 
                      label="Delete" 
                      onClick={() => handleDelete(property)}
                      variant="secondary"
                      showLabel={false}
                      className="rounded-full h-9 w-9 p-0 flex items-center justify-center"
                      aria-label="Elimina proprietà"
                    />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Form per aggiungere proprietà */}
          <AddPropertyForm 
            open={openAddForm} 
            onOpenChange={setOpenAddForm} 
          />

          {/* Form per modificare proprietà */}
          {selectedProperty && (
            <AddPropertyForm 
              open={openEditForm} 
              onOpenChange={setOpenEditForm} 
              property={selectedProperty}
            />
          )}

          {/* Dialog di conferma eliminazione */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro di voler eliminare questa proprietà?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. Verranno eliminati tutti i dati associati a questa proprietà,
                  inclusi inquilini e transazioni.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDelete} 
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Dialog di dettaglio della proprietà */}
          {selectedProperty && (
            <PropertyDetailDialog
              property={selectedProperty}
              open={detailDialogOpen}
              onOpenChange={setDetailDialogOpen}
            />
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
