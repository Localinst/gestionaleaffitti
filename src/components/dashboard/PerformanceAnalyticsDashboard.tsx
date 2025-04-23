import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Interfaccia per i dati di prestazione
interface PerformanceData {
  timestamp: number;
  pageLoadTime: number;
  resourceLoadTime: number;
  serverResponseTime: number;
  firstPaint: number;
  domInteractive: number;
  url: string;
}

/**
 * Recupera dati reali sulle prestazioni dal localStorage
 */
const getRealPerformanceData = () => {
  // Recupera dati di performance dal localStorage o dal Performance API
  const performanceEntries = [];
  
  // Usa l'API Performance se disponibile nel browser
  if (typeof window !== 'undefined' && window.performance) {
    const navEntries = window.performance.getEntriesByType('navigation');
    const resourceEntries = window.performance.getEntriesByType('resource');
    
    if (navEntries && navEntries.length > 0) {
      performanceEntries.push(...navEntries);
    }
    
    if (resourceEntries && resourceEntries.length > 0) {
      performanceEntries.push(...resourceEntries);
    }
  }
  
  // Recupera i dati di performance salvati
  const savedPerformanceString = localStorage.getItem("performance_entries");
  if (savedPerformanceString) {
    try {
      const savedEntries = JSON.parse(savedPerformanceString);
      performanceEntries.push(...savedEntries);
    } catch (e) {
      console.warn("Errore nel parsing dei dati di performance salvati:", e);
    }
  }
  
  // Se non ci sono dati sufficienti, restituisci null
  if (performanceEntries.length === 0) {
    return null;
  }
  
  // Calcola le metriche di performance
  const metrics = calculateAverageMetrics(performanceEntries);
  
  // Genera trend di performance
  const performanceTrend = generatePerformanceTrend(performanceEntries, 30);
  
  // Trova le pagine più lente
  const slowestPages = findSlowestPages(performanceEntries);
  
  // Distribuzione dei tempi di caricamento
  const loadTimeDistribution = generateLoadTimeDistribution(performanceEntries);
  
  // Compila tutti i dati in un oggetto strutturato
  const performanceData = {
    metrics,
    performanceTrend,
    slowestPages,
    loadTimeDistribution,
    rawEntries: performanceEntries
  };
  
  return performanceData;
};

/**
 * Salva i dati di prestazione della pagina corrente
 */
const saveCurrentPerformance = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }
  
  try {
    // Ottieni le entry di performance attuali
    const navEntries = window.performance.getEntriesByType('navigation');
    const resourceEntries = window.performance.getEntriesByType('resource');
    
    // Combina le entry esistenti con quelle nuove
    const savedPerformanceString = localStorage.getItem("performance_entries");
    let existingEntries = [];
    
    if (savedPerformanceString) {
      existingEntries = JSON.parse(savedPerformanceString);
    }
    
    // Aggiungi timestamp alle nuove entry
    const timestamp = new Date().getTime();
    const newNavEntries = navEntries.map(entry => ({ 
      ...entry.toJSON(), 
      timestamp 
    }));
    
    const newResourceEntries = resourceEntries.map(entry => ({ 
      ...entry.toJSON(), 
      timestamp 
    }));
    
    // Unisci tutte le entry
    const allEntries = [
      ...existingEntries, 
      ...newNavEntries, 
      ...newResourceEntries
    ];
    
    // Limita a 1000 entry per non occupare troppo spazio
    const limitedEntries = allEntries.slice(-1000);
    
    // Salva nel localStorage
    localStorage.setItem("performance_entries", JSON.stringify(limitedEntries));
    
    // Pulisci le entry attuali per la prossima misurazione
    window.performance.clearResourceTimings();
    
    return limitedEntries;
  } catch (e) {
    console.error("Errore nel salvataggio dei dati di performance:", e);
    return null;
  }
};

/**
 * Calcola le prestazioni medie dalle metriche
 */
