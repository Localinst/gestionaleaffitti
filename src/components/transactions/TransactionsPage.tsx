import { useEffect, useState, useMemo, useCallback } from "react";
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
import { getTransactions, deleteTransaction, deleteAllTransactions } from "@/services/api";
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
import { useTranslation } from "react-i18next";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function TransactionsPage() {
  const { t } = useTranslation();
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
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    if (isInitialLoad) {
      loadInitialData();
    }
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

  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);
      
      // Carica le proprietà e i tenant in parallelo
      const [propertiesData, tenantsData] = await Promise.all([
        getProperties(),
        getTenants()
      ]);
      
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

      // Dopo aver caricato i dati di base, carica le transazioni
      loadTransactions();
      setIsInitialLoad(false);
      
    } catch (err: any) {
      console.error("Errore durante il caricamento dei dati iniziali:", err);
      setError(err.message || "Errore durante il caricamento dei dati");
      setProperties([]);
      setTenants([]);
      setLoading(false);
    }
  }

  async function loadTransactions() {
    try {
      setLoading(true);
      const transactionsData = await getTransactionsData();
      
      if (!Array.isArray(transactionsData)) {
        console.error("transactionsData non è un array:", transactionsData);
        setTransactions([]);
      } else {
        console.log(`Caricate ${transactionsData.length} transazioni`);
        setTransactions(transactionsData);
      }
    } catch (err: any) {
      console.error("Errore durante il caricamento delle transazioni:", err);
      setError(err.message || "Errore durante il caricamento delle transazioni");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      // Carica solo le transazioni per l'aggiornamento
      await loadTransactions();
      
    } catch (err: any) {
      console.error("Errore durante il caricamento dei dati:", err);
      setError(err.message || "Errore durante il caricamento dei dati");
    } finally {
      setLoading(false);
    }
  }

  // Creo una mappa per accesso rapido alle proprietà per ID
  const propertyMap = useMemo(() => {
    const map = new Map();
    properties.forEach(property => {
      if (property.id) {
        map.set(property.id.toString(), property);
      }
    });
    return map;
  }, [properties]);

  const getPropertyName = (propertyId: string | number) => {
    // Se propertyId è undefined, null o stringa vuota, ritorna direttamente "N/A"
    if (!propertyId) return "N/A";
    
    // Usa la mappa per un accesso O(1) invece di cercare con find O(n)
    const propertyKey = propertyId.toString();
    const property = propertyMap.get(propertyKey);
    
    return property ? property.name : "Proprietà sconosciuta";
  };
  
  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return "";
    const tenant = tenants.find(t => t.id?.toString() === tenantId?.toString());
    return tenant ? tenant.name : "Unknown";
  };
  
  // Ottimizzazione: memorizzo il risultato del filtraggio per evitare ricalcoli inutili
  const filteredTransactions = useMemo(() => {
    console.time('filterTransactions');
    const result = transactions.filter((transaction) => {
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
    console.timeEnd('filterTransactions');
    return result;
  }, [transactions, searchQuery, typeFilter, propertyFilter, properties]);
  
  // Ottimizzazione: calcola le transazioni visibili con paginazione
  const visibleTransactions = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, page, pageSize]);
  
  // Calcola il numero totale di pagine
  const totalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / pageSize);
  }, [filteredTransactions, pageSize]);

  // Gestisce il cambio pagina
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    // Scorri verso l'alto quando cambi pagina
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Ottimizzazione: utilizza useCallback per evitare ricreazioni non necessarie dei gestori di eventi
  const handleEdit = useCallback((transaction: any) => {
    setSelectedTransaction(transaction);
    setIsEditTransactionOpen(true);
  }, []);

  const handleDelete = useCallback((transaction: any) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteAll = useCallback(() => {
    setDeleteAllDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedTransaction) return;
    
    try {
      setDeleteLoading(true);
      await deleteTransaction(selectedTransaction.id);
      
      // Aggiorna solo le transazioni invece di ricaricare tutto
      loadTransactions();
      
      toast.success(t("transactions.confirmDelete.success"));
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    } catch (err: any) {
      console.error("Errore durante l'eliminazione della transazione:", err);
      toast.error(t("transactions.confirmDelete.error"));
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedTransaction, t]);

  const confirmDeleteAll = useCallback(async () => {
    try {
      setDeleteAllLoading(true);
      const result = await deleteAllTransactions();
      
      // Aggiorna solo le transazioni invece di ricaricare tutto
      loadTransactions();
      
      toast.success(t("transactions.deleteAll.success", { count: result.count }));
      setDeleteAllDialogOpen(false);
    } catch (err: any) {
      console.error("Errore durante l'eliminazione di tutte le transazioni:", err);
      toast.error(t("transactions.deleteAll.error"));
    } finally {
      setDeleteAllLoading(false);
    }
  }, [t]);

  // Ottimizzazione: gestori di eventi per i filtri con debounce
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  // Applica debounce alla ricerca per evitare troppe rielaborazioni
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(debouncedSearchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [debouncedSearchQuery]);
  
  return (
    <AppLayout>
      <div className="flex justify-between items-center">
        <PageHeader
          title={t("transactions.title")}
          description={t("transactions.description")}
        />
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddTransactionOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>{t("transactions.addTransaction")}</span>
        </Button>
      </div>
      
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("transactions.searchTransactions")}
            className="pl-10"
            value={debouncedSearchQuery}
            onChange={(e) => setDebouncedSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("transactions.filterByType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("transactions.filters.all")}</SelectItem>
              <SelectItem value="income">{t("transactions.filters.income")}</SelectItem>
              <SelectItem value="expense">{t("transactions.filters.expense")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("transactions.filterByProperty")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("transactions.filters.all")}</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={loadData} 
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t("common.actions.refresh")}</span>
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {t("transactions.count", { count: filteredTransactions.length })}
        </div>
        
        <Button 
          variant="destructive" 
          onClick={handleDeleteAll} 
          className="flex items-center gap-2"
          disabled={transactions.length === 0 || deleteAllLoading}
        >
          <Trash2 className="h-4 w-4" />
          <span>{t("transactions.deleteAllTransactions")}</span>
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin mr-2">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <p>{t("common.status.loading")}</p>
        </div>
      ) : error ? (
        <CardContainer className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium">{t("transactions.connectionError")}</h3>
            <p className="text-muted-foreground mt-1 mb-4 max-w-md">
              {error}
            </p>
            <Button 
              onClick={loadData}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("transactions.tryAgain")}
            </Button>
          </div>
        </CardContainer>
      ) : filteredTransactions.length === 0 ? (
        <CardContainer className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t("transactions.noTransactionsFound")}</h3>
            <p className="text-muted-foreground mt-1">
              {t("transactions.modifySearchOrAdd")}
            </p>
            <Button 
              className="mt-4"
              onClick={() => setIsAddTransactionOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("transactions.addTransaction")}
            </Button>
          </div>
        </CardContainer>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("transactions.transactionDetails.date")}</TableHead>
                  <TableHead>{t("transactions.transactionDetails.property")}</TableHead>
                  <TableHead>{t("transactions.transactionDetails.tenant")}</TableHead>
                  <TableHead>{t("transactions.transactionDetails.category")}</TableHead>
                  <TableHead>{t("transactions.transactionDetails.description")}</TableHead>
                  <TableHead>{t("transactions.transactionDetails.type")}</TableHead>
                  <TableHead>{t("transactions.transactionDetails.amount")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.property_name || getPropertyName(transaction.propertyId)}</TableCell>
                    <TableCell>{transaction.tenant_name || getTenantName(transaction.tenantId)}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? t("transactions.types.income") : t("transactions.types.expense")}
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
                            <span className="sr-only">{t("transactions.menu.open")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>{t("transactions.menu.edit")}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(transaction)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>{t("transactions.menu.delete")}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Aggiungi paginazione se ci sono più pagine */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => page > 1 && handlePageChange(page - 1)}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                    />
                  </PaginationItem>
                  
                  {/* Prima pagina */}
                  {page > 2 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis se necessario */}
                  {page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Pagina precedente se non è la prima */}
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(page - 1)}>
                        {page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Pagina corrente */}
                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>
                  
                  {/* Pagina successiva se non è l'ultima */}
                  {page < totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(page + 1)}>
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis se necessario */}
                  {page < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Ultima pagina */}
                  {page < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => page < totalPages && handlePageChange(page + 1)}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
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
            <AlertDialogTitle>{t("transactions.confirmDelete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("transactions.confirmDelete.message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("transactions.confirmDelete.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? `${t("common.status.processing")}...` : t("transactions.confirmDelete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("transactions.deleteAll.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("transactions.deleteAll.message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("transactions.deleteAll.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAll} 
              disabled={deleteAllLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAllLoading ? `${t("common.status.processing")}...` : t("transactions.deleteAll.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
