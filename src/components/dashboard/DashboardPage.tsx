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
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  to?: string;
}) {
  return (
    <Link to={to || '#'} className="block">
      <CardContainer className="transition-all duration-300 hover:shadow-md cursor-pointer">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h2 className="text-2xl font-bold mt-1">{value}</h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                {trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : trend === "down" ? (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                ) : null}
                <span
                  className={`text-xs font-medium ml-1 ${
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
          <div className="h-10 w-10 bg-primary/10 flex items-center justify-center rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContainer>
    </Link>
  );
}

// Chart components
function IncomeChart() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNet, setShowNet] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await api.transactions.getAll();
        setTransactions(response);
      } catch (error) {
        console.error('Errore nel caricamento delle transazioni:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Processa le transazioni in dati mensili per il grafico
  const processTransactionsIntoMonthlyData = (transactions: Transaction[]) => {
    const monthlyTotals: { [key: string]: { month: string, income: number, expenses: number, net: number } } = {};
    
    // Inizializza i totali mensili per gli ultimi 12 mesi
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      const monthName = date.toLocaleDateString('it-IT', { month: 'short' });
      monthlyTotals[monthYear] = { month: monthName, income: 0, expenses: 0, net: 0 };
    }
    
    // Aggrega le transazioni per mese
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (monthlyTotals[monthYear]) {
        if (transaction.type === 'income') {
          monthlyTotals[monthYear].income += transaction.amount;
        } else if (transaction.type === 'expense') {
          monthlyTotals[monthYear].expenses += transaction.amount;
        }
        
        // Calcola il valore netto (entrate - uscite)
        monthlyTotals[monthYear].net = monthlyTotals[monthYear].income - monthlyTotals[monthYear].expenses;
      }
    });
    
    return Object.values(monthlyTotals);
  };
  
  const data = processTransactionsIntoMonthlyData(transactions);
  
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-base font-normal">
            {showNet ? 'Reddito Netto Mensile' : 'Reddito Lordo Mensile'}
          </CardTitle>
          <CardDescription>
            {showNet 
              ? 'Visualizzazione del reddito netto (entrate - uscite)' 
              : 'Visualizzazione dettagliata di entrate e uscite'}
          </CardDescription>
        </div>
        <div className="flex rounded-md overflow-hidden border">
          <Button 
            variant={showNet ? "outline" : "default"} 
            className={`rounded-none border-0 ${!showNet ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setShowNet(false)}
            size="sm"
          >
            Lordo
          </Button>
          <Button 
            variant={showNet ? "default" : "outline"} 
            className={`rounded-none border-0 ${showNet ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setShowNet(true)}
            size="sm"
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
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <Legend />
              
              {showNet ? (
                <Area 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorNet)" 
                  name="Netto" 
                />
              ) : (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    name="Entrate" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorExpenses)" 
                    name="Uscite" 
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
  const data = getOccupancyRate();
  const COLORS = ["#3b82f6", "#94a3b8"];
  
  return (
    <CardContainer className="h-[250px] md:h-[280px]">
      <SectionHeader title="Tasso di occupazione" />
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
      // Cast esplicito a DashboardSummaryResponse
      const data = await getDashboardSummary() as unknown as DashboardSummaryResponse;
      console.log("Dati dashboard ricevuti:", data);
      setSummary(data);
      
      // Calcola i trend in base ai dati storici
      if (data.historicalData) {
        const propertyTrend = calculateTrend(data.totalProperties, data.historicalData.previousMonthProperties);
        const tenantsTrend = calculateTrend(data.totalTenants, data.historicalData.previousMonthTenants);
        const incomeTrend = calculateTrend(data.rentIncome, data.historicalData.previousMonthIncome);
        const occupancyTrend = calculateTrend(parseFloat(data.occupancyRate), data.historicalData.previousMonthOccupancy);
        
        setTrends({
          properties: {
            trend: propertyTrend.direction,
            value: propertyTrend.isPercentage 
              ? `${Math.abs(propertyTrend.value).toFixed(1)}%` 
              : `${Math.abs(propertyTrend.value)} ${propertyTrend.value === 1 ? 'nuova' : 'nuove'} questo mese`
          },
          tenants: {
            trend: tenantsTrend.direction,
            value: tenantsTrend.isPercentage 
              ? `${Math.abs(tenantsTrend.value).toFixed(1)}%` 
              : `${Math.abs(tenantsTrend.value)} ${tenantsTrend.value === 1 ? 'nuovo' : 'nuovi'} questo mese`
          },
          income: {
            trend: incomeTrend.direction,
            value: `${Math.abs(incomeTrend.value).toFixed(1)}% di ${incomeTrend.direction === 'up' ? 'aumento' : 'diminuzione'}`
          },
          occupancy: {
            trend: occupancyTrend.direction,
            value: `${Math.abs(occupancyTrend.value).toFixed(1)}% di ${occupancyTrend.direction === 'up' ? 'aumento' : 'diminuzione'}`
          }
        });
      }
    } catch (err) {
      console.error("Errore durante il caricamento dei dati della dashboard:", err);
      // Log più dettagliato dell'errore
      if (err instanceof Error) {
        console.error("Dettaglio errore:", err.message, err.stack);
      }
      setError("Si è verificato un errore durante il caricamento dei dati.");
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

  return (
    <AppLayout>
      <PageHeader
        title="Pannello di controllo"
        description="Panoramica delle prestazioni dei tuoi immobili in affitto"
      />
      
      <Grid cols={4}>
        <StatCard
          title="Proprietà"
          value={summary.totalProperties}
          icon={Building2}
          trend={trends.properties.trend}
          trendValue={trends.properties.value}
          to="/properties"
        />
        <StatCard
          title="Inquilini"
          value={summary.totalTenants}
          icon={Users}
          trend={trends.tenants.trend}
          trendValue={trends.tenants.value}
          to="/tenants"
        />
        <StatCard
          title="Ricavo mensile"
          value={`€${summary.rentIncome.toLocaleString()}`}
          icon={DollarSign}
          trend={trends.income.trend}
          trendValue={trends.income.value}
          to="/transactions"
        />
        <StatCard
          title="Tasso occupazione"
          value={`${summary.occupancyRate}%`}
          icon={Users}
          trend={trends.occupancy.trend}
          trendValue={trends.occupancy.value}
          to="/tenants"
        />
      </Grid>
      
      <div className="mt-8">
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