function calculateAverageMetrics(data: PerformanceData[]): { 
  avgLoadTime: number, 
  avgServerResponse: number, 
  avgFirstPaint: number,
  avgResourceLoad: number,
  avgDomInteractive: number
} {
  if (data.length === 0) {
    return {
      avgLoadTime: 0,
      avgServerResponse: 0,
      avgFirstPaint: 0,
      avgResourceLoad: 0,
      avgDomInteractive: 0
    };
  }
  
  const sum = data.reduce((acc, curr) => {
    return {
      avgLoadTime: acc.avgLoadTime + curr.pageLoadTime,
      avgServerResponse: acc.avgServerResponse + curr.serverResponseTime,
      avgFirstPaint: acc.avgFirstPaint + curr.firstPaint,
      avgResourceLoad: acc.avgResourceLoad + curr.resourceLoadTime,
      avgDomInteractive: acc.avgDomInteractive + curr.domInteractive
    };
  }, {
    avgLoadTime: 0,
    avgServerResponse: 0,
    avgFirstPaint: 0,
    avgResourceLoad: 0,
    avgDomInteractive: 0
  });
  
  return {
    avgLoadTime: Math.round(sum.avgLoadTime / data.length),
    avgServerResponse: Math.round(sum.avgServerResponse / data.length),
    avgFirstPaint: Math.round(sum.avgFirstPaint / data.length),
    avgResourceLoad: Math.round(sum.avgResourceLoad / data.length),
    avgDomInteractive: Math.round(sum.avgDomInteractive / data.length)
  };
}

/**
 * Genera dati di trend per le prestazioni negli ultimi giorni
 */
function generatePerformanceTrend(performanceData: PerformanceData[], days: number = 7): {
  date: string, 
  pageLoad: number, 
  resourceLoad: number,
  serverResponse: number
}[] {
  const result = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();
    
    // Filtra metriche per questo giorno
    const metricsThisDay = performanceData.filter(metric => 
      metric.timestamp >= dayStart && metric.timestamp <= dayEnd
    );
    
    // Calcola medie per questo giorno
    let pageLoadAvg = 0;
    let resourceLoadAvg = 0;
    let serverResponseAvg = 0;
    
    if (metricsThisDay.length > 0) {
      pageLoadAvg = metricsThisDay.reduce((sum, metric) => sum + metric.pageLoadTime, 0) / metricsThisDay.length;
      resourceLoadAvg = metricsThisDay.reduce((sum, metric) => sum + metric.resourceLoadTime, 0) / metricsThisDay.length;
      serverResponseAvg = metricsThisDay.reduce((sum, metric) => sum + metric.serverResponseTime, 0) / metricsThisDay.length;
    }
    
    result.push({
      date: dateString,
      pageLoad: Math.round(pageLoadAvg),
      resourceLoad: Math.round(resourceLoadAvg),
      serverResponse: Math.round(serverResponseAvg)
    });
  }
  
  return result;
}

/**
 * Trova le pagine più lente in base al tempo di caricamento
 */
function findSlowestPages(performanceData: PerformanceData[], limit: number = 5): {
  url: string,
  pageLoadTime: number,
  resourceLoadTime: number,
  serverResponseTime: number
}[] {
  // Raggruppa per URL e calcola la media dei tempi
  const urlPerformance: Record<string, {
    pageLoadTotal: number,
    resourceLoadTotal: number,
    serverResponseTotal: number,
    count: number
  }> = {};
  
  performanceData.forEach(metric => {
    if (!urlPerformance[metric.url]) {
      urlPerformance[metric.url] = {
        pageLoadTotal: 0,
        resourceLoadTotal: 0,
        serverResponseTotal: 0,
        count: 0
      };
    }
    
    urlPerformance[metric.url].pageLoadTotal += metric.pageLoadTime;
    urlPerformance[metric.url].resourceLoadTotal += metric.resourceLoadTime;
    urlPerformance[metric.url].serverResponseTotal += metric.serverResponseTime;
    urlPerformance[metric.url].count += 1;
  });
  
  // Converti in array con medie
  const urlAverages = Object.entries(urlPerformance).map(([url, totals]) => ({
    url,
    pageLoadTime: Math.round(totals.pageLoadTotal / totals.count),
    resourceLoadTime: Math.round(totals.resourceLoadTotal / totals.count),
    serverResponseTime: Math.round(totals.serverResponseTotal / totals.count)
  }));
  
  // Ordina per tempo di caricamento e prendi i primi 'limit'
  return urlAverages
    .sort((a, b) => b.pageLoadTime - a.pageLoadTime)
    .slice(0, limit);
}

/**
 * Genera dati di distribuzione dei tempi di caricamento
 */
