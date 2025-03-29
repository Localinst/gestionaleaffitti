import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, RefreshCw } from "lucide-react";
import { useState } from "react";

export interface PropertyPerformanceData {
  id?: string;
  name: string;
  income: number;
  expenses: number;
  netIncome?: number;
  occupancyRate: number;
}

interface PropertyPerformanceTableProps {
  data?: PropertyPerformanceData[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  onRefresh?: () => void;
}

export default function PropertyPerformanceTable({ 
  data = [], 
  isLoading = false, 
  title = "Performance delle Proprietà",
  description = "Analisi economica delle proprietà nel periodo selezionato",
  onRefresh
}: PropertyPerformanceTableProps) {
  const [sortField, setSortField] = useState<keyof PropertyPerformanceData>('netIncome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Normalizza i dati per gestire il campo netIncome se non presente
  const normalizedData = data.map(item => ({
    ...item,
    netIncome: item.netIncome ?? (item.income - item.expenses)
  }));
  
  // Ordina i dati in base al campo e alla direzione selezionata
  const sortedData = [...normalizedData].sort((a, b) => {
    // Per il campo selezionato
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });
  
  // Gestisce il cambio di ordinamento
  const handleSort = (field: keyof PropertyPerformanceData) => {
    if (sortField === field) {
      // Cambia la direzione se il campo è già selezionato
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Imposta il nuovo campo e la direzione predefinita
      setSortField(field);
      setSortDirection('desc'); // Default: decrescente
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nessun dato disponibile per il periodo selezionato</p>
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={onRefresh}
              className="mx-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Ricarica
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        <div className="overflow-x-auto w-full touch-auto pb-2">
          <Table className="w-full relative min-w-[650px]">
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-muted w-[200px] sticky left-0 bg-card">
                  <div className="flex items-center justify-between">
                    <span>Proprietà</span>
                    {sortField === 'name' && (
                      <ArrowUpDown size={16} className={`ml-2 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('income')} className="cursor-pointer hover:bg-muted text-right w-[110px]">
                  <div className="flex items-center justify-end">
                    <span>Entrate</span>
                    {sortField === 'income' && (
                      <ArrowUpDown size={16} className={`ml-2 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('expenses')} className="cursor-pointer hover:bg-muted text-right w-[110px]">
                  <div className="flex items-center justify-end">
                    <span>Spese</span>
                    {sortField === 'expenses' && (
                      <ArrowUpDown size={16} className={`ml-2 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('netIncome')} className="cursor-pointer hover:bg-muted text-right w-[110px]">
                  <div className="flex items-center justify-end">
                    <span>Profitto</span>
                    {sortField === 'netIncome' && (
                      <ArrowUpDown size={16} className={`ml-2 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('occupancyRate')} className="cursor-pointer hover:bg-muted text-right w-[120px]">
                  <div className="flex items-center justify-end">
                    <span>Occupazione</span>
                    {sortField === 'occupancyRate' && (
                      <ArrowUpDown size={16} className={`ml-2 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, i) => (
                <TableRow key={item.id || i} className="hover:bg-muted/50">
                  <TableCell className="font-medium sticky left-0 bg-card">{item.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.income)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.expenses)}</TableCell>
                  <TableCell className={`text-right font-medium ${item.netIncome! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(item.netIncome!)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(item.occupancyRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Indicatore di scorrimento */}
        <div className="flex justify-center items-center mt-2 text-muted-foreground text-xs">
          <span className="animate-pulse">👈 Scorri lateralmente per vedere tutti i dati 👉</span>
        </div>
      </CardContent>
    </Card>
  );
} 