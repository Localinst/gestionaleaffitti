import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserRound, Globe, Clock, MousePointerClick, LineChart as LineChartIcon, Layers, Smartphone, Laptop, PieChart as PieChartIcon } from "lucide-react";
import { SecureCookie } from "@/lib/security";
import { useToast } from "@/components/ui/use-toast";
import { getAnalyticsStats } from '@/services/api';
import { Button } from '@/components/ui/button';

// Interfaccia per i dati di analytics
interface AnalyticsData {
  pageViews: Array<{
    date: string;
    views: number;
    unique_visitors: number;
    sessions: number;
  }>;
  devices: Array<{
    name: string;
    value: number;
  }>;
  browsers: Array<{
    name: string;
    value: number;
  }>;
  conversions: Array<{
    name: string;
    completato: number;
    abbandonato: number;
  }>;
  topPages: Array<{
    name: string;
    views: number;
    avg_time: string;
  }>;
  geoData: Array<{
    name: string;
    value: number;
  }>;
  visitors: number;
  averageSessionDuration: number;
  bounceRate: number;
  totalViews: number;
  totalSessions: number;
  // I campi seguenti sono opzionali per supportare i dati dal server
  deviceUsage?: {
    device: string;
    percentage: number;
  }[];
  timeEngagement?: {
    day: string;
    visits: number;
  }[];
  conversionValues?: {
    signup: number;
    purchase: number;
    download: number;
  };
}

// Colori per i grafici
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Funzione per formattare una stringa tipo "533619s" in formato leggibile
function formatSecondsString(str: string) {
  const seconds = parseInt(str.replace('s', ''), 10);
  if (isNaN(seconds)) return str;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Funzione per calcolare la percentuale
function getPercentage(value: number, total: number) {
  if (!total || total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

const AnalyticsStatsDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Ottieni solo dati dal server
        const serverData = await getAnalyticsStats(timeRange);
        setAnalyticsData(serverData);
        setNoData(!serverData);
      } catch (error) {
        console.error("Errore nel recupero dei dati di analytics:", error);
        setError("Impossibile caricare le statistiche di analytics dal server.");
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Registra una visualizzazione di pagina quando l'utente visita la dashboard
    // (opzionale, se vuoi mantenere il tracking)
    // trackPageView();
    // Salva la sessione corrente quando l'utente lascia la pagina
    // window.addEventListener('beforeunload', handleBeforeUnload);
    // return () => {
    //   window.removeEventListener('beforeunload', handleBeforeUnload);
    // };
  }, [timeRange]);

  const formatNumber = (num: number) => {
    if (typeof num !== 'number') return '0';
    const roundedNum = Math.round(num);
    return roundedNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Caricamento statistiche...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-lg font-medium text-red-600">{error}</p>
        <p className="text-sm text-muted-foreground">Controlla la connessione al server o riprova più tardi.</p>
      </div>
    );
  }

  if (noData || !analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-lg font-medium">Nessun dato di analytics disponibile</p>
        <p className="text-sm text-muted-foreground">Non sono presenti dati dal server.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Ultime 24 ore</SelectItem>
              <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
              <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
              <SelectItem value="90d">Ultimi 3 mesi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Visite Totali
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.totalViews)}
            </div>
            <p className="text-xs text-muted-foreground">
              Basato sui dati del browser
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Utenti Unici
            </CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.visitors)}
            </div>
            <p className="text-xs text-muted-foreground">
              Basato sui cookie degli utenti
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Sessioni
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.totalSessions)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sessioni totali registrate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tasso di Rimbalzo
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.bounceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Visite di una sola pagina
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traffic">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="traffic">Traffico</TabsTrigger>
          <TabsTrigger value="devices">Dispositivi</TabsTrigger>
          <TabsTrigger value="conversions">Conversioni</TabsTrigger>
        </TabsList>
        
        {/* Tab Traffico */}
        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Andamento Visite</CardTitle>
              <CardDescription>Visualizzazioni pagine e visitatori unici nel tempo</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              {analyticsData.pageViews && analyticsData.pageViews.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData.pageViews}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorUniqueVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatNumber(Number(value)), ""]}
                      labelFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Visualizzazioni Pagina"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                    <Area
                      type="monotone"
                      dataKey="unique_visitors"
                      name="Visitatori Unici"
                      stroke="#82ca9d"
                      fillOpacity={1}
                      fill="url(#colorUniqueVisitors)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Nessuna visualizzazione di pagina registrata nel periodo selezionato</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pagine Più Visitate</CardTitle>
                <CardDescription>Le pagine più popolari in base alle visualizzazioni</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.topPages.map((page, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="w-6 text-muted-foreground">{i + 1}.</span>
                        <span className="font-medium">{page.name}</span>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <span>{formatNumber(Number(page.views))}</span>
                        <span className="text-muted-foreground">{formatSecondsString(page.avg_time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Geografica</CardTitle>
                <CardDescription>Città di provenienza degli utenti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.geoData && analyticsData.geoData.length > 0 ? (
                    analyticsData.geoData.map((geo, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span>{geo.name}</span>
                        <span>{formatNumber(Number(geo.value))} ({getPercentage(Number(geo.value), analyticsData.totalViews)})</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Nessun dato geografico disponibile</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab Dispositivi */}
        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispositivi</CardTitle>
                <CardDescription>Distribuzione per tipo di dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.devices && analyticsData.devices.length > 0 ? (
                    analyticsData.devices.map((dev, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span>{dev.name}</span>
                        <span>{formatNumber(Number(dev.value))} ({getPercentage(Number(dev.value), analyticsData.totalViews)})</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Nessun dato sui dispositivi disponibile</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Browser</CardTitle>
                <CardDescription>Distribuzione per browser utilizzato</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.browsers && analyticsData.browsers.length > 0 ? (
                    analyticsData.browsers.map((browser, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span>{browser.name}</span>
                        <span>{formatNumber(Number(browser.value))} ({getPercentage(Number(browser.value), analyticsData.totalViews)})</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Nessun dato sui browser disponibile</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab Conversioni */}
        <TabsContent value="conversions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tassi di Conversione</CardTitle>
              <CardDescription>Completamento delle azioni principali</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.conversions}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'dataMax']} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => [`${value}`, '']} />
                  <Legend />
                  <Bar 
                    dataKey="completato" 
                    name="Completato"
                    stackId="a" 
                    fill="#82ca9d"
                  />
                  <Bar 
                    dataKey="abbandonato" 
                    name="Abbandonato"
                    stackId="a" 
                    fill="#ff8042"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsStatsDashboard; 