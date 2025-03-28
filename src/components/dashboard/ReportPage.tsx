import React, { useState, useEffect } from "react";
import { ReportFilterComponent, ReportFilters } from "./ReportFilterComponent";
import { AppLayout, PageHeader, Grid } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, DollarSign, Download, CalendarDays, PieChart, TrendingUp, LineChart } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line
} from "recharts";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interfaccia per i dati finanziari
interface FinancialData {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

// Interfaccia per i dati del riepilogo
interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  propertyCount: number;
  tenantCount: number;
  avgRent: number;
}

// Interfaccia per i dati della performance delle proprietà
interface PropertyPerformanceData {
  propertyId: string;
  propertyName: string;
  income: number;
  expenses: number;
  occupancyRate: number;
}

export default function ReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    periodType: "month",
    startDate: new Date(),
    endDate: new Date(),
    propertyId: "all"
  });
  
  // Utilizzo stati separati per ogni tipo di dato
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyPerformanceData[]>([]);
  
  // Stati per gestire il caricamento
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(false);
  
  const [activeTab, setActiveTab] = useState("summary");
  const [exportLoading, setExportLoading] = useState(false);

  // Carica i dati finanziari
  useEffect(() => {
    async function loadFinancialData() {
      try {
        setLoadingFinancial(true);
        
        const queryParams = {
          startDate: filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : undefined,
          endDate: filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : undefined,
          propertyId: filters.propertyId !== "all" ? filters.propertyId : undefined
        };
        
        const data = await api.reports.getFinancialData(queryParams);
        setFinancialData(data);
      } catch (error) {
        console.error("Errore nel caricamento dei dati finanziari:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati finanziari. Riprova più tardi.",
          variant: "destructive"
        });
        
        setFinancialData([]);
      } finally {
        setLoadingFinancial(false);
      }
    }

    loadFinancialData();
  }, [filters]);
  
  // Carica i dati di riepilogo
  useEffect(() => {
    async function loadSummaryData() {
      try {
        setLoadingSummary(true);
        
        const queryParams = {
          startDate: filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : undefined,
          endDate: filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : undefined,
          propertyId: filters.propertyId !== "all" ? filters.propertyId : undefined
        };
        
        const data = await api.reports.getSummary(queryParams);
        setSummaryData(data);
      } catch (error) {
        console.error("Errore nel caricamento dei dati di riepilogo:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare il riepilogo. Riprova più tardi.",
          variant: "destructive"
        });
        
        setSummaryData(null);
      } finally {
        setLoadingSummary(false);
      }
    }

    loadSummaryData();
  }, [filters]);
  
  // Carica i dati delle proprietà
  useEffect(() => {
    async function loadPropertyData() {
      try {
        setLoadingProperty(true);
        
        const queryParams = {
          startDate: filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : undefined,
          endDate: filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : undefined,
          propertyId: filters.propertyId !== "all" ? filters.propertyId : undefined
        };
        
        const data = await api.reports.getPropertyPerformance(queryParams);
        setPropertyData(data);
      } catch (error) {
        console.error("Errore nel caricamento dei dati delle proprietà:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati delle proprietà. Riprova più tardi.",
          variant: "destructive"
        });
        
        setPropertyData([]);
      } finally {
        setLoadingProperty(false);
      }
    }

    loadPropertyData();
  }, [filters]);

  // Funzione per esportare il report
  const handleExport = async (fileFormat: string) => {
    try {
      setExportLoading(true);
      
      const queryParams = {
        startDate: filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : undefined,
        endDate: filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : undefined,
        propertyId: filters.propertyId !== "all" ? filters.propertyId : undefined
      };
      
      const blob = await api.reports.exportReport(fileFormat, queryParams);
      
      // Crea un URL per il download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Nome del file in base al formato
      const dateStr = format(new Date(), "yyyyMMdd");
      a.download = `report_${dateStr}.${fileFormat}`;
      
      // Scatena il download
      document.body.appendChild(a);
      a.click();
      
      // Pulisci
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Errore nell'esportazione del report:", error);
      toast({
        title: "Errore",
        description: "Impossibile esportare il report. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Renderizza il grafico degli incassi/spese
  const renderIncomeChart = () => {
    if (loadingFinancial) return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
    
    if (financialData.length === 0) {
      return (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Andamento Finanziario</CardTitle>
            <CardDescription>
              Nessun dato disponibile per il periodo selezionato
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <LineChart className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Non ci sono dati finanziari da visualizzare per i criteri selezionati.</p>
              <p className="text-sm mt-2">Prova a selezionare un periodo diverso o cambia i filtri.</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Andamento Finanziario</CardTitle>
          <CardDescription>
            Visualizzazione dettagliata di entrate, uscite e margine netto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={financialData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <Tooltip 
                  formatter={(value) => [`€${Number(value).toLocaleString()}`, undefined]}
                  labelFormatter={(label) => `Periodo: ${label}`}
                />
                <Bar dataKey="income" fill="url(#colorIncome)" name="Entrate" />
                <Bar dataKey="expenses" fill="url(#colorExpenses)" name="Uscite" />
                <Line 
                  type="monotone"
                  dataKey="net"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Netto"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizza la card di riepilogo
  const renderSummaryCard = () => {
    if (loadingSummary) return (
      <div className="h-[200px] w-full flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
    
    if (!summaryData) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Riepilogo Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>Nessun dato di riepilogo disponibile</p>
              <p className="text-sm mt-2">Prova a selezionare un periodo diverso</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Riepilogo Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Entrate Totali</p>
            <p className="text-2xl font-bold text-green-600">€{summaryData.totalIncome.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Uscite Totali</p>
            <p className="text-2xl font-bold text-red-500">€{summaryData.totalExpenses.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Reddito Netto</p>
            <p className="text-2xl font-bold">€{summaryData.netIncome.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tasso di Occupazione</p>
            <p className="text-2xl font-bold">{summaryData.occupancyRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Proprietà</p>
            <p className="text-2xl font-bold">{summaryData.propertyCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Inquilini</p>
            <p className="text-2xl font-bold">{summaryData.tenantCount}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizza la tabella delle performance per proprietà
  const renderPropertyPerformance = () => {
    if (loadingProperty) return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
    
    if (propertyData.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Performance per Proprietà
            </CardTitle>
            <CardDescription>
              Nessuna proprietà trovata per il periodo selezionato
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Non ci sono dati disponibili per le proprietà nel periodo selezionato.</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Performance per Proprietà
          </CardTitle>
          <CardDescription>
            Analisi comparativa delle proprietà nel periodo selezionato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground border-b pb-2">
              <div className="col-span-5">Proprietà</div>
              <div className="col-span-2 text-right">Entrate</div>
              <div className="col-span-2 text-right">Uscite</div>
              <div className="col-span-2 text-right">Netto</div>
              <div className="col-span-1 text-right">Occ.</div>
            </div>
            
            {propertyData.map((property) => (
              <div key={property.propertyId} className="grid grid-cols-12 text-sm py-2 border-b last:border-0">
                <div className="col-span-5 font-medium">{property.propertyName}</div>
                <div className="col-span-2 text-right text-green-600">€{property.income.toLocaleString()}</div>
                <div className="col-span-2 text-right text-red-500">€{property.expenses.toLocaleString()}</div>
                <div className="col-span-2 text-right font-medium">€{(property.income - property.expenses).toLocaleString()}</div>
                <div className="col-span-1 text-right">{property.occupancyRate}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <PageHeader 
          title="Report & Analytics" 
          description="Analisi dettagliata delle performance delle tue proprietà" 
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={exportLoading}>
              <Download className="mr-2 h-4 w-4" />
              {exportLoading ? "Esportazione..." : "Esporta Report"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              Esporta come PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Esporta come CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              Esporta come Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <ReportFilterComponent onFiltersChange={setFilters} />
      
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Riepilogo</TabsTrigger>
            <TabsTrigger value="financial">Finanziario</TabsTrigger>
            <TabsTrigger value="properties">Proprietà</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
            <Grid cols={2}>
              {renderSummaryCard()}
              {renderPropertyPerformance()}
            </Grid>
            {renderIncomeChart()}
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-6">
            {renderIncomeChart()}
          </TabsContent>
          
          <TabsContent value="properties" className="space-y-6">
            {renderPropertyPerformance()}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 