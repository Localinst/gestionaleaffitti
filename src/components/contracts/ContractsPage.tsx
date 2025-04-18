import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { Contract, Property, Tenant, api } from "@/services/api";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/layout/AppLayout";
import { AddContractForm } from "./AddContractForm";

export default function ContractsPage() {
  const { t } = useTranslation();
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
      toast.error(t("contracts.errors.loadingData"));
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per ottenere il nome della proprietà
  const getPropertyName = (propertyId: string | number | null | undefined): string => {
    // Gestisci il caso in cui propertyId sia null o undefined
    if (!propertyId) {
      return t("contracts.noPropertyId"); 
    }
    // Procedi con la ricerca solo se propertyId è valido
    const property = properties.find(p => p.id.toString() === propertyId.toString());
    return property ? property.name : t("contracts.propertyIdNotFound");
  };

  // Funzione per ottenere il nome dell'inquilino
  const getTenantName = (tenantId: string | number | null | undefined): string => {
    // Gestisci il caso in cui tenantId sia null o undefined
    if (!tenantId) {
      return t("contracts.noTenantId");
    }
    // Procedi con la ricerca solo se tenantId è valido
    const tenant = tenants.find(t => t.id.toString() === tenantId.toString());
    return tenant ? tenant.name : t("contracts.tenantIdNotFound");
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
        return t("contracts.status.active");
      case 'expired':
        return t("contracts.status.expired");
      case 'terminated':
        return t("contracts.status.terminated");
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
            <h1 className="text-3xl font-bold tracking-tight">{t("contracts.title")}</h1>
            <p className="text-muted-foreground">
              {t("contracts.description")}
            </p>
          </div>
          <Button 
            variant="default" 
            className="flex items-center gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4" />
            <span>{t("contracts.newContract")}</span>
          </Button>
        </div>

        <AddContractForm 
          open={showAddForm} 
          onOpenChange={setShowAddForm} 
          onContractAdded={loadData}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t("contracts.yourContracts")}</CardTitle>
            <CardDescription>
              {t("contracts.totalContracts", { count: contracts.length })}
            </CardDescription>
            <div className="flex items-center py-2">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("contracts.searchContracts")}
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
                <h3 className="mt-4 text-lg font-semibold">{t("contracts.noContracts")}</h3>
                <p className="text-muted-foreground">
                  {t("contracts.noContractsYet")}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowAddForm(true)}
                >
                  {t("contracts.addFirstContract")}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("contracts.fields.id")}</TableHead>
                      <TableHead>{t("contracts.fields.property")}</TableHead>
                      <TableHead>{t("contracts.fields.tenant")}</TableHead>
                      <TableHead>{t("contracts.fields.startDate")}</TableHead>
                      <TableHead>{t("contracts.fields.endDate")}</TableHead>
                      <TableHead>{t("contracts.fields.rentAmount")}</TableHead>
                      <TableHead>{t("contracts.fields.deposit")}</TableHead>
                      <TableHead>{t("contracts.fields.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow key={contract.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {}}>
                        <TableCell className="font-medium">{contract.id}</TableCell>
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