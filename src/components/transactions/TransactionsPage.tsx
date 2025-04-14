import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowDownUp, 
  ArrowUp, 
  ArrowDown, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Receipt,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { getProperties, getTenants, getTransactionsData } from "@/lib/data";
import { 
  AppLayout, 
  PageHeader, 
  CardContainer, 
  Grid 
} from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTransactions, deleteTransaction } from "@/services/api";
import { AddTransactionForm } from "./AddTransactionForm";
import { Property, Tenant } from "@/lib/data";
import { toast } from "sonner";
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
import { api } from "@/services/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);

  // Effetto di debug per monitorare lo stato
  useEffect(() => {
    console.log("Stato corrente:", {
      loading,
      error,
      transactionsCount: transactions.length,
      propertiesCount: properties.length,
      tenantsCount: tenants.length
    });
  }, [loading, error, transactions, properties, tenants]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      // Carica tutti i dati in parallelo
      const [transactionsData, propertiesData, tenantsData] = await Promise.all([
        getTransactionsData(),
        getProperties(),
        getTenants()
      ]);
      
      console.log("Dati ricevuti:", { 
        transazioni: transactionsData?.length || 0,
        proprietà: propertiesData?.length || 0, 
        inquilini: tenantsData?.length || 0 
      });
      
      if (!Array.isArray(transactionsData)) {
        console.error("transactionsData non è un array:", transactionsData);
        setTransactions([]);
      } else {
        setTransactions(transactionsData);
      }
      
      if (!Array.isArray(propertiesData)) {
        console.error("propertiesData non è un array:", propertiesData);
        setProperties([]);
      } else {
        setProperties(propertiesData);
      }
      
      if (!Array.isArray(tenantsData)) {
        console.error("tenantsData non è un array:", tenantsData);
        setTenants([]);
      } else {
        setTenants(tenantsData);
      }
      
    } catch (err: any) {
      console.error("Errore durante il caricamento dei dati:", err);
      setError(err.message || "Errore durante il caricamento dei dati");
      setTransactions([]);
      setProperties([]);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }

  const getPropertyName = (propertyId: string | number) => {
    console.log("PropertyId cercato:", propertyId, "tipo:", typeof propertyId);
    console.log("Properties disponibili:", properties);
    
    if (!propertyId) return "Unknown";
    
    // Metodo più robusto per trovare la corrispondenza
    const property = properties.find(p => {
      // Confronto sia con ID stringa che numero
      const pId = p.id?.toString() || "";
      const tId = propertyId?.toString() || "";
      
      console.log("Confronto:", pId, tId, pId === tId);
      return pId === tId;
    });
    
    // Mostra maggiori dettagli in caso di mancata corrispondenza
    if (!property) {
      console.warn(`Proprietà non trovata con ID: ${propertyId}`);
      console.log("Tutti gli ID proprietà:", properties.map(p => ({id: p.id, tipo: typeof p.id})));
    }
    
    return property ? property.name : "Unknown";
  };
  
  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return "";
    const tenant = tenants.find(t => t.id?.toString() === tenantId?.toString());
    return tenant ? tenant.name : "Unknown";
  };
  
  // Apply filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      (transaction.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (transaction.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (transaction.property_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (transaction.tenant_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      getPropertyName(transaction.propertyId).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    const matchesProperty = propertyFilter === "all" || 
      transaction.propertyId?.toString() === propertyFilter ||
      transaction.property_id?.toString() === propertyFilter;
    
    return matchesSearch && matchesType && matchesProperty;
  });
  
  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  const handleDelete = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;
    
    try {
      setDeleteLoading(true);
      await deleteTransaction(selectedTransaction.id);
      
      // Aggiorna la lista delle transazioni
      loadData();
      
      toast.success("Transazione eliminata con successo");
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    } catch (err: any) {
      console.error("Errore durante l'eliminazione della transazione:", err);
      toast.error("Errore durante l'eliminazione della transazione");
    } finally {
      setDeleteLoading(false);
    }
  };
  
  return (
    <AppLayout>
      <div className="flex justify-between items-center">
        <PageHeader
          title="Transazioni"
          description="Gestisci le tue entrate e uscite"
        />
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddTransactionOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Aggiungi Transazione</span>
        </Button>
      </div>
      
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca transazioni..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-[180px]">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtra per tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="income">Entrate</SelectItem>
              <SelectItem value="expense">Uscite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-[220px]">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtra per proprietà" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le proprietà</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id?.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin mr-2">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <p>Caricamento dei dati in corso...</p>
        </div>
      ) : error ? (
        <CardContainer className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium">Errore di connessione</h3>
            <p className="text-muted-foreground mt-1 mb-4 max-w-md">
              {error}
            </p>
            <Button 
              onClick={loadData}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          </div>
        </CardContainer>
      ) : filteredTransactions.length === 0 ? (
        <CardContainer className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nessuna transazione trovata</h3>
            <p className="text-muted-foreground mt-1">
              Prova a modificare la ricerca o aggiungi una nuova transazione.
            </p>
            <Button 
              className="mt-4"
              onClick={() => setIsAddTransactionOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Transazione
            </Button>
          </div>
        </CardContainer>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Proprietà</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>{transaction.property_name || getPropertyName(transaction.propertyId)}</TableCell>
                  <TableCell>{transaction.tenant_name || getTenantName(transaction.tenantId)}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'income' ? 'Entrata' : 'Uscita'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      €{transaction.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Apri menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Modifica</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(transaction)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Elimina</span>
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

      <AddTransactionForm 
        open={isAddTransactionOpen} 
        onOpenChange={setIsAddTransactionOpen}
      />
      
      {selectedTransaction && (
        <AddTransactionForm 
          open={isEditTransactionOpen} 
          onOpenChange={setIsEditTransactionOpen}
          transaction={selectedTransaction}
        />
      )}
      
      {/* Dialog di conferma eliminazione */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questa transazione?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La transazione verrà rimossa permanentemente dal sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
