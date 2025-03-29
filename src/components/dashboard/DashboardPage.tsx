import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ComposedChart
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Building2, Users, DollarSign, ChevronRight, Receipt } from "lucide-react";
import { 
  AppLayout, 
  PageHeader, 
  CardContainer, 
  Grid, 
  SectionHeader 
} from "@/components/layout/AppLayout";
import {
  getIncomeStats, 
  getOccupancyRate, 
  getPropertyTypeDistribution,
  getRentCollectionStatus,
  getRecentActivities
} from "@/lib/data";
import { getDashboardSummary } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "../ui/toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { api, Transaction } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Definisci un tipo per il riepilogo della dashboard
interface DashboardSummaryData {
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
  occupancyRate: string;
  rentIncome: number;
}

interface HistoricalDashboardData {
  previousMonthProperties: number;
  previousMonthTenants: number;
  previousMonthIncome: number;
  previousMonthOccupancy: number;
}

// E la risposta dell'API dovrebbe includere:
export interface DashboardSummaryResponse extends DashboardSummaryData {
  historicalData?: HistoricalDashboardData;
}

// Stat card for summary metrics
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  to,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  to?: string;
  className?: string;
}) {
  return (
    <Link to={to || '#'} className={`block ${className || ''}`}>
      <CardContainer className="transition-all duration-300 hover:shadow-md cursor-pointer">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <h2 className="text-lg md:text-2xl font-bold mt-0.5 md:mt-1 truncate">{value}</h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 md:mt-1 truncate">{description}</p>
            )}
            {trend && (
              <div className="flex items-center mt-1 md:mt-2">
                {trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : trend === "down" ? (
                  <ArrowDownRight className="h-3 w-3 text-red-500 flex-shrink-0" />
                ) : null}
                <span
                  className={`text-xs font-medium ml-1 truncate ${
                    trend === "up"
                      ? "text-green-500"
                      : trend === "down"
                      ? "text-red-500"
                      : ""
                  }`}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 flex items-center justify-center rounded-full flex-shrink-0 ml-3">
            <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
        </div>
      </CardContainer>
    </Link>
  );
}

// Chart components
// Chart components


