import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { usePageTutorial } from '@/hooks';

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
import { ArrowUpRight, ArrowDownRight, Building2, Users, DollarSign, ChevronRight, Receipt, Calendar, RefreshCcw, FilePieChart, Percent } from "lucide-react";
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
import { generateActivitiesFromContracts } from "@/lib/activities";
import { toast } from "sonner";

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
  // Aggiungiamo il filtro temporale
  const [timeFilter, setTimeFilter] = useState("year"); // "3months", "6months", "year", "specific-year"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Aggiungiamo event listener per il resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Funzione per filtrare i dati in base al filtro temporale
  const filterDataByTimeRange = (allTransactions: Transaction[]) => {
    if (!allTransactions || allTransactions.length === 0) {
      return [];
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let startDate: Date;
    
    switch(timeFilter) {
      case "3months":
        // Ultimi 3 mesi
        startDate = new Date(currentYear, currentMonth - 2, 1);
        break;
      case "6months":
        // Ultimi 6 mesi
        startDate = new Date(currentYear, currentMonth - 5, 1);
        break;
      case "year":
        // Ultimo anno (12 mesi incluso corrente)
        startDate = new Date(currentYear, currentMonth - 11, 1);
        break;
      case "specific-year":
        // Anno specifico (1 gen - 31 dic)
        startDate = new Date(selectedYear, 0, 1);
        break;
      default:
        // Default: ultimo anno
        startDate = new Date(currentYear, currentMonth - 11, 1);
    }
    
    // Imposta la data di fine appropriata
    let endDate: Date;
    if (timeFilter === "specific-year") {
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
    } else {
      endDate = new Date();
    }

    console.log(`Filtrando transazioni dal ${startDate.toISOString()} al ${endDate.toISOString()}`);
    
    // Filtra le transazioni
    return allTransactions.filter(transaction => {
      const transactionDate = transaction.date instanceof Date
        ? transaction.date
        : new Date(transaction.date);
      
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  // Funzione per processare le transazioni in dati mensili
  const processTransactionsIntoMonthlyData = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) {
      console.warn("Nessuna transazione da processare");
      return [];
    }
    
    console.log("Inizio processamento transazioni:", transactions.length, "transazioni");
    
    // Filtra le transazioni in base al periodo selezionato
    const filteredTransactions = filterDataByTimeRange(transactions);
    console.log("Transazioni filtrate:", filteredTransactions.length);
    
    // Oggetto per memorizzare i totali mensili
    const monthlyTotals: { [key: string]: { month: string, income: number, expenses: number, net: number } } = {};
    
    // Determina il range di date da visualizzare in base al filtro temporale
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    let startMonth: Date;
    let monthsToDisplay: number;
    
    switch(timeFilter) {
      case "3months":
        startMonth = new Date(currentYear, currentMonth - 2, 1);
        monthsToDisplay = 3;
        break;
      case "6months":
        startMonth = new Date(currentYear, currentMonth - 5, 1);
        monthsToDisplay = 6;
        break;
      case "year":
        startMonth = new Date(currentYear, currentMonth - 11, 1);
        monthsToDisplay = 12;
        break;
      case "specific-year":
        startMonth = new Date(selectedYear, 0, 1);
        monthsToDisplay = 12;
        break;
      default:
        startMonth = new Date(currentYear, currentMonth - 11, 1);
        monthsToDisplay = 12;
    }
    
    // Crea array delle date per i mesi che vogliamo visualizzare
    const monthDates = [];
    for (let i = 0; i < monthsToDisplay; i++) {
      const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      monthDates.push(monthDate);
    }
    
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
    filteredTransactions.forEach(transaction => {
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
    
    console.log("Dati mensili elaborati:", result);
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
  
  // Otteniamo gli anni disponibili per il selettore
  const availableYears = Array.from(
    new Set(
      transactions
        .map(t => {
          const date = t.date instanceof Date ? t.date : new Date(t.date);
          return date.getFullYear();
        })
        .filter(y => !isNaN(y))
    )
  ).sort((a, b) => b - a); // Ordine decrescente
  
  if (availableYears.length === 0) {
    // Se non ci sono anni disponibili, usa l'anno corrente
    availableYears.push(new Date().getFullYear());
  }
  
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
  
  // Otteniamo il titolo in base al filtro
  let timeFilterTitle = "";
  switch(timeFilter) {
    case "3months":
      timeFilterTitle = "ultimi 3 mesi";
      break;
    case "6months":
      timeFilterTitle = "ultimi 6 mesi";
      break;
    case "year":
      timeFilterTitle = "ultimo anno";
      break;
    case "specific-year":
      timeFilterTitle = `anno ${selectedYear}`;
      break;
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-sm md:text-base font-normal">
            {showNet ? 'Reddito Netto Mensile' : 'Reddito Lordo Mensile'} - {timeFilterTitle}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {showNet 
              ? 'Visualizzazione del reddito netto (entrate - uscite)' 
              : 'Visualizzazione dettagliata di entrate e uscite'}
          </CardDescription>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          {/* Aggiungiamo i filtri temporali */}
          <div className="flex rounded-md overflow-hidden border">
            <Button 
              variant={timeFilter === "3months" ? "default" : "outline"} 
              className={`text-xs px-2 md:px-2 h-7 md:h-8 rounded-none border-0 ${
                timeFilter === "3months" ? 'bg-primary' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setTimeFilter("3months")}
            >
              3 Mesi
            </Button>
            <Button 
              variant={timeFilter === "6months" ? "default" : "outline"} 
              className={`text-xs px-2 md:px-2 h-7 md:h-8 rounded-none border-0 ${
                timeFilter === "6months" ? 'bg-primary' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setTimeFilter("6months")}
            >
              6 Mesi
            </Button>
            <Button 
              variant={timeFilter === "year" ? "default" : "outline"} 
              className={`text-xs px-2 md:px-2 h-7 md:h-8 rounded-none border-0 ${
                timeFilter === "year" ? 'bg-primary' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setTimeFilter("year")}
            >
              1 Anno
            </Button>
            <div className="relative">
              <Button 
                variant={timeFilter === "specific-year" ? "default" : "outline"} 
                className={`text-xs px-2 md:px-2 h-7 md:h-8 rounded-none border-0 ${
                  timeFilter === "specific-year" ? 'bg-primary' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setTimeFilter("specific-year")}
              >
                {selectedYear}
              </Button>
              {timeFilter === "specific-year" && availableYears.length > 1 && (
                <select 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Toggle lordo/netto */}
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
  const [data, setData] = useState<{ name: string, value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const COLORS = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const propertyTypeData = await getPropertyTypeDistribution();
        setData(propertyTypeData);
      } catch (error) {
        console.error('Errore nel caricamento delle tipologie di proprietà:', error);
        setError("Errore nel caricamento dei dati");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (isLoading) {
    return (
      <CardContainer className="h-[250px] md:h-[280px]">
        <SectionHeader title="Tipologie di proprietà" />
        <div className="h-full flex items-center justify-center">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </div>
      </CardContainer>
    );
  }
  
  if (error) {
    return (
      <CardContainer className="h-[250px] md:h-[280px]">
        <SectionHeader title="Tipologie di proprietà" />
        <div className="h-full flex items-center justify-center">
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
      </CardContainer>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <CardContainer className="h-[250px] md:h-[280px]">
        <SectionHeader title="Tipologie di proprietà" />
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Nessuna proprietà disponibile</p>
        </div>
      </CardContainer>
    );
  }
  
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
          <Tooltip 
            formatter={(value) => [`${value} proprietà`, undefined]}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '4px' }}
          />
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
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  useEffect(() => {
    loadActivities();
  }, []);
  
  async function loadActivities() {
    try {
      setLoading(true);
      const data = await getRecentActivities();
      setActivities(data);
    } catch (error) {
      console.error("Errore nel caricamento delle attività:", error);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleGenerateActivities() {
    try {
      setGenerating(true);
      await generateActivitiesFromContracts();
     
      // Ricarica le attività
      await loadActivities();
    } catch (error) {
      console.error("Errore nella generazione delle attività:", error);
      
    } finally {
      setGenerating(false);
    }
  }
  
  return (
    <CardContainer>
      <div className="flex justify-between items-center">
        <SectionHeader title="Attività recenti" />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGenerateActivities}
          disabled={generating}
          className="flex items-center gap-1 text-xs"
        >
          <RefreshCcw className="h-3 w-3" />
          {generating ? "Generazione..." : "Genera attività"}
        </Button>
      </div>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
              <div className="h-2 w-2 mt-2 rounded-full bg-gray-200" />
              <div className="w-full">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">
          Nessuna attività recente da mostrare.
        </div>
      ) : (
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
      )}
    </CardContainer>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Funzione per generare report
  const generateReport = () => {
    toast.success("Generazione report avviata", {
      description: "Riceverai una notifica quando il report sarà pronto."
    });
    
    // Implementazione della generazione del conto economico e del bilancio
    const generaReportCompleto = async () => {
      try {
        // Ottieni l'anno fiscale corrente o l'ultimo anno completato
        const oggi = new Date();
        const annoCorrente = oggi.getFullYear();
        const meseCorrente = oggi.getMonth();
        
        // Se siamo oltre giugno, usiamo l'anno corrente, altrimenti quello precedente
        const annoFiscale = meseCorrente >= 6 ? annoCorrente : annoCorrente - 1;
        
        // Imposta le date di inizio e fine dell'anno fiscale (1 gennaio - 31 dicembre)
        const dataInizio = new Date(annoFiscale, 0, 1); // 1 gennaio
        const dataFine = new Date(annoFiscale, 11, 31); // 31 dicembre
        
        // Parametri per le API
        const params = {
          startDate: dataInizio.toISOString().split('T')[0],
          endDate: dataFine.toISOString().split('T')[0]
        };
        
        // Raccolta dei dati finanziari usando le API esistenti
        const [transazioniResult, proprietaResult] = await Promise.all([
          api.transactions.getAll(), // Usa l'API delle transazioni invece di api.reports
          api.properties.getAll()
        ]);
        
        if (!transazioniResult || !proprietaResult) {
          throw new Error("Impossibile recuperare i dati necessari");
        }
        
        // Filtra le transazioni per il periodo selezionato
        const transazioniPeriodo = transazioniResult.filter(t => {
          const dataTrans = new Date(t.date);
          return dataTrans >= dataInizio && dataTrans <= dataFine;
        });
        
        // Elaborazione delle transazioni per il conto economico
        const contoEconomico = elaboraContoEconomico(transazioniPeriodo, dataInizio, dataFine);
        
        // Elaborazione dei dati per lo stato patrimoniale
        const statoPatrimoniale = elaboraStatoPatrimoniale(proprietaResult, transazioniPeriodo);
        
        // Genera il documento finale
        const reportCompleto = {
          titoloReport: `Bilancio d'esercizio ${annoFiscale}`,
          dataGenerazione: new Date().toISOString(),
          periodoRiferimento: {
            dal: dataInizio.toISOString().split('T')[0],
            al: dataFine.toISOString().split('T')[0]
          },
          contoEconomico,
          statoPatrimoniale
        };
        
        // Salva nel localStorage per riferimento futuro
        localStorage.setItem(`report_${annoFiscale}`, JSON.stringify(reportCompleto));
        
        // Genera il file XBRL (eXtensible Business Reporting Language)
        const xbrlContent = generaXBRL(reportCompleto, annoFiscale);
        
        // Notifica l'utente che il report è pronto
        toast.success("Report completato", {
          description: "Il bilancio in formato XBRL è pronto per il download"
        });
        
        // Scarica il file XBRL
        const blob = new Blob([xbrlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bilancio_xbrl_${annoFiscale}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } catch (error) {
        console.error("Errore nella generazione del report:", error);
        toast.error("Errore nella generazione", {
          description: "Si è verificato un errore. Riprova più tardi."
        });
      }
    };
    
    // Funzione per elaborare il conto economico
    const elaboraContoEconomico = (transazioni, dataInizio, dataFine) => {
      // Struttura del conto economico secondo principi contabili italiani
      const contoEconomico = {
        // A) VALORE DELLA PRODUZIONE
        valoreProduzioneRicavi: transazioni
          .filter(t => t.type === 'income' && t.category === 'Rent')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        
        altriRicavi: transazioni
          .filter(t => t.type === 'income' && t.category !== 'Rent')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        
        // B) COSTI DELLA PRODUZIONE
        costiMateriePrime: transazioni
          .filter(t => t.type === 'expense' && t.category === 'Maintenance')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        
        costiServizi: transazioni
          .filter(t => t.type === 'expense' && ['Utilities', 'Insurance', 'Management'].includes(t.category))
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        
        costiGodimentoBeniTerzi: transazioni
          .filter(t => t.type === 'expense' && t.category === 'Rental')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        
        imposteIndirette: transazioni
          .filter(t => t.type === 'expense' && t.category === 'Taxes')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        
        oneriDiversiGestione: transazioni
          .filter(t => t.type === 'expense' && t.category === 'Other')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        
        // Proprietà inizializzate direttamente per evitare errori del linter
        totaleValoreProduzione: 0,
        totaleCostiProduzione: 0,
        differenzaValoreCosti: 0,
        proventiFinanziari: 0,
        oneriFinanziari: 0,
        totaleProventioneriFinanziari: 0,
        risultatoPrimaImposte: 0,
        imposteReddito: 0,
        utileEsercizio: 0
      };
      
      // Calcola i totali
      contoEconomico.totaleValoreProduzione = 
        contoEconomico.valoreProduzioneRicavi + contoEconomico.altriRicavi;
      
      contoEconomico.totaleCostiProduzione = 
        contoEconomico.costiMateriePrime + 
        contoEconomico.costiServizi +
        contoEconomico.costiGodimentoBeniTerzi +
        contoEconomico.imposteIndirette +
        contoEconomico.oneriDiversiGestione;
      
      // Differenza tra valore e costi della produzione
      contoEconomico.differenzaValoreCosti = 
        contoEconomico.totaleValoreProduzione - contoEconomico.totaleCostiProduzione;
      
      // C) PROVENTI E ONERI FINANZIARI
      contoEconomico.proventiFinanziari = transazioni
        .filter(t => t.type === 'income' && t.category === 'Investment')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      contoEconomico.oneriFinanziari = transazioni
        .filter(t => t.type === 'expense' && t.category === 'Interest')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      contoEconomico.totaleProventioneriFinanziari = 
        contoEconomico.proventiFinanziari - contoEconomico.oneriFinanziari;
      
      // Risultato prima delle imposte
      contoEconomico.risultatoPrimaImposte = 
        contoEconomico.differenzaValoreCosti + contoEconomico.totaleProventioneriFinanziari;
      
      // Imposte sul reddito
      contoEconomico.imposteReddito = transazioni
        .filter(t => t.type === 'expense' && t.category === 'Income Tax')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Utile (perdita) dell'esercizio
      contoEconomico.utileEsercizio = 
        contoEconomico.risultatoPrimaImposte - contoEconomico.imposteReddito;
      
      return contoEconomico;
    };
    
    // Funzione per elaborare lo stato patrimoniale
    const elaboraStatoPatrimoniale = (proprieta, transazioni) => {
      // Calcola il valore delle proprietà immobiliari (ATTIVO)
      const valoreImmobili = proprieta.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
      
      // Calcola i crediti verso clienti (ATTIVO)
      const creditiClienti = transazioni
        .filter(t => t.type === 'income' && t.status === 'pending')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Calcola la liquidità (ATTIVO)
      const liquidita = transazioni
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => {
          const amount = parseFloat(t.amount);
          return t.type === 'income' ? sum + amount : sum - amount;
        }, 0);
      
      // Calcola i debiti verso fornitori (PASSIVO)
      const debitiFornitori = transazioni
        .filter(t => t.type === 'expense' && t.status === 'pending')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Struttura dello stato patrimoniale secondo principi contabili italiani
      return {
        // ATTIVO
        attivo: {
          // B) IMMOBILIZZAZIONI
          immobilizzazioni: {
            immobiliMateriali: valoreImmobili,
            totaleImmobilizzazioni: valoreImmobili
          },
          
          // C) ATTIVO CIRCOLANTE
          attivoCircolante: {
            crediti: {
              creditiVersoClienti: creditiClienti,
              totaleCrediti: creditiClienti
            },
            disponibilitaLiquide: {
              depositiBancari: liquidita > 0 ? liquidita : 0,
              totaleLiquidita: liquidita > 0 ? liquidita : 0
            },
            totaleAttivoCircolante: creditiClienti + (liquidita > 0 ? liquidita : 0)
          },
          
          totaleAttivo: valoreImmobili + creditiClienti + (liquidita > 0 ? liquidita : 0)
        },
        
        // PASSIVO
        passivo: {
          // A) PATRIMONIO NETTO
          patrimonioNetto: {
            capitali: valoreImmobili,
            utiliPerditaEsercizio: liquidita, // Semplificazione
            totalePatrimonioNetto: valoreImmobili + liquidita
          },
          
          // D) DEBITI
          debiti: {
            debitiVersoFornitori: debitiFornitori,
            totaleDebiti: debitiFornitori
          },
          
          totalePassivo: (valoreImmobili + liquidita) + debitiFornitori
        }
      };
    };
    
    // Funzione per generare il file XBRL standard italiano
    const generaXBRL = (report, annoFiscale) => {
      const dataInizio = report.periodoRiferimento.dal;
      const dataFine = report.periodoRiferimento.al;
      const ce = report.contoEconomico;
      const sp = report.statoPatrimoniale;
      
      // Formatta i numeri secondo lo standard XBRL (2 decimali, punto come separatore)
      const formatXbrlNum = (num) => {
        return Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "");
      };
      
      // Header XML con namespace e tassonomie XBRL standard italiane
      const xbrlContent = `<?xml version="1.0" encoding="UTF-8"?>
<xbrl 
  xmlns="http://www.xbrl.org/2003/instance" 
  xmlns:link="http://www.xbrl.org/2003/linkbase" 
  xmlns:xlink="http://www.w3.org/1999/xlink" 
  xmlns:iso4217="http://www.xbrl.org/2003/iso4217" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:itcc-ci="http://www.infocamere.it/itcd/ci/${annoFiscale}"
  xmlns:itcc="http://www.infocamere.it/itcd/${annoFiscale}"
  xsi:schemaLocation="http://www.infocamere.it/itcd/${annoFiscale} http://www.agenziaentrate.gov.it/xbrl/bilanci/${annoFiscale}/ITCD_${annoFiscale}.xsd">
  
  <!-- Informazioni di contesto -->
  <context id="ctx_duration">
    <entity>
      <identifier scheme="http://www.infocamere.it">GESTIONALE_AFFITTI</identifier>
    </entity>
    <period>
      <startDate>${dataInizio}</startDate>
      <endDate>${dataFine}</endDate>
    </period>
  </context>
  
  <context id="ctx_instant">
    <entity>
      <identifier scheme="http://www.infocamere.it">GESTIONALE_AFFITTI</identifier>
    </entity>
    <period>
      <instant>${dataFine}</instant>
    </period>
  </context>
  
  <!-- Unità di misura Euro -->
  <unit id="eur">
    <measure>iso4217:EUR</measure>
  </unit>
  
  <!-- CONTO ECONOMICO -->
  <itcc:ValoreProduzione contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.totaleValoreProduzione)}</itcc:ValoreProduzione>
  <itcc:RicaviVenditePrestazioni contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.valoreProduzioneRicavi)}</itcc:RicaviVenditePrestazioni>
  <itcc:AltriRicaviProventi contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.altriRicavi)}</itcc:AltriRicaviProventi>
  
  <itcc:CostiProduzione contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.totaleCostiProduzione)}</itcc:CostiProduzione>
  <itcc:CostiMateriePrime contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.costiMateriePrime)}</itcc:CostiMateriePrime>
  <itcc:CostiServizi contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.costiServizi)}</itcc:CostiServizi>
  <itcc:CostiGodimentoBeniTerzi contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.costiGodimentoBeniTerzi)}</itcc:CostiGodimentoBeniTerzi>
  <itcc:OneriDiversiGestione contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.oneriDiversiGestione)}</itcc:OneriDiversiGestione>
  
  <itcc:DifferenzaValoreCostiProduzione contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.differenzaValoreCosti)}</itcc:DifferenzaValoreCostiProduzione>
  
  <itcc:ProventiFinanziari contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.proventiFinanziari)}</itcc:ProventiFinanziari>
  <itcc:OneriFinanziari contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.oneriFinanziari)}</itcc:OneriFinanziari>
  <itcc:TotaleProventiOneriFinanziari contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.totaleProventioneriFinanziari)}</itcc:TotaleProventiOneriFinanziari>
  
  <itcc:RisultatoPrimaImposte contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.risultatoPrimaImposte)}</itcc:RisultatoPrimaImposte>
  <itcc:ImposteRedditoEsercizio contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.imposteReddito)}</itcc:ImposteRedditoEsercizio>
  <itcc:UtilePerditaEsercizio contextRef="ctx_duration" unitRef="eur" decimals="2">${formatXbrlNum(ce.utileEsercizio)}</itcc:UtilePerditaEsercizio>
  
  <!-- STATO PATRIMONIALE - ATTIVO -->
  <itcc-ci:Immobilizzazioni contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.attivo.immobilizzazioni.totaleImmobilizzazioni)}</itcc-ci:Immobilizzazioni>
  <itcc-ci:ImmobilizzazioniMateriali contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.attivo.immobilizzazioni.immobiliMateriali)}</itcc-ci:ImmobilizzazioniMateriali>
  
  <itcc-ci:AttivoCircolante contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.attivo.attivoCircolante.totaleAttivoCircolante)}</itcc-ci:AttivoCircolante>
  <itcc-ci:CreditiAttivoCircolante contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.attivo.attivoCircolante.crediti.totaleCrediti)}</itcc-ci:CreditiAttivoCircolante>
  <itcc-ci:DisponibilitaLiquide contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.attivo.attivoCircolante.disponibilitaLiquide.totaleLiquidita)}</itcc-ci:DisponibilitaLiquide>
  
  <itcc-ci:TotaleAttivo contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.attivo.totaleAttivo)}</itcc-ci:TotaleAttivo>
  
  <!-- STATO PATRIMONIALE - PASSIVO -->
  <itcc-ci:PatrimonioNetto contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.passivo.patrimonioNetto.totalePatrimonioNetto)}</itcc-ci:PatrimonioNetto>
  <itcc-ci:Capitale contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.passivo.patrimonioNetto.capitali)}</itcc-ci:Capitale>
  <itcc-ci:UtilePerditaEsercizio contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.passivo.patrimonioNetto.utiliPerditaEsercizio)}</itcc-ci:UtilePerditaEsercizio>
  
  <itcc-ci:Debiti contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.passivo.debiti.totaleDebiti)}</itcc-ci:Debiti>
  
  <itcc-ci:TotalePassivo contextRef="ctx_instant" unitRef="eur" decimals="2">${formatXbrlNum(sp.passivo.totalePassivo)}</itcc-ci:TotalePassivo>
  
</xbrl>`;

      return xbrlContent;
    };
    
    // Avvia la generazione del report
    generaReportCompleto();
  };

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
      return { direction: "neutral" as const, value: 0, isPercentage: false };
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
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6" data-tutorial="dashboard-overview">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={generateReport}>
            <FilePieChart className="mr-2 h-4 w-4" />
            Genera Report
          </Button>
        </div>
        
        {/* Statistiche */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8" data-tutorial="dashboard-stats">
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
            icon={Receipt}
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
      </div>
    </AppLayout>
  );
}
