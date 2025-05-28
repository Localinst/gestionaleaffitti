import { useEffect, useState } from "react";
import { Plus, Search, Users, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { 
  AppLayout, 
  PageHeader, 
  CardContainer
} from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTenants, getProperties, deleteAllTenants } from "@/services/api";
import { AddTenantForm } from "./AddTenantForm";
import { Tenant, Property } from "@/services/api";
import { useNavigate } from 'react-router-dom';
import { usePageTutorial } from '@/hooks';
import { useTranslation } from "react-i18next";

export default function TenantsPage() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const navigate = useNavigate();

  // Aggiungo l'hook per il tutorial
  usePageTutorial();

  useEffect(() => {
    loadTenants();
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (err) {
      console.error("Errore durante il caricamento delle proprietà:", err);
    }
  }

  async function loadTenants() {
    try {
      setLoading(true);
      const data = await getTenants();
      
      // Controllo esplicito se data è un array
      if (Array.isArray(data)) {
        setTenants(data);
      } else {
        console.error("I dati ricevuti non sono un array:", data);
        setTenants([]);
        setError("Formato dati non valido. Contatta l'amministratore.");
      }
    } catch (err) {
      console.error("Errore durante il caricamento degli inquilini:", err);
      setTenants([]);
      setError("Si è verificato un errore durante il caricamento degli inquilini.");
    } finally {
      setLoading(false);
    }
  }

  const getPropertyName = (propertyId: string | number) => {
    if (!propertyId) return "-";
    const property = properties.find(p => p.id.toString() === propertyId.toString());
    return property ? property.name : "-";
  };

  const filteredTenants = Array.isArray(tenants) 
    ? tenants.filter(
        (tenant) =>
          tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tenant.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <AppLayout>
      <div className="flex justify-between items-center px-2">
        <PageHeader
          title={t("tenants.title")}
          description={t("tenants.description")}
        />
        <div className="flex gap-2">
          <Button 
            className="flex items-center gap-2 bg-destructive text-white"
            onClick={async () => {
              if (window.confirm('Sei sicuro di voler eliminare tutti gli inquilini?')) {
                await deleteAllTenants();
                await loadTenants();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span>Elimina tutti gli inquilini</span>
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsAddTenantOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>{t("tenants.addTenant")}</span>
          </Button>
        </div>
      </div>

      <div className="mb-8 flex gap-4 w-full max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("tenants.searchTenants")}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div>{t("common.status.loading")}</div>
      ) : error ? (
        <div>{error}</div>
      ) : filteredTenants.length === 0 ? (
        <CardContainer className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t("tenants.noTenants")}</h3>
            <p className="text-muted-foreground mt-1">
              Prova a modificare la ricerca o aggiungi un nuovo inquilino.
            </p>
            <Button 
              className="mt-4"
              onClick={() => setIsAddTenantOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("tenants.addTenant")}
            </Button>
          </div>
        </CardContainer>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Proprietà</TableHead>
                <TableHead>Inizio Contratto</TableHead>
                <TableHead>Fine Contratto</TableHead>
                <TableHead>Affitto Mensile</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>{tenant.phone}</TableCell>
                  <TableCell>{getPropertyName(tenant.property_id)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions.edit")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>{t("common.actions.edit")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t("common.actions.delete")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddTenantForm 
        open={isAddTenantOpen} 
        onOpenChange={setIsAddTenantOpen}
      />
    </AppLayout>
  );
}