function IncomeChart() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNet, setShowNet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Aggiungi event listener per il resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Funzione per processare le transazioni in dati mensili
  const processTransactionsIntoMonthlyData = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) {
      console.warn("Nessuna transazione da processare");
      return [];
    }
    
    console.log("Inizio processamento transazioni:", transactions.length, "transazioni");
    
    // Oggetto per memorizzare i totali mensili
    const monthlyTotals: { [key: string]: { month: string, income: number, expenses: number, net: number } } = {};
    
    // Data corrente per i calcoli
    const today = new Date();
    
    // Creiamo un array di date per gli ultimi 12 mesi più il mese futuro (13 mesi totali)
    const monthsToDisplay = 13;
    const monthDates = [];
    
    // Aggiungiamo prima il mese futuro
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    monthDates.push(nextMonth);
    
    // Poi aggiungiamo il mese corrente e i precedenti 11 mesi (totale 12 + 1 futuro)
    for (let i = 0; i < monthsToDisplay - 1; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthDates.push(monthDate);
    }
    
    // Ordiniamo le date cronologicamente
    monthDates.sort((a, b) => a.getTime() - b.getTime());
    
    // Inizializziamo i totali mensili per tutti i mesi che vogliamo visualizzare
    monthDates.forEach(date => {
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      const monthName = date.toLocaleDateString('it-IT', { month: 'short' });
      
      // Inizializza con valori zero
      monthlyTotals[monthYear] = { 
        month: monthName, 
        income: 0, 
        expenses: 0, 
        net: 0 
      };
    });
    
    // Ora elaboriamo le transazioni e aggiorniamo i valori per ogni mese
    transactions.forEach(transaction => {
      try {
        // Assicurati che la data sia un oggetto Date
        const transactionDate = transaction.date instanceof Date 
          ? transaction.date 
          : new Date(transaction.date);
        
        if (isNaN(transactionDate.getTime())) {
          console.error("Data non valida per la transazione:", transaction);
          return; // Salta questa transazione
        }
        
        const monthYear = `${transactionDate.getMonth() + 1}/${transactionDate.getFullYear()}`;
        
        // Verifica se abbiamo inizializzato questo mese nei nostri dati
        if (monthlyTotals[monthYear]) {
          if (transaction.type === 'income') {
            monthlyTotals[monthYear].income += transaction.amount;
          } else if (transaction.type === 'expense') {
            monthlyTotals[monthYear].expenses += transaction.amount;
          }
          
          // Aggiorna il valore netto
          monthlyTotals[monthYear].net = monthlyTotals[monthYear].income - monthlyTotals[monthYear].expenses;
        }
      } catch (error) {
        console.error("Errore nell'elaborazione della transazione:", transaction, error);
      }
    });
    
    // Converti l'oggetto in un array ordinato per data
    const result = Object.entries(monthlyTotals)
      .map(([key, value]) => {
        const [month, year] = key.split('/');
        return { 
          key, 
          sortDate: new Date(parseInt(year), parseInt(month) - 1, 1),
          ...value 
        };
      })
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map(({ key, sortDate, ...rest }) => rest);
    
    // Debug per verificare i dati generati
    console.log("Dati mensili elaborati:", result);
    console.log("Numero di mesi:", result.length);
    console.log("Dettaglio mesi:", result.map(m => m.month));
    
    return result;
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.transactions.getAll();
        console.log("Transazioni caricate:", response);
        
        if (!response || response.length === 0) {
          console.warn("Nessuna transazione trovata");
          setError("Nessuna transazione disponibile");
        }
        
        setTransactions(response);
      } catch (error) {
        console.error('Errore nel caricamento delle transazioni:', error);
        setError("Errore nel caricamento delle transazioni");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const data = processTransactionsIntoMonthlyData(transactions);
  
  // Aggiunto log per verificare effettivamente i valori dei mesi
  console.log("Valori per mese:", data.map(item => `${item.month}: ${item.income}`));
  
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">Reddito Mensile</CardTitle>
          <CardDescription>Dati non disponibili</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Riprova
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Se non ci sono dati, mostra un messaggio
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">Reddito Mensile</CardTitle>
          <CardDescription>Nessun dato disponibile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Non ci sono transazioni da visualizzare</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Riprova
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-sm md:text-base font-normal">
            {showNet ? 'Reddito Netto Mensile' : 'Reddito Lordo Mensile'}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {showNet 
              ? 'Visualizzazione del reddito netto (entrate - uscite)' 
              : 'Visualizzazione dettagliata di entrate e uscite'}
          </CardDescription>
        </div>
        <div className="flex rounded-md overflow-hidden border">
          <Button 
            variant={showNet ? "outline" : "default"} 
            className={`text-xs md:text-sm px-2 md:px-3 h-7 md:h-8 rounded-none border-0 ${!showNet ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setShowNet(false)}
          >
            Lordo
          </Button>
          <Button 
            variant={showNet ? "default" : "outline"} 
            className={`text-xs md:text-sm px-2 md:px-3 h-7 md:h-8 rounded-none border-0 ${showNet ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setShowNet(true)}
          >
            Netto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
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
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tick={{ fontSize: 12 }}
                height={20}
                tickFormatter={(value) => isMobile ? '' : value}
              />
              <YAxis 
                tickFormatter={(value) => `€${value}`}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                formatter={(value) => {
                  // Assicurati che value sia un numero
                  const numValue = typeof value === 'string' ? parseFloat(value) : value;
                  // Formatta il valore come valuta
                  return [`€${numValue.toLocaleString('it-IT')}`, undefined];
                }}
                separator=": "
                cursor={{ stroke: '#f0f0f0', strokeWidth: 1, fill: 'rgba(0, 0, 0, 0.05)' }}
                // Migliora la visibilità del tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              />
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <Legend />
              
              {showNet ? (
                <Area 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorNet)" 
                  name="Netto"
                  // Forza la connessione di tutti i punti
                  connectNulls={true}
                  // Assicura che i punti estremi siano inclusi
                  activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                  dot={{ r: 4, strokeWidth: 1, stroke: '#fff' }}
                />
              ) : (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    name="Entrate"
                    // Forza la connessione di tutti i punti
                    connectNulls={true}
                    // Assicura che i punti estremi siano inclusi
                    activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                    dot={{ r: 4, strokeWidth: 1, stroke: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorExpenses)" 
                    name="Uscite"
                    // Forza la connessione di tutti i punti
                    connectNulls={true}
                    // Assicura che i punti estremi siano inclusi 
                    activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                    dot={{ r: 4, strokeWidth: 1, stroke: '#fff' }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function OccupancyChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [occupancyData, setOccupancyData] = useState<{ name: string, value: number }[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Prova a ottenere dati reali dall'API
        const response = await getDashboardSummary();
        
        if (response && response.occupancyRate) {
          // Ensure occupancyRate is a string before parsing
          const rateStr = typeof response.occupancyRate === 'string' 
            ? response.occupancyRate 
            : String(response.occupancyRate);
          
          const occupancyRate = parseFloat(rateStr);
          setOccupancyData([
            { name: "Occupato", value: occupancyRate },
            { name: "Libero", value: 100 - occupancyRate }
          ]);
        } else {
          // Fallback ai dati di esempio se necessario
          console.warn("Utilizzando dati di esempio per il grafico di occupazione");
          setOccupancyData(getOccupancyRate());
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dati di occupazione:', error);
        setError("Errore nel caricamento dei dati");
        // Fallback ai dati di esempio
        setOccupancyData(getOccupancyRate());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const COLORS = ["#3b82f6", "#94a3b8"];
  
  if (isLoading) {
    return <Skeleton className="h-[250px] md:h-[280px]" />;
  }
  
  return (
    <CardContainer className="h-[250px] md:h-[280px]">
      <SectionHeader title="Tasso di occupazione" />
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={occupancyData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {occupancyData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </CardContainer>
  );
}

function PropertyTypeChart() {
  const data = getPropertyTypeDistribution();
  const COLORS = ["#3b82f6", "#10b981", "#f97316"];
  
  return (
    <CardContainer className="h-[250px] md:h-[280px]">
      <SectionHeader title="Tipologie di proprietà" />
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </CardContainer>
  );
}

function RentCollectionChart() {
  const data = getRentCollectionStatus();
  const COLORS = ["#10b981", "#f97316", "#ef4444"];
  
  return (
    <CardContainer className="h-[300px] md:h-[350px]">
      <SectionHeader title="Stato Riscossione Affitti" />
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip formatter={(value) => `${value}%`} />
          <Bar dataKey="value" barSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardContainer>
  );
}

function RecentActivities() {
  const activities = getRecentActivities();
  
  return (
    <CardContainer>
      <SectionHeader title="Attività recenti" />
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0"
          >
            <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
            <div>
              <p className="font-medium">{activity.description}</p>
              <div className="flex text-sm text-muted-foreground gap-2 mt-1">
                <span>{activity.property}</span>
                <span>•</span>
                <span>{new Date(activity.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Aggiungiamo dati per i trend
  const [trends, setTrends] = useState({
    properties: { trend: "neutral" as "up" | "down" | "neutral", value: "0%" },
    tenants: { trend: "neutral" as "up" | "down" | "neutral", value: "0%" },
    income: { trend: "neutral" as "up" | "down" | "neutral", value: "0%" },
    occupancy: { trend: "neutral" as "up" | "down" | "neutral", value: "0%" }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);
  
  async function loadDashboardData() {
    try {
      setLoading(true);
      console.log("Iniziando caricamento dati dashboard...");
      
      // Ottieni i dati della dashboard e fai il cast
      const data = await getDashboardSummary() as unknown as DashboardSummaryResponse;
      console.log("Dati dashboard ricevuti:", data);
      
      // Ensure occupancyRate is a string before using any string methods
      if (data.occupancyRate !== undefined && data.occupancyRate !== null) {
        data.occupancyRate = String(data.occupancyRate);
      }
      
      setSummary(data);
  
      // Verifica che i dati storici siano presenti
      if (data.historicalData) {
        // Funzione di sicurezza per convertire i dati in numeri
        const safeParse = (value: any) => isNaN(parseFloat(value)) ? 0 : parseFloat(value);
  
        const propertyTrend = calculateTrend(safeParse(data.totalProperties), safeParse(data.historicalData.previousMonthProperties));
        const tenantsTrend = calculateTrend(safeParse(data.totalTenants), safeParse(data.historicalData.previousMonthTenants));
        const incomeTrend = calculateTrend(safeParse(data.rentIncome), safeParse(data.historicalData.previousMonthIncome));
        const occupancyTrend = calculateTrend(safeParse(parseFloat(String(data.occupancyRate))), safeParse(data.historicalData.previousMonthOccupancy));
  
        const formatTrend = (trend: any, singular: string, plural: string) => {
          if (trend.value === 0) return "nessuna variazione";
          return trend.isPercentage 
            ? `${Math.abs(trend.value).toFixed(1)}%` 
            : `${Math.abs(trend.value)} ${trend.value === 1 ? singular : plural} questo mese`;
        };
  
        setTrends({
          properties: {
            trend: propertyTrend.direction,
            value: formatTrend(propertyTrend, 'nuova', 'nuove'),
          },
          tenants: {
            trend: tenantsTrend.direction,
            value: formatTrend(tenantsTrend, 'nuovo', 'nuovi'),
          },
          income: {
            trend: incomeTrend.direction,
            value: `${Math.abs(incomeTrend.value).toFixed(1)}% di ${incomeTrend.direction === 'up' ? 'aumento' : 'diminuzione'}`,
          },
          occupancy: {
            trend: occupancyTrend.direction,
            value: `${Math.abs(occupancyTrend.value).toFixed(1)}% di ${occupancyTrend.direction === 'up' ? 'aumento' : 'diminuzione'}`,
          }
        });
      }
    } catch (err) {
      console.error("Errore durante il caricamento dei dati della dashboard:", err);
      if (err instanceof Error) {
        console.error("Dettaglio errore:", err.message, err.stack);
      }
      setError("Si è verificato un errore durante il caricamento dei dati. Controlla la connessione o riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }
  
  // Funzione per calcolare trend
  function calculateTrend(currentValue, previousValue) {
    if (!previousValue || previousValue === 0) {
      return { direction: "neutral" as "up" | "down" | "neutral", value: 0, isPercentage: false };
    }
    
    const difference = currentValue - previousValue;
    const direction = difference > 0 ? "up" as const : difference < 0 ? "down" as const : "neutral" as const;
    
    // Per proprietà e inquilini, mostriamo il numero assoluto se piccolo
    if (Math.abs(difference) < 10 && (typeof currentValue === 'number' && currentValue < 100)) {
      return { direction, value: difference, isPercentage: false };
    } else {
      // Altrimenti mostriamo la percentuale
      const percentChange = ((currentValue - previousValue) / previousValue) * 100;
      return { direction, value: percentChange, isPercentage: true };
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Dashboard" description="Panoramica della tua attività" />
        <div className="flex items-center justify-center h-64">
          <p>Caricamento in corso...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <PageHeader title="Dashboard" description="Panoramica della tua attività" />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
            onClick={() => window.location.reload()}
          >
            Riprova
          </button>
        </div>
      </AppLayout>
    );
  }

  // Format the occupancy rate for display
  const formatOccupancyRate = (rate: string | number): string => {
    // Ensure rate is a string before using replace
    const rateStr = typeof rate === 'string' ? rate : String(rate);
    // Return formatted rate
    return `${rateStr}%`;
  };

  return (
    <AppLayout>
      <PageHeader
        title="Pannello di controllo"
        description="Panoramica delle prestazioni dei tuoi immobili in affitto"
      />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Proprietà"
          value={summary.totalProperties}
          icon={Building2}
          trend={trends.properties.trend}
          trendValue={trends.properties.value}
          to="/properties"
          className="h-[120px] md:h-auto"
        />
        <StatCard
          title="Inquilini"
          value={summary.totalTenants}
          icon={Users}
          trend={trends.tenants.trend}
          trendValue={trends.tenants.value}
          to="/tenants"
          className="h-[120px] md:h-auto"
        />
        <StatCard
          title="Ricavo mensile"
          value={`€${summary.rentIncome.toLocaleString()}`}
          icon={DollarSign}
          trend={trends.income.trend}
          trendValue={trends.income.value}
          to="/transactions"
          className="h-[120px] md:h-auto"
        />
        <StatCard
          title="Tasso occupazione"
          value={formatOccupancyRate(summary.occupancyRate)}
          icon={Users}
          trend={trends.occupancy.trend}
          trendValue={trends.occupancy.value}
          to="/tenants"
          className="h-[120px] md:h-auto"
        />
      </div>
      
      <div className="mt-4 md:mt-8">
        <IncomeChart />
      </div>
      
      <Grid cols={3} className="mt-8">
        <OccupancyChart />
        <PropertyTypeChart />
        <RecentActivities />
      </Grid>
      
      <div className="mt-8">
        <RentCollectionChart />
      </div>
    </AppLayout>
  );
}