function generateLoadTimeDistribution(performanceData: PerformanceData[]): {
  range: string,
  count: number
}[] {
  const ranges = [
    { min: 0, max: 500, label: '0-500ms' },
    { min: 500, max: 1000, label: '500-1000ms' },
    { min: 1000, max: 2000, label: '1-2s' },
    { min: 2000, max: 3000, label: '2-3s' },
    { min: 3000, max: 5000, label: '3-5s' },
    { min: 5000, max: Infinity, label: '>5s' }
  ];
  
  const distribution = ranges.map(range => ({
    range: range.label,
    count: performanceData.filter(metric => 
      metric.pageLoadTime >= range.min && metric.pageLoadTime < range.max
    ).length
  }));
  
  return distribution;
}

const PerformanceAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Salva i dati di performance attuali
    saveCurrentPerformance();
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Ottieni dati reali di performance
        const data = getRealPerformanceData();
        setPerformanceData(data);
        setNoData(!data);
      } catch (error) {
        console.error("Errore nel recupero dei dati di performance:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati di performance",
          variant: "destructive"
        });
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Aggiungi event listener per salvare i dati quando l'utente lascia la pagina
    window.addEventListener('beforeunload', saveCurrentPerformance);
    
    return () => {
      window.removeEventListener('beforeunload', saveCurrentPerformance);
    };
  }, [timeRange, toast]);
  
  /**
   * Filtra i dati in base all'intervallo di tempo
   */
  const filterDataByTimeRange = (data: PerformanceData[], range: string): PerformanceData[] => {
    const now = Date.now();
    let cutoffTime: number;
    
    switch (range) {
      case "1d":
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case "7d":
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
    }
    
    return data.filter(metric => metric.timestamp >= cutoffTime);
  };
  
  // Elabora i dati per i grafici
  const averageMetrics = calculateAverageMetrics(performanceData?.rawEntries || []);
  const performanceTrend = generatePerformanceTrend(performanceData?.rawEntries || [], timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : 30);
  const slowestPages = findSlowestPages(performanceData?.rawEntries || [], 5);
  const loadTimeDistribution = generateLoadTimeDistribution(performanceData?.rawEntries || []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Caricamento statistiche prestazioni...</span>
      </div>
    );
  }
  
  // Se non ci sono dati dopo il filtro di tempo, mostra messaggio
  if (noData || !performanceData || performanceData.rawEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg font-medium mb-4">Nessun dato di performance disponibile</p>
        <p className="text-sm text-muted-foreground mb-4">Naviga nel sito per raccogliere dati di performance</p>
        <Button onClick={() => window.location.reload()}>Aggiorna pagina</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Prestazioni</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Ultime 24 ore</SelectItem>
            <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
            <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo medio caricamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageMetrics.avgLoadTime} ms
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo di caricamento pagina completo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risposta server</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageMetrics.avgServerResponse} ms
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo di risposta medio del server
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">First Paint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageMetrics.avgFirstPaint} ms
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo al primo rendering
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trend Prestazioni</CardTitle>
          <CardDescription>Tempi di caricamento nell'intervallo selezionato</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceTrend}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
                formatter={(value) => [`${value} ms`, ""]}
                labelFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="pageLoad" name="Caricamento Pagina" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="resourceLoad" name="Caricamento Risorse" stroke="#82ca9d" />
              <Line type="monotone" dataKey="serverResponse" name="Risposta Server" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="slowest">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="slowest">Pagine più Lente</TabsTrigger>
          <TabsTrigger value="distribution">Distribuzione Tempi</TabsTrigger>
        </TabsList>
        <TabsContent value="slowest">
          <Card>
            <CardHeader>
              <CardTitle>Pagine più Lente</CardTitle>
              <CardDescription>Tempi medi di caricamento per URL</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={slowestPages}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'dataMax']} />
                  <YAxis 
                    dataKey="url" 
                    type="category" 
                    width={80}
                    tickFormatter={(value) => {
                      // Tronca URL lunghi
                      return value.length > 15 ? `...${value.slice(-15)}` : value;
                    }}
                  />
                  <Tooltip formatter={(value) => [`${value} ms`, ""]} />
                  <Legend />
                  <Bar dataKey="pageLoadTime" name="Tempo Caricamento" fill="#8884d8" />
                  <Bar dataKey="serverResponseTime" name="Risposta Server" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribuzione Tempi di Caricamento</CardTitle>
              <CardDescription>Numero di pagine per fascia di tempo</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={loadTimeDistribution}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Pagine']} />
                  <Legend />
                  <Area type="monotone" dataKey="count" name="Numero Pagine" fill="#8884d8" stroke="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceAnalyticsDashboard; 