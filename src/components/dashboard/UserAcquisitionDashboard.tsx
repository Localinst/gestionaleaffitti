import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight, Percent } from "lucide-react";

// Interfaccia per i dati di acquisizione utenti
interface AcquisitionData {
  userGrowth: {
    date: string;
    users: number;
    newUsers: number;
  }[];
  acquisitionChannels: {
    name: string;
    value: number;
  }[];
  conversionRates: {
    stage: string;
    rate: number;
    count: number;
  }[];
  registrationsByDay: {
    name: string;
    value: number;
  }[];
  monthlyRetention: {
    month: string;
    rate: number;
  }[];
}

// Funzione per recuperare dati reali di acquisizione utenti
const getRealAcquisitionData = (): AcquisitionData | null => {
  // Recupera i dati utente e le sessioni dal localStorage
  const usersDataString = localStorage.getItem("users");
  const sessionsDataString = localStorage.getItem("user_sessions");
  const subscriptionsDataString = localStorage.getItem("subscriptions");
  
  let users = [];
  let sessions = [];
  let subscriptions = [];
  
  try {
    if (usersDataString) {
      users = JSON.parse(usersDataString);
    }
    if (sessionsDataString) {
      sessions = JSON.parse(sessionsDataString);
    }
    if (subscriptionsDataString) {
      subscriptions = JSON.parse(subscriptionsDataString);
    }
  } catch (e) {
    console.warn("Errore nel parsing dei dati:", e);
    return null;
  }
  
  // Se non ci sono dati utente reali, verifica se abbiamo l'utente corrente
  if (users.length === 0) {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (currentUser && currentUser.id) {
        users = [currentUser];
      }
    } catch (e) {
      console.warn("Errore nel parsing dell'utente corrente:", e);
    }
  }
  
  // Verifica se ci sono abbastanza dati per generare statistiche reali
  if (users.length === 0 && sessions.length === 0) {
    return null; // Non ci sono dati sufficienti
  }
  
  // Calcola dati di crescita utenti negli ultimi 30 giorni
  const userGrowth = calculateUserGrowth(users, 30);
  
  // Calcola i canali di acquisizione
  const acquisitionChannels = calculateAcquisitionChannels(users, sessions);
  
  // Calcola tassi di conversione
  const conversionRates = calculateConversionRates(users, sessions, subscriptions);
  
  // Calcola registrazioni per giorno della settimana
  const registrationsByDay = calculateRegistrationsByDay(users);
  
  // Calcola retention mensile
  const monthlyRetention = calculateMonthlyRetention(users, sessions, subscriptions);
  
  // Compila tutti i dati in un oggetto strutturato
  const acquisitionData: AcquisitionData = {
    userGrowth,
    acquisitionChannels,
    conversionRates,
    registrationsByDay,
    monthlyRetention
  };
  
  return acquisitionData;
};

// Funzione per calcolare la crescita degli utenti negli ultimi N giorni
function calculateUserGrowth(users: any[], days: number): { date: string, users: number, newUsers: number }[] {
  const result = [];
  const now = new Date();
  
  // Crea un oggetto per tracciare il numero cumulativo di utenti per data
  const usersByDate: Record<string, { total: number, new: number }> = {};
  
  // Inizializza con tutte le date degli ultimi N giorni
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    usersByDate[dateString] = { total: 0, new: 0 };
  }
  
  // Conta gli utenti per ogni data
  users.forEach(user => {
    if (user.createdAt) {
      const createdDate = new Date(user.createdAt).toISOString().split('T')[0];
      
      // Conta nuovi utenti per ogni data
      if (createdDate in usersByDate) {
        usersByDate[createdDate].new += 1;
      }
      
      // Conta utenti totali per ogni data (cumulativo)
      Object.keys(usersByDate).forEach(date => {
        if (date >= createdDate) {
          usersByDate[date].total += 1;
        }
      });
    }
  });
  
  // Converti in array per il grafico
  return Object.entries(usersByDate).map(([date, data]) => ({
    date,
    users: data.total,
    newUsers: data.new
  }));
}

// Funzione per calcolare i canali di acquisizione
function calculateAcquisitionChannels(users: any[], sessions: any[]): { name: string, value: number }[] {
  const channels: Record<string, number> = {
    "Ricerca Organica": 0,
    "Social Media": 0,
    "Email": 0,
    "Referral": 0,
    "Diretto": 0,
    "Altro": 0
  };
  
  // Se abbiamo sessioni con dati di referrer
  sessions.forEach(session => {
    if (session.referrer) {
      if (session.referrer.includes("google") || session.referrer.includes("bing") || session.referrer.includes("yahoo")) {
        channels["Ricerca Organica"]++;
      } else if (session.referrer.includes("facebook") || session.referrer.includes("instagram") || session.referrer.includes("twitter") || session.referrer.includes("linkedin")) {
        channels["Social Media"]++;
      } else if (session.referrer.includes("mail") || session.referrer.includes("outlook") || session.referrer.includes("gmail")) {
        channels["Email"]++;
      } else if (session.referrer !== "") {
        channels["Referral"]++;
      } else {
        channels["Diretto"]++;
      }
    } else {
      channels["Diretto"]++;
    }
  });
  
  // Converti in array e ordina per valore
  return Object.entries(channels)
    .map(([name, value]) => ({ name, value }))
    .filter(channel => channel.value > 0)
    .sort((a, b) => b.value - a.value);
}

// Funzione per calcolare i tassi di conversione
function calculateConversionRates(users: any[], sessions: any[], subscriptions: any[]): { stage: string, rate: number, count: number }[] {
  // Definisci gli stage della pipeline di conversione
  const stages = [
    { name: "Visite", count: 0 },
    { name: "Registrazioni", count: 0 },
    { name: "Attivazioni", count: 0 },
    { name: "Abbonamenti", count: 0 }
  ];
  
  // Conta le visite (sessioni)
  stages[0].count = sessions.length || 0;
  
  // Conta registrazioni (utenti)
  stages[1].count = users.length || 0;
  
  // Conta attivazioni (utenti che hanno completato l'onboarding)
  stages[2].count = users.filter(user => user.onboardingCompleted || user.lastLogin).length || 0;
  
  // Conta abbonamenti
  stages[3].count = subscriptions.filter(sub => sub.status === "active").length || 0;
  
  // Calcola i tassi relativi allo stage precedente
  const results = stages.map((stage, index) => {
    let rate = 0;
    if (index > 0 && stages[index - 1].count > 0) {
      rate = (stage.count / stages[index - 1].count) * 100;
    } else if (index === 0) {
      rate = 100;
    }
    
    return {
      stage: stage.name,
      count: stage.count,
      rate: Math.round(rate)
    };
  });
  
  return results;
}

// Funzione per calcolare le registrazioni per giorno della settimana
function calculateRegistrationsByDay(users: any[]): { name: string, value: number }[] {
  const daysOfWeek = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  const registrationsCount = new Array(7).fill(0);
  
  // Conta registrazioni per giorno della settimana
  users.forEach(user => {
    if (user.createdAt) {
      const dayOfWeek = new Date(user.createdAt).getDay();
      registrationsCount[dayOfWeek]++;
    }
  });
  
  // Converti in array per il grafico
  return daysOfWeek.map((day, index) => ({
    name: day,
    value: registrationsCount[index]
  }));
}

// Funzione per calcolare la retention mensile
function calculateMonthlyRetention(users: any[], sessions: any[], subscriptions: any[]): { month: string, rate: number }[] {
  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  const currentMonth = new Date().getMonth();
  const result = [];
  
  // Calcola retention per gli ultimi 6 mesi
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    
    // Calcola utenti registrati in questo mese
    const registeredThisMonth = users.filter(user => {
      if (!user.createdAt) return false;
      const registrationDate = new Date(user.createdAt);
      return registrationDate.getMonth() === monthIndex;
    }).length;
    
    // Calcola utenti attivi in questo mese
    const activeThisMonth = users.filter(user => {
      if (!user.lastLogin) return false;
      const lastLoginDate = new Date(user.lastLogin);
      return lastLoginDate.getMonth() === monthIndex;
    }).length;
    
    // Calcola tasso di retention
    let retentionRate = 0;
    if (registeredThisMonth > 0) {
      retentionRate = Math.min(100, Math.round((activeThisMonth / registeredThisMonth) * 100));
    }
    
    result.push({ month: monthName, rate: retentionRate });
  }
  
  return result;
}

// Colori per i grafici
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const UserAcquisitionDashboard = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [acquisitionData, setAcquisitionData] = useState<AcquisitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Ottieni dati reali di acquisizione
        const data = getRealAcquisitionData();
        setAcquisitionData(data);
        setNoData(!data);
      } catch (error) {
        console.error("Errore nel recupero dei dati di acquisizione:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare i dati di acquisizione utenti",
          variant: "destructive"
        });
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, toast]);

  // Formatta percentuale
  const formatPercent = (value) => `${value}%`;

  // Calcola la variazione di utenti
  const getUserGrowthRate = () => {
    if (!acquisitionData || !acquisitionData.userGrowth || acquisitionData.userGrowth.length < 2) return 0;
    
    const current = acquisitionData.userGrowth[acquisitionData.userGrowth.length - 1].users;
    const previous = acquisitionData.userGrowth[0].users;
    
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Caricamento statistiche acquisizione...</span>
      </div>
    );
  }

  if (noData || !acquisitionData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg font-medium mb-4">Nessun dato di acquisizione utenti disponibile</p>
        <p className="text-sm text-muted-foreground mb-4">Questo può essere dovuto a mancanza di utenti registrati o sessioni tracciate</p>
        <Button onClick={() => window.location.reload()}>Aggiorna pagina</Button>
      </div>
    );
  }

  // Calcola alcuni indicatori di sintesi
  const userGrowthRate = getUserGrowthRate();
  const lastTotalUsers = acquisitionData.userGrowth[acquisitionData.userGrowth.length - 1].users;
  const lastNewUsers = acquisitionData.userGrowth[acquisitionData.userGrowth.length - 1].newUsers;
  const conversionToSubscription = acquisitionData.conversionRates.find(item => item.stage === "Abbonamenti")?.rate || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Acquisizione Utenti</h2>
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

      {/* Statistiche di riepilogo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Utenti Totali
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastTotalUsers}</div>
            <div className="flex items-center pt-1">
              {userGrowthRate > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={userGrowthRate > 0 ? "text-green-500" : "text-red-500"}>
                {userGrowthRate}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                vs periodo precedente
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Nuovi Utenti
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastNewUsers}</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-muted-foreground">
                nell'ultimo giorno
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Conversione Abbonamento
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(conversionToSubscription)}</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-muted-foreground">
                delle registrazioni
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Canale Principale
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {acquisitionData.acquisitionChannels.length > 0 ? acquisitionData.acquisitionChannels[0].name : "N/A"}
            </div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-muted-foreground">
                {acquisitionData.acquisitionChannels.length > 0 
                  ? `${Math.round((acquisitionData.acquisitionChannels[0].value / acquisitionData.acquisitionChannels.reduce((sum, item) => sum + item.value, 0)) * 100)}% del totale` 
                  : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="channels">Canali</TabsTrigger>
          <TabsTrigger value="conversion">Conversione</TabsTrigger>
        </TabsList>
        
        {/* Tab Panoramica */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crescita Utenti</CardTitle>
              <CardDescription>Utenti totali e nuovi utenti nel periodo</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={acquisitionData.userGrowth}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(value) => [value, ""]}
                    labelFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Utenti Totali"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="Nuovi Utenti"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorNewUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Registrazioni per Giorno</CardTitle>
                <CardDescription>Distribuzione delle registrazioni</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={acquisitionData.registrationsByDay}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Utenti']} />
                    <Bar 
                      dataKey="value" 
                      name="Registrazioni" 
                      fill="#8884d8" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Mensile</CardTitle>
                <CardDescription>Tasso di retention negli ultimi 6 mesi</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={acquisitionData.monthlyRetention}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Retention']} />
                    <Bar 
                      dataKey="rate" 
                      name="Retention" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab Canali */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Canali di Acquisizione</CardTitle>
              <CardDescription>Come gli utenti arrivano alla piattaforma</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={acquisitionData.acquisitionChannels}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {acquisitionData.acquisitionChannels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, name]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Conversione */}
        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline di Conversione</CardTitle>
              <CardDescription>Tassi di conversione tra le fasi</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={acquisitionData.conversionRates}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Tasso']} />
                  <Legend />
                  <Bar 
                    dataKey="rate" 
                    name="Tasso di conversione" 
                    fill="#8884d8" 
                    label={{ position: 'right', formatter: (value) => `${value}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Dettaglio Conversioni</h3>
            <ul className="space-y-2">
              {acquisitionData.conversionRates.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.stage}</span>
                  <span className="font-medium">{item.count} utenti</span>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserAcquisitionDashboard; 