import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { Contract, Property, Tenant, api } from "@/services/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/layout/AppLayout";
import { AddContractForm } from "./AddContractForm";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carica i dati in parallelo
      const [contractsData, propertiesData, tenantsData] = await Promise.all([
        api.contracts.getAll(),
        api.properties.getAll(),
        api.tenants.getAll()
      ]);
      
      setContracts(contractsData);
      setProperties(propertiesData);
      setTenants(tenantsData);
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
      toast.error("Impossibile caricare i dati");
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per ottenere il nome della proprietà
  const getPropertyName = (propertyId: string | number | null | undefined): string => {
    // Gestisci il caso in cui propertyId sia null o undefined
    if (!propertyId) {
      return "Nessuna"; 
    }
    // Procedi con la ricerca solo se propertyId è valido
    const property = properties.find(p => p.id.toString() === propertyId.toString());
    return property ? property.name : "ID Proprietà non trovato"; // Cambiato messaggio per chiarezza
  };

  // Funzione per ottenere il nome dell'inquilino
  const getTenantName = (tenantId: string | number | null | undefined): string => {
    // Gestisci il caso in cui tenantId sia null o undefined
    if (!tenantId) {
      return "Nessuno";
    }
    // Procedi con la ricerca solo se tenantId è valido
    const tenant = tenants.find(t => t.id.toString() === tenantId.toString());
    return tenant ? tenant.name : "ID Inquilino non trovato"; // Cambiato messaggio per chiarezza
  };

  const filteredContracts = contracts.filter(contract => {
    // Chiama le funzioni aggiornate che gestiscono i null
    const propertyName = getPropertyName(contract.property_id).toLowerCase();
    const tenantName = getTenantName(contract.tenant_id).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    // Cerca in vari campi dei contratti, inclusi i nomi
    return (
      contract.id.toString().includes(searchLower) ||
      propertyName.includes(searchLower) ||
      tenantName.includes(searchLower) ||
      contract.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Attivo';
      case 'expired':
        return 'Scaduto';
      case 'terminated':
        return 'Terminato';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'expired':
        return 'text-amber-600';
      case 'terminated':
        return 'text-red-600';
      default:
        return '';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contratti</h1>
            <p className="text-muted-foreground">
              Gestisci tutti i contratti di locazione
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuovo Contratto
          </Button>
        </div>

        <AddContractForm 
          open={showAddForm} 
          onOpenChange={setShowAddForm} 
          onContractAdded={loadData}
        />

        <Card>
          <CardHeader>
            <CardTitle>I tuoi contratti</CardTitle>
            <CardDescription>
              {contracts.length} contratti totali
            </CardDescription>
            <div className="flex items-center py-2">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca contratti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nessun contratto</h3>
                <p className="text-muted-foreground">
                  Non hai ancora aggiunto nessun contratto.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowAddForm(true)}
                >
                  Aggiungi il primo contratto
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Proprietà</TableHead>
                      <TableHead>Inquilino</TableHead>
                      <TableHead>Data Inizio</TableHead>
                      <TableHead>Data Fine</TableHead>
                      <TableHead>Canone Mensile</TableHead>
                      <TableHead>Cauzione</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>{contract.id}</TableCell>
                        <TableCell>{getPropertyName(contract.property_id)}</TableCell>
                        <TableCell>{getTenantName(contract.tenant_id)}</TableCell>
                        <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(contract.end_date).toLocaleDateString()}</TableCell>
                        <TableCell>€{contract.rent_amount.toLocaleString()}</TableCell>
                        <TableCell>€{contract.deposit_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={getStatusColor(contract.status)}>
                            {getStatusLabel(contract.status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 