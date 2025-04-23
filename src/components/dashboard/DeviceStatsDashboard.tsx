import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, Laptop, MonitorSmartphone, Users, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

// Interfaccia per i dati del dispositivo
interface DeviceData {
  browser: string;
  deviceType: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  timestamp: number;
  userAgent: string;
}

// Colori per i grafici
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

/**
 * Recupera dati reali sui dispositivi dal localStorage
 */
const getRealDeviceData = (): DeviceData[] | null => {
  const savedData = localStorage.getItem('device_sessions');
  let deviceData: DeviceData[] = [];
  
  if (savedData) {
    try {
      deviceData = JSON.parse(savedData);
    } catch (e) {
      console.error("Errore nel parsing dei dati dei dispositivi:", e);
      return null;
    }
  }
  
  // Se non ci sono dati precedenti, salva almeno la sessione corrente
  if (deviceData.length === 0) {
    const currentSession = saveCurrentSession();
    deviceData = currentSession ? [currentSession] : [];
  }
  
  return deviceData.length > 0 ? deviceData : null;
};

/**
 * Salva i dati della sessione corrente
 */
const saveCurrentSession = (): DeviceData | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const ua = navigator.userAgent;
  const currentSession: DeviceData = {
    browser: detectBrowser(ua),
    deviceType: detectDeviceType(ua),
    os: detectOS(ua),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timestamp: Date.now(),
    userAgent: ua
  };
  
  const savedData = localStorage.getItem('device_sessions');
  let deviceData: DeviceData[] = [];
  
  if (savedData) {
    try {
      deviceData = JSON.parse(savedData);
    } catch (e) {
      console.error("Errore nel parsing dei dati dei dispositivi:", e);
    }
  }
  
  // Aggiungi la sessione corrente se non è già presente una sessione simile nell'ultima ora
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const hasSimilarRecentSession = deviceData.some(session => 
    session.browser === currentSession.browser && 
    session.deviceType === currentSession.deviceType &&
    session.os === currentSession.os &&
    session.screenWidth === currentSession.screenWidth &&
    session.timestamp > oneHourAgo
  );
  
  if (!hasSimilarRecentSession) {
    deviceData.push(currentSession);
    localStorage.setItem('device_sessions', JSON.stringify(deviceData));
  }
  
  return currentSession;
};

/**
 * Rileva il browser in base allo user agent
 */
function detectBrowser(userAgent: string): string {
  userAgent = userAgent.toLowerCase();
  
  if (userAgent.indexOf("edge") > -1 || userAgent.indexOf("edg/") > -1) {
    return "Edge";
  } else if (userAgent.indexOf("chrome") > -1 && userAgent.indexOf("safari") > -1) {
    return "Chrome";
  } else if (userAgent.indexOf("firefox") > -1) {
    return "Firefox";
  } else if (userAgent.indexOf("safari") > -1 && userAgent.indexOf("chrome") === -1) {
    return "Safari";
  } else if (userAgent.indexOf("opera") > -1 || userAgent.indexOf("opr/") > -1) {
    return "Opera";
  } else if (userAgent.indexOf("msie") > -1 || userAgent.indexOf("trident") > -1) {
    return "Internet Explorer";
  } else {
    return "Altro";
  }
}

/**
 * Rileva il tipo di dispositivo in base allo user agent
 */
function detectDeviceType(userAgent: string): string {
  userAgent = userAgent.toLowerCase();
  
  if (userAgent.match(/ipad/i) || userAgent.match(/tablet/i)) {
    return "Tablet";
  } else if (userAgent.match(/mobile|iphone|ipod|android|blackberry/i)) {
    return "Mobile";
  } else {
    return "Desktop";
  }
}

/**
 * Rileva il sistema operativo in base allo user agent
 */
function detectOS(userAgent: string): string {
  userAgent = userAgent.toLowerCase();
  
  if (userAgent.indexOf("win") > -1) {
    return "Windows";
  } else if (userAgent.indexOf("mac") > -1) {
    return "MacOS";
  } else if (userAgent.indexOf("linux") > -1) {
    return "Linux";
  } else if (userAgent.indexOf("android") > -1) {
    return "Android";
  } else if (userAgent.indexOf("ios") > -1 || userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipad") > -1) {
    return "iOS";
  } else {
    return "Altro";
  }
}

/**
 * Conta i browser presenti nei dati
 */
