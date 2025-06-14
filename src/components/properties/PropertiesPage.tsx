import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Home, Plus, Loader2, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [openAddForm, setOpenAddForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
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

  // Utilizzo di useMutation per l'eliminazione di tutte le proprietà
  const deleteAllMutation = useMutation({
    mutationFn: () => api.properties.deleteAll(),
    onSuccess: (data) => {
      // Invalida la query delle proprietà per forzare un aggiornamento dei dati
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`${data.count} proprietà eliminate con successo`);
      setDeleteAllDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error deleting all properties:", error);
      toast.error("Errore durante l'eliminazione di tutte le proprietà");
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

  const handleDeleteAll = () => {
    setDeleteAllDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProperty) return;
    deleteMutation.mutate(selectedProperty.id);
  };

  const confirmDeleteAll = async () => {
    deleteAllMutation.mutate();
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
      
      <div className="flex-1 pl-0 md:pl-0 md:pt-0 transition-all">
        <div className="container mx-auto p-4">
        <PageHeader
         title={t("properties.title")}
         description={t("properties.description")}
        />
          <div className="flex justify-between mb-6">
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
              {t("properties.addProperty")}
            </Button>
            
            {properties.length > 0 && (
              <Button 
                onClick={handleDeleteAll}
                variant="destructive" 
                size="sm" 
                className="h-9"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina tutte le proprietà
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-lg mt-4">
              <Home className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">{t("properties.noProperties")}</h3>
              <p className="mt-2 text-sm text-gray-500">
                Inizia aggiungendo la tua prima proprietà al portfolio.
              </p>
              <Button onClick={() => {
                setSelectedProperty(null);
                setOpenAddForm(true);
              }} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                {t("properties.addProperty")}
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

          {/* Dialog di conferma eliminazione proprietà singola */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sei sicuro di voler eliminare questa proprietà?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. La proprietà verrà eliminata permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Dialog di conferma eliminazione di tutte le proprietà */}
          <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Sei sicuro di voler eliminare TUTTE le proprietà?
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-4">
                  <p className="font-bold mb-2">ATTENZIONE: Questa è un'azione irreversibile!</p>
                  <p>Stai per eliminare tutte le {properties.length} proprietà presenti nel sistema.</p>
                  <p>Verranno cancellati anche tutti i dati collegati come contratti e transazioni.</p>
                  <p>Questa azione non può essere annullata.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteAll} 
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Elimina tutte le proprietà
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
