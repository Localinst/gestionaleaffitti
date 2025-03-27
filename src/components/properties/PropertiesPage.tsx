import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Home, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getProperties } from "@/services/api";
import { Property } from "@/services/api";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddPropertyForm } from "./AddPropertyForm";
import { Badge } from "@/components/ui/badge";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddForm, setOpenAddForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const data = await getProperties();
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("Errore nel caricamento delle proprietà", {
          description: "Non è stato possibile recuperare le proprietà. Riprova più tardi."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [openAddForm]);

  return (
    <div className="container mx-auto p-4">
      <DashboardHeader
        heading="Le Tue Proprietà"
        text="Gestisci il tuo portfolio immobiliare"
        icon={<Home className="h-6 w-6" />}
      >
        <Button onClick={() => setOpenAddForm(true)} size="sm" className="h-9">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Proprietà
        </Button>
      </DashboardHeader>

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
          <Button onClick={() => setOpenAddForm(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Proprietà
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button variant="outline" size="sm">
                  Dettagli
                </Button>
                <Button variant="default" size="sm">
                  Gestisci
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AddPropertyForm open={openAddForm} onOpenChange={setOpenAddForm} />
    </div>
  );
}