function countBrowsers(deviceData: DeviceData[]): {name: string, value: number}[] {
  const browserCounts: Record<string, number> = {};
  
  deviceData.forEach(session => {
    browserCounts[session.browser] = (browserCounts[session.browser] || 0) + 1;
  });
  
  return Object.entries(browserCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Conta i tipi di dispositivo presenti nei dati
 */
function countDevices(deviceData: DeviceData[]): {name: string, value: number}[] {
  const deviceCounts: Record<string, number> = {};
  
  deviceData.forEach(session => {
    deviceCounts[session.deviceType] = (deviceCounts[session.deviceType] || 0) + 1;
  });
  
  return Object.entries(deviceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Conta le dimensioni dello schermo presenti nei dati
 */
function countScreenSizes(deviceData: DeviceData[]): {name: string, value: number}[] {
  const screenSizes: Record<string, number> = {};
  
  deviceData.forEach(session => {
    // Arrotonda le dimensioni per raggruppare simili
    const roundedWidth = Math.round(session.screenWidth / 100) * 100;
    const screenSize = `${roundedWidth}x${Math.round(session.screenHeight / 100) * 100}`;
    screenSizes[screenSize] = (screenSizes[screenSize] || 0) + 1;
  });
  
  return Object.entries(screenSizes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Limita a 10 dimensioni più comuni
}

/**
 * Conta i sistemi operativi presenti nei dati
 */
function countOperatingSystems(deviceData: DeviceData[]): {name: string, value: number}[] {
  const osCounts: Record<string, number> = {};
  
  deviceData.forEach(session => {
    osCounts[session.os] = (osCounts[session.os] || 0) + 1;
  });
  
  return Object.entries(osCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calcola le percentuali da un array di conteggi
 */
function calculatePercentages(data: {name: string, value: number}[]): {name: string, value: number, percent: number}[] {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return data.map(item => ({
    ...item,
    percent: Math.round((item.value / total) * 100)
  }));
}

/**
 * Genera dati di trend per i dispositivi negli ultimi 14 giorni
 */
function generateDeviceTrends(deviceData: DeviceData[]): {date: string, desktop: number, mobile: number, tablet: number}[] {
  const result = [];
  const now = new Date();
  
  // Crea date per gli ultimi 14 giorni
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();
    
    // Filtra sessioni per questo giorno
    const sessionsThisDay = deviceData.filter(session => 
      session.timestamp >= dayStart && session.timestamp <= dayEnd
    );
    
    // Conta dispositivi per tipo
    const desktopCount = sessionsThisDay.filter(s => s.deviceType === 'Desktop').length;
    const mobileCount = sessionsThisDay.filter(s => s.deviceType === 'Mobile').length;
    const tabletCount = sessionsThisDay.filter(s => s.deviceType === 'Tablet').length;
    
    result.push({
      date: dateString,
      desktop: desktopCount,
      mobile: mobileCount,
      tablet: tabletCount
    });
  }
  
  return result;
}

/**
 * Genera dati di sessioni per ora del giorno
 */
function generateSessionsByHour(deviceData: DeviceData[]): {hour: string, sessions: number}[] {
  const hourCounts: Record<number, number> = {};
  
  // Inizializza tutti i conteggi a 0
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0;
  }
  
  // Conta sessioni per ora
  deviceData.forEach(session => {
    const date = new Date(session.timestamp);
    const hour = date.getHours();
    hourCounts[hour] += 1;
  });
  
  // Converti in array per il grafico
  return Object.entries(hourCounts).map(([hour, count]) => ({
    hour: `${hour.padStart(2, '0')}:00`,
    sessions: count
  }));
}

const DeviceStatsDashboard = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Recupera i dati dei dispositivi
    const fetchData = () => {
      setLoading(true);
      
      // Salva la sessione corrente
      saveCurrentSession();
      
      // Ottieni tutti i dati dei dispositivi
      const data = getRealDeviceData();
      
      if (data) {
        // Filtra i dati in base all'intervallo di tempo selezionato
        const filteredData = filterDataByTimeRange(data, timeRange);
        setDeviceData(filteredData);
        setNoData(filteredData.length === 0);
      } else {
        setDeviceData([]);
        setNoData(true);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [timeRange]);
  
  /**
   * Filtra i dati in base all'intervallo di tempo
   */
  const filterDataByTimeRange = (data: DeviceData[], range: string): DeviceData[] => {
    const now = Date.now();
    let cutoffTime: number;
    
    switch (range) {
      case "7d":
        cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        cutoffTime = now - (90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
    }
    
    return data.filter(session => session.timestamp >= cutoffTime);
  };
  
  // Elabora i dati per i grafici
  const browserShare = calculatePercentages(countBrowsers(deviceData));
  const deviceTypeShare = calculatePercentages(countDevices(deviceData));
  const screenSizes = countScreenSizes(deviceData);
  const osDistribution = calculatePercentages(countOperatingSystems(deviceData));
  const deviceTrends = generateDeviceTrends(deviceData);
  const sessionsByHour = generateSessionsByHour(deviceData);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Caricamento statistiche dispositivi...</span>
      </div>
    );
  }
  
  // Se non ci sono dati dopo il filtro di tempo, mostra messaggio
  if (noData || deviceData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg font-medium mb-4">Nessun dato sui dispositivi disponibile</p>
        <p className="text-sm text-muted-foreground mb-4">Naviga nel sito per raccogliere dati sui dispositivi</p>
        <Button onClick={() => window.location.reload()}>Aggiorna pagina</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Statistiche Dispositivi</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
            <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
            <SelectItem value="90d">Ultimi 90 giorni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tipo di Dispositivo</CardTitle>
            <CardDescription>Distribuzione per tipo di dispositivo</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceTypeShare}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceTypeShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistema Operativo</CardTitle>
            <CardDescription>Distribuzione per sistema operativo</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={osDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {osDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Browser</CardTitle>
          <CardDescription>Distribuzione per browser</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={browserShare}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => [value, 'Sessioni']} />
              <Legend />
              <Bar dataKey="value" name="Sessioni" fill="#8884d8">
                {browserShare.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dimensioni Schermo</CardTitle>
          <CardDescription>Risoluzione più comuni</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={screenSizes}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Dispositivi']} />
              <Legend />
              <Bar dataKey="value" name="Dispositivi" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="trends">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trends">Trend Dispositivi</TabsTrigger>
          <TabsTrigger value="hours">Sessioni per Ora</TabsTrigger>
        </TabsList>
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Trend Dispositivi</CardTitle>
              <CardDescription>Utilizzo per tipo di dispositivo negli ultimi 14 giorni</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={deviceTrends}
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
                    formatter={(value) => [value, 'Sessioni']}
                    labelFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="desktop" name="Desktop" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="mobile" name="Mobile" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="tablet" name="Tablet" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Sessioni per Ora</CardTitle>
              <CardDescription>Distribuzione del traffico per ora del giorno</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sessionsByHour}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Sessioni']} />
                  <Legend />
                  <Line type="monotone" dataKey="sessions" name="Sessioni" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeviceStatsDashboard; 