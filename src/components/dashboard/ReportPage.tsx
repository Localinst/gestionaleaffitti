import React, { useState, useEffect } from "react";
import { ReportFilterComponent, ReportFilters } from "./ReportFilterComponent";
import { AppLayout, PageHeader, Grid } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, DollarSign, Download, CalendarDays, PieChart, TrendingUp, LineChart } from "lucide-react";
import { addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
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
import IncomeChart from "./IncomeChart";

// Interfaccia per i dati finanziari
interface FinancialData {
  date: string;
  income: number;
  expenses: number;
  net: number;
  // Aggiunta la chiave di ordinamento per garantire l'ordinamento corretto
  sortKey?: string;
}

// Aggiungiamo un helper per convertire nomi di mesi italiani in numeri di mese
const italianMonthsMap: {[key: string]: number} = {
  'gen': 0, 'gennaio': 0,
  'feb': 1, 'febbraio': 1,
  'mar': 2, 'marzo': 2,
  'apr': 3, 'aprile': 3,
  'mag': 4, 'maggio': 4,
  'giu': 5, 'giugno': 5,
  'lug': 6, 'luglio': 6,
  'ago': 7, 'agosto': 7,
  'set': 8, 'settembre': 8,
  'ott': 9, 'ottobre': 9,
  'nov': 10, 'novembre': 10,
  'dic': 11, 'dicembre': 11
};

// Helper function per parsare date in vari formati, inclusi quelli con mesi italiani
function parseDate(dateString: string): Date | null {
  try {
    // Se è già in formato ISO o standard, usiamo il costruttore Date direttamente
    if (dateString.includes('-') || dateString.includes('/')) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Prova a parsare formati come "Gen 2023" o "Gennaio 2023"
    const parts = dateString.trim().split(/\s+/);
    if (parts.length >= 2) {
      const monthStr = parts[0].toLowerCase();
      const year = parseInt(parts[1]);
      
      if (!isNaN(year)) {
        // Cerca il mese nella mappa italiana
        const monthIndex = italianMonthsMap[monthStr];
        
        if (monthIndex !== undefined) {
          const date = new Date(year, monthIndex, 1);
          return date;
        } else {
          // Prova come nome di mese in inglese
          const date = new Date(`${parts[0]} 1, ${year}`);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }
    
    // Se tutte le altre opzioni falliscono, prova il costruttore Date standard
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Helper function to ensure we have data for each month in the range
function ensureMonthlyData(data: any[], startDate: Date, endDate: Date) {
  console.log("ensureMonthlyData - input data:", JSON.stringify(data, null, 2));
  
  if (!data || !Array.isArray(data)) {
    console.warn("ensureMonthlyData - dati non validi:", data);
    return [];
  }
  
  // Calcola il numero di mesi tra startDate e endDate
  const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth()) + 1;
                   
  // Se l'intervallo è troppo grande (più di 36 mesi), limita a 36 mesi più recenti
  if (monthDiff > 36) {
    console.warn(`Intervallo di ${monthDiff} mesi troppo grande, limitato a 36 mesi recenti`);
    startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 35);
    startDate.setDate(1);
  }
  
  // Mappa dei dati esistenti per mese
  const existingDataMap = new Map();
  
  data.forEach(item => {
    console.log("Elaborazione elemento:", item);
    let itemDate;
    try {
      // Se sono presenti month e year separati, li utilizziamo
      if (typeof item.month === 'number' && typeof item.year === 'number') {
        itemDate = new Date(item.year, item.month, 1);
        console.log("Data creata da month/year:", itemDate);
      }
      // Tenta di parsare la data nel formato fornito dall'API
      else if (typeof item.date === 'string') {
        // Usa il nostro helper avanzato per parsare la data
        itemDate = parseDate(item.date);
        console.log("Data parsata da stringa:", itemDate);
        
        if (!itemDate) {
          return; // Salta questo elemento
        }
      } else if (item.date instanceof Date) {
        itemDate = item.date;
      } else {
        console.warn("Formato data non riconosciuto:", item);
        return; // Salta questo elemento
      }
      
      // Usa un formato numerico per la chiave del mese (YYYY-MM) per evitare problemi di localizzazione
      const monthKeyForMapping = format(itemDate, 'yyyy-MM');
      // Mantieni il formato localizzato per la visualizzazione
      const displayDate = format(itemDate, 'MMM yyyy');
      
      // Assicuriamoci di utilizzare i nomi di proprietà corretti per i dati
      // e standardizziamo a 'net' per il valore netto
      const incomeValue = parseFloat(item.income || '0');
      const expensesValue = parseFloat(item.expenses || '0');
      const netValue = typeof item.net !== 'undefined' ? parseFloat(item.net) :
                       typeof item.netIncome !== 'undefined' ? parseFloat(item.netIncome) : 
                       (incomeValue - expensesValue);
      
      console.log("Valori calcolati:", { 
        monthKey: monthKeyForMapping, 
        display: displayDate, 
        income: incomeValue, 
        expenses: expensesValue, 
        net: netValue 
      });
      
      existingDataMap.set(monthKeyForMapping, {
        sortKey: monthKeyForMapping, // Aggiungiamo una chiave per l'ordinamento
        date: displayDate, // Manteniamo il formato localizzato per la visualizzazione
        income: isNaN(incomeValue) ? 0 : incomeValue,
        expenses: isNaN(expensesValue) ? 0 : expensesValue,
        net: isNaN(netValue) ? 0 : netValue
      });
    } catch (error) {
      console.error("Errore nell'elaborazione dell'elemento:", error, item);
    }
  });
  
  // Genera un array di date per i mesi tra startDate e endDate
  const result = [];
  let currentDate = new Date(startDate);
  
  // Assicurati che la data di inizio sia l'inizio del mese
  currentDate.setDate(1);
  
  // Continua fino alla fine del mese di endDate
  const endOfPeriod = new Date(endDate);
  endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
  endOfPeriod.setDate(0);
  
  const monthKeys: string[] = [];
  
  while (currentDate <= endOfPeriod) {
    // Usa un formato numerico per la chiave (YYYY-MM)
    const monthKeyForMapping = format(currentDate, 'yyyy-MM');
    // Formato localizzato per la visualizzazione
    const displayDate = format(currentDate, 'MMM yyyy');
    
    monthKeys.push(monthKeyForMapping);
    
    if (existingDataMap.has(monthKeyForMapping)) {
      // Usa i dati esistenti per questo mese
      result.push(existingDataMap.get(monthKeyForMapping));
    } else {
      // Nessun dato esistente per questo mese
      const today = new Date();
      const isFutureMonth = (
        currentDate.getFullYear() > today.getFullYear() || 
        (currentDate.getFullYear() === today.getFullYear() && 
         currentDate.getMonth() > today.getMonth())
      );
      
      if (isFutureMonth) {
        // Per i mesi futuri, usiamo valori zero invece di valori casuali
        result.push({
          sortKey: monthKeyForMapping, // Chiave per l'ordinamento
          date: displayDate, // Data formattata per la visualizzazione
          income: 0,
          expenses: 0,
          net: 0
        });
      } else {
        // Per i mesi passati senza dati, usiamo zero
        result.push({
          sortKey: monthKeyForMapping, // Chiave per l'ordinamento
          date: displayDate, // Data formattata per la visualizzazione
          income: 0,
          expenses: 0,
          net: 0
        });
      }
    }
    
    // Passa al mese successivo
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // Ordina in base alla chiave di ordinamento numerica
  result.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  
  return result;
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

// Funzione per ottenere il nome del mese in italiano
function getItalianMonthName(monthIndex: number): string {
  const italianMonths = [
    'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 
    'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
  ];
  
  return italianMonths[monthIndex] || '';
}

// Genera dati vuoti invece che dati di esempio
const generateEmptyData = (timeFilter: string, specificYear?: number): FinancialData[] => {
  const date = new Date();
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  
  // Determina il numero di mesi da visualizzare in base al filtro
  const monthCount = timeFilter === "3months" ? 3 : 
                     timeFilter === "6months" ? 6 : 
                     timeFilter === "specific-year" ? 12 : 12;
  
  // Crea un array di dati vuoti con le date corrette
  const emptyData: FinancialData[] = [];
  
  for (let i = 0; i < monthCount; i++) {
    // Calcola la data per questo elemento
    let targetMonth: number;
    let targetYear: number;
    
    if (timeFilter === "specific-year") {
      // Per anno specifico, generiamo tutti i mesi dell'anno selezionato
      targetYear = specificYear || currentYear;
      targetMonth = i; // Da gennaio (0) a dicembre (11)
    } else {
      // Per altre opzioni, generiamo i mesi più recenti
      targetMonth = currentMonth - (monthCount - 1 - i);
      targetYear = currentYear + Math.floor((targetMonth) / 12);
      // Normalizza il mese per gestire valori negativi
      targetMonth = ((targetMonth % 12) + 12) % 12;
    }
    
    const targetDate = new Date(targetYear, targetMonth, 1);
    // Utilizziamo i nomi dei mesi in italiano per essere coerenti con i dati API
    const displayDate = `${getItalianMonthName(targetMonth)} ${targetYear}`;
    const sortKey = format(targetDate, 'yyyy-MM');
    
    // Aggiungi dati vuoti (zero)
    emptyData.push({
      date: displayDate,
      income: 0,
      expenses: 0,
      net: 0,
      sortKey
    });
  }
  
  // Ordina i dati per data
  const sortedData = emptyData.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  
  return sortedData;
};

// Dati di riepilogo vuoti
const EMPTY_SUMMARY_DATA: SummaryData = {
  totalIncome: 0,
  totalExpenses: 0,
  netIncome: 0,
  occupancyRate: 0,
  propertyCount: 0,
  tenantCount: 0,
  avgRent: 0
};

// Dati vuoti per le performance delle proprietà
const EMPTY_PROPERTY_DATA: PropertyPerformanceData[] = [];

export default function ReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    periodType: "month",
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
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
  
  // Stato per verificare se il componente è montato
  const [componentMounted, setComponentMounted] = useState(true);
  
  const [activeTab, setActiveTab] = useState("summary");
  const [exportLoading, setExportLoading] = useState(false);
  
  // Aggiungiamo stati per la gestione dei filtri del grafico
  const [showNet, setShowNet] = useState(false);
  const [timeFilter, setTimeFilter] = useState("year"); // "3months", "6months", "year", "specific-year"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Imposta il componentMounted a true quando il componente viene montato
  // e a false quando viene smontato
  useEffect(() => {
    setComponentMounted(true);
    return () => {
      setComponentMounted(false);
    };
  }, []);
  
  // Carica i dati finanziari
  useEffect(() => {
    async function loadFinancialData() {
      try {
        // Determina il range temporale in base ai filtri del grafico
        let queryStartDate: Date;
        let queryEndDate: Date;
        
        // Determina il range temporale in base ai filtri del grafico
        if (timeFilter === "3months") {
          // Ultimi 3 mesi
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setMonth(queryStartDate.getMonth() - 3);
          queryStartDate.setDate(queryStartDate.getDate() + 1); // Dal giorno dopo per avere esattamente 3 mesi
        } else if (timeFilter === "6months") {
          // Ultimi 6 mesi
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setMonth(queryStartDate.getMonth() - 6);
          queryStartDate.setDate(queryStartDate.getDate() + 1); // Dal giorno dopo per avere esattamente 6 mesi
        } else if (timeFilter === "year") {
          // Ultimo anno (12 mesi incluso quello corrente)
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setMonth(queryStartDate.getMonth() - 12);
          queryStartDate.setDate(queryStartDate.getDate() + 1); // Dal giorno dopo per avere esattamente 12 mesi
        } else if (timeFilter === "specific-year") {
          // Anno specifico (1 gen - 31 dic)
          queryStartDate = new Date(selectedYear, 0, 1);
          queryEndDate = new Date(selectedYear, 11, 31);
        } else if (filters.periodType === "custom" && filters.startDate && filters.endDate) {
          // Use custom dates if provided
          queryStartDate = filters.startDate;
          queryEndDate = filters.endDate;
        } else if (filters.periodType === "all") {
          // Per "tutto il periodo", impostiamo un massimo di 24 mesi invece di andare fino al 2018
          // per evitare problemi di performance
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setMonth(queryStartDate.getMonth() - 24);
          queryStartDate.setDate(1); // Primo giorno del mese
        } else if (filters.periodType === "month") {
          // Per "questo mese", mostra gli ultimi 30 giorni
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - 30);
        } else {
          // Default: ultimi 30 giorni
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - 30);
        }
        
        // Se i dati non sono in cache o sono vecchi, inizia il caricamento
        if (componentMounted) {
          setLoadingFinancial(true);
        }
        
        const queryParams = {
          startDate: format(queryStartDate, "yyyy-MM-dd"),
          endDate: format(queryEndDate, "yyyy-MM-dd"),
          propertyId: filters.propertyId !== "all" ? filters.propertyId : undefined
        };
        
        try {
          // Prima prova a caricare dati reali dall'API
          const rawData = await api.reports.getFinancialData(queryParams);
          if (!componentMounted) return; // Non aggiornare lo stato se il componente è smontato
          
          console.log("Dati finanziari ricevuti dall'API:", rawData);
          
          if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
            console.log("Nessun dato finanziario ricevuto dall'API, mostro dati vuoti");
            // Use empty data with correct date range
            const emptyData = generateEmptyData(timeFilter, selectedYear);
            if (componentMounted) {
              setFinancialData(emptyData);
            }
            return;
          }
          
          // Assicuriamoci che i dati siano nel formato corretto
          const validatedData = rawData.map(item => {
            // Verifico che l'elemento esista e sia un oggetto
            if (!item || typeof item !== 'object') return null;
            
            // Estrai dati dalle proprietà dell'oggetto con validazione
            const income = typeof item.income === 'number' ? item.income : 
                          typeof item.income === 'string' ? parseFloat(item.income) : 0;
            
            const expenses = typeof item.expenses === 'number' ? item.expenses : 
                            typeof item.expenses === 'string' ? parseFloat(item.expenses) : 0;
            
            const net = typeof item.net === 'number' ? item.net : 
                       typeof item.net === 'string' ? parseFloat(item.net) : income - expenses;
            
            // Determina il formato della data
            let date = item.date || '';
            
            // Se abbiamo mese e anno numerici, formattiamo la data
            if (typeof item.month === 'number' && typeof item.year === 'number') {
              date = `${getItalianMonthName(item.month)} ${item.year}`;
            }
            
            // Crea la chiave di ordinamento
            let sortKey = item.sortKey;
            if (!sortKey && typeof item.year === 'number' && typeof item.month === 'number') {
              sortKey = `${item.year}-${String(item.month + 1).padStart(2, '0')}`;
            } else if (!sortKey) {
              // Prova a estrarre da date se è una stringa
              const parsedDate = typeof item.date === 'string' ? parseDate(item.date) : null;
              sortKey = parsedDate ? format(parsedDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
            }
            
            return {
              date,
              month: typeof item.month === 'number' ? item.month : 0,
              year: typeof item.year === 'number' ? item.year : new Date().getFullYear(),
              income: isNaN(income) ? 0 : income,
              expenses: isNaN(expenses) ? 0 : expenses,
              net: isNaN(net) ? 0 : net,
              sortKey
            };
          }).filter(Boolean);
          
          // Se dopo la validazione non abbiamo dati, mostriamo dati vuoti
          if (!validatedData || validatedData.length === 0) {
            console.log("Dati finanziari non validi dopo la validazione, mostro dati vuoti");
            const emptyData = generateEmptyData(timeFilter, selectedYear);
            if (componentMounted) {
              setFinancialData(emptyData);
            }
            return;
          }
          
          // Ensure we have data for each month in the range
          const completeData = ensureMonthlyData(
            validatedData, 
            queryStartDate, 
            queryEndDate
          );
          
          console.log("Dati finanziari completi dopo la validazione:", completeData);
          
          // Ordina i dati per data
          completeData.sort((a, b) => {
            if (a.sortKey && b.sortKey) {
              return a.sortKey.localeCompare(b.sortKey);
            }
            return 0;
          });
          
          if (componentMounted) {
            setFinancialData(completeData);
          }
        } catch (apiError) {
          console.error("Errore API durante il caricamento dei dati finanziari:", apiError);
          // Use empty data with correct date range
          const emptyData = generateEmptyData(timeFilter, selectedYear);
          if (componentMounted) {
            setFinancialData(emptyData);
            
            toast({
              title: "Errore di connessione",
              description: "Impossibile caricare i dati finanziari. Verifica la connessione al database.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Errore generale durante il caricamento dei dati:', error);
        // Carica dati vuoti in caso di errore generale
        const emptyData = generateEmptyData(timeFilter, selectedYear);
        if (componentMounted) {
          setFinancialData(emptyData);
        }
      } finally {
        if (componentMounted) {
          setLoadingFinancial(false);
        }
      }
    }
    
    loadFinancialData();
  }, [timeFilter, selectedYear, filters.periodType, filters.startDate, filters.endDate, filters.propertyId, componentMounted]);
  
  // Carica i dati di riepilogo
  useEffect(() => {
    async function loadSummaryData() {
      try {
        setLoadingSummary(true);
        
        // Use the same date logic as in loadFinancialData
        let queryStartDate = filters.startDate;
        let queryEndDate = filters.endDate;
        
        // Verifica che ci siano date valide all'inizio
        if (!queryStartDate || !queryEndDate) {
          // Se non ci sono date valide, imposta un periodo predefinito (ultimi 30 giorni)
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - 30); // Ultimi 30 giorni invece dell'intero mese
        } else if (filters.periodType === "all") {
          // Anche qui, per "tutto il periodo" limitiamo a 24 mesi per evitare problemi
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setMonth(queryStartDate.getMonth() - 24);
          queryStartDate.setDate(1); // Primo giorno del mese
        } else if (filters.periodType === "month") {
          // Se il filtro è "questo mese", impostiamo gli ultimi 30 giorni
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - 30);
        }
        
        const queryParams = {
          startDate: queryStartDate ? format(queryStartDate, "yyyy-MM-dd") : undefined,
          endDate: queryEndDate ? format(queryEndDate, "yyyy-MM-dd") : undefined,
          propertyId: filters.propertyId !== "all" ? filters.propertyId : undefined
        };
        
        try {
          // Prima prova a caricare dati reali
          const rawData = await api.reports.getSummary(queryParams);
          
          if (!rawData) {
            console.log("Nessun dato di riepilogo ricevuto dall'API, mostro dati vuoti");
            setSummaryData(EMPTY_SUMMARY_DATA);
            return;
          }
          
          // Validazione e normalizzazione dei dati ricevuti
          const validatedData: SummaryData = {
            totalIncome: typeof rawData.totalIncome === 'number' ? rawData.totalIncome : 
                         typeof rawData.totalIncome === 'string' ? parseFloat(rawData.totalIncome) : 0,
                         
            totalExpenses: typeof rawData.totalExpenses === 'number' ? rawData.totalExpenses : 
                          typeof rawData.totalExpenses === 'string' ? parseFloat(rawData.totalExpenses) : 0,
                          
            netIncome: typeof rawData.netIncome === 'number' ? rawData.netIncome : 
                      typeof rawData.netIncome === 'string' ? parseFloat(rawData.netIncome) : 
                      (typeof rawData.totalIncome === 'number' && typeof rawData.totalExpenses === 'number') ? 
                      rawData.totalIncome - rawData.totalExpenses : 0,
                      
            occupancyRate: typeof rawData.occupancyRate === 'number' ? rawData.occupancyRate : 
                          typeof rawData.occupancyRate === 'string' ? parseFloat(rawData.occupancyRate) : 0,
                          
            propertyCount: typeof rawData.propertyCount === 'number' ? rawData.propertyCount : 
                          typeof rawData.propertyCount === 'string' ? parseInt(rawData.propertyCount, 10) : 0,
                          
            tenantCount: typeof rawData.tenantCount === 'number' ? rawData.tenantCount : 
                        typeof rawData.tenantCount === 'string' ? parseInt(rawData.tenantCount, 10) : 0,
                        
            avgRent: typeof rawData.avgRent === 'number' ? rawData.avgRent : 
                    typeof rawData.avgRent === 'string' ? parseFloat(rawData.avgRent) : 0
          };
          
          // Verifica che non ci siano valori NaN o undefined dopo la conversione
          Object.keys(validatedData).forEach(key => {
            if (isNaN(validatedData[key as keyof SummaryData]) || validatedData[key as keyof SummaryData] === undefined) {
              validatedData[key as keyof SummaryData] = 0;
            }
          });
          
          console.log("Dati di riepilogo validati:", validatedData);
          setSummaryData(validatedData);
        } catch (apiError) {
          console.error("Errore API durante il caricamento dei dati di riepilogo:", apiError);
          setSummaryData(EMPTY_SUMMARY_DATA);
          
          toast({
            title: "Errore di connessione",
            description: "Impossibile caricare i dati di riepilogo. Verifica la connessione al database.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Errore generale durante il caricamento dei dati di riepilogo:", error);
        setSummaryData(EMPTY_SUMMARY_DATA);
      } finally {
        setLoadingSummary(false);
      }
    }

    loadSummaryData();
  }, [filters.periodType, filters.propertyId, filters.startDate?.getTime(), filters.endDate?.getTime()]);
  
  // Carica i dati delle proprietà
  useEffect(() => {
    async function loadPropertyData() {
      try {
        setLoadingProperty(true);
        
        // Use the same date logic as in loadFinancialData
        let queryStartDate = filters.startDate;
        let queryEndDate = filters.endDate;
        
        // Verifica che ci siano date valide all'inizio
        if (!queryStartDate || !queryEndDate) {
          // Se non ci sono date valide, imposta un periodo predefinito (ultimi 30 giorni)
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - 30); // Ultimi 30 giorni invece dell'intero mese
        } else if (filters.periodType === "all") {
          // Anche qui, per "tutto il periodo" limitiamo a 24 mesi per evitare problemi
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setMonth(queryStartDate.getMonth() - 24);
          queryStartDate.setDate(1); // Primo giorno del mese
        } else if (filters.periodType === "month") {
          // Se il filtro è "questo mese", impostiamo gli ultimi 30 giorni
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - 30);
        }
        
        const queryParams = {
          startDate: queryStartDate ? format(queryStartDate, "yyyy-MM-dd") : undefined,
          endDate: queryEndDate ? format(queryEndDate, "yyyy-MM-dd") : undefined,
          propertyId: filters.propertyId !== "all" ? filters.propertyId : undefined
        };
        
        try {
          // Prima prova a caricare dati reali dall'API
          const rawData = await api.reports.getPropertyPerformance(queryParams);
          
          if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
            console.log("Nessun dato valido di proprietà ricevuto dall'API, mostro dati vuoti");
            setPropertyData(EMPTY_PROPERTY_DATA);
            return;
          }
          
          // Validazione e normalizzazione dei dati ricevuti
          const validatedData: PropertyPerformanceData[] = rawData.map(item => {
            // Verifica che item sia un oggetto
            if (!item || typeof item !== 'object') {
              return null;
            }
            
            const validItem: PropertyPerformanceData = {
              propertyId: item.propertyId?.toString() || '',
              propertyName: item.propertyName?.toString() || 'Proprietà sconosciuta',
              income: typeof item.income === 'number' ? item.income : 
                    typeof item.income === 'string' ? parseFloat(item.income) : 0,
              expenses: typeof item.expenses === 'number' ? item.expenses : 
                      typeof item.expenses === 'string' ? parseFloat(item.expenses) : 0,
              occupancyRate: typeof item.occupancyRate === 'number' ? item.occupancyRate : 
                           typeof item.occupancyRate === 'string' ? parseFloat(item.occupancyRate) : 0
            };
            
            // Verifica che non ci siano valori NaN dopo la conversione
            if (isNaN(validItem.income)) validItem.income = 0;
            if (isNaN(validItem.expenses)) validItem.expenses = 0;
            if (isNaN(validItem.occupancyRate)) validItem.occupancyRate = 0;
            
            return validItem;
          }).filter(Boolean) as PropertyPerformanceData[];
          
          if (validatedData.length === 0) {
            console.log("Nessun dato valido di proprietà dopo la validazione, mostro dati vuoti");
            setPropertyData(EMPTY_PROPERTY_DATA);
            return;
          }
          
          console.log("Dati delle proprietà validati:", validatedData);
          setPropertyData(validatedData);
        } catch (apiError) {
          console.error("Errore API durante il caricamento dei dati delle proprietà:", apiError);
          setPropertyData(EMPTY_PROPERTY_DATA);
          
          toast({
            title: "Errore di connessione",
            description: "Impossibile caricare i dati delle proprietà. Verifica la connessione al database.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Errore generale durante il caricamento dei dati delle proprietà:", error);
        setPropertyData(EMPTY_PROPERTY_DATA);
      } finally {
        setLoadingProperty(false);
      }
    }

    loadPropertyData();
  }, [filters.periodType, filters.propertyId, filters.startDate?.getTime(), filters.endDate?.getTime()]);
  
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
    if (loadingFinancial) {
      return <IncomeChart isLoading={true} />;
    }
    
    // Dichiariamo formattedData prima di usarla
    let formattedData = financialData;
    console.log("ReportPage - finanial data originale:", financialData);
    
    if (!financialData || !Array.isArray(financialData) || financialData.length === 0) {
      console.log("ReportPage - generando dati vuoti");
      formattedData = generateEmptyData(timeFilter, selectedYear);
      console.log("ReportPage - dati vuoti generati:", formattedData);
      
      // Imposta i dati vuoti nello stato
      if (formattedData && formattedData.length > 0 && componentMounted) {
        setFinancialData(formattedData);
      }
    }
    
    // Assicuriamoci che i dati abbiano il formato corretto
    console.log("ReportPage - formattedData prima della validazione:", formattedData);
    
    // Utilizziamo formattedData invece di financialData
    const validData = Array.isArray(formattedData) ? formattedData.map(item => {
      if (!item) return null;
      
      const validItem = {
        ...item,
        income: typeof item.income === 'number' ? item.income : 
                typeof item.income === 'string' ? parseFloat(item.income) : 0,
        expenses: typeof item.expenses === 'number' ? item.expenses : 
                  typeof item.expenses === 'string' ? parseFloat(item.expenses) : 0,
        // Assicuriamoci che il valore "net" sia calcolato correttamente se non esiste
        net: typeof item.net === 'number' ? item.net : 
             typeof item.net === 'string' ? parseFloat(item.net) :
             typeof item.income === 'number' && typeof item.expenses === 'number' ? 
              item.income - item.expenses : 0,
        // Se la sortKey non esiste, creane una dalla data usando la nostra funzione parseDate
        sortKey: item.sortKey || (() => {
          // Usiamo parseDate per gestire correttamente i nomi dei mesi in italiano
          const parsedDate = typeof item.date === 'string' ? parseDate(item.date) : null;
          return parsedDate ? format(parsedDate, 'yyyy-MM') : format(new Date(), 'yyyy-MM');
        })()
      };
      
      // Previeni valori NaN
      if (isNaN(validItem.income)) validItem.income = 0;
      if (isNaN(validItem.expenses)) validItem.expenses = 0;
      if (isNaN(validItem.net)) validItem.net = 0;
      
      return validItem;
    }).filter(Boolean) : [];
    
    console.log("ReportPage - validData dopo la validazione:", validData);
    
    // Ordiniamo i dati in base alla chiave di ordinamento
    const sortedData = [...validData].sort((a, b) => {
      if (a.sortKey && b.sortKey) {
        return a.sortKey.localeCompare(b.sortKey);
      }
      return 0;
    });
    
    console.log("ReportPage - sortedData dopo l'ordinamento:", sortedData);
    
    // Limita il numero di elementi visualizzati in base al filtro temporale
    const limitedData = timeFilter === "3months" ? sortedData.slice(-3) :
                        timeFilter === "6months" ? sortedData.slice(-6) :
                        timeFilter === "specific-year" ? sortedData :
                        sortedData.slice(-12);
    
    console.log("ReportPage - limitedData da passare al grafico:", limitedData);
    
    // Ottieni gli anni disponibili per il selettore (se necessario)
    const availableYears = Array.from(
      new Set(
        formattedData  // Utilizziamo formattedData invece di financialData
          .map(item => {
            if (typeof item.date === 'string') {
              // Assumiamo che il formato sia "MMM YYYY"
              const parts = item.date.split(' ');
              if (parts.length >= 2) {
                return parseInt(parts[1]);
              }
            }
            return new Date().getFullYear();
          })
          .filter(year => !isNaN(year))
      )
    ).sort((a, b) => b - a); // Ordine decrescente
    
    if (availableYears.length === 0) {
      // Se non ci sono anni disponibili, usa l'anno corrente
      availableYears.push(new Date().getFullYear());
    }
    
    // Otteniamo il titolo in base al filtro temporale selezionato
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
      <Card className="col-span-12">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
            <div>
              <CardTitle>Andamento Finanziario</CardTitle>
              <CardDescription>
                Visualizzazione dettagliata di entrate, uscite e margine netto
              </CardDescription>
            </div>
            
            {/* Filtri temporali */}
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
          {(!componentMounted || (formattedData.length > 0 && formattedData.every(item => item.income === 0 && item.expenses === 0))) ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center">
              <LineChart className="h-16 w-16 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground">Nessun dato disponibile per il periodo selezionato</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Seleziona un altro periodo o verifica la connessione al database
              </p>
            </div>
          ) : (
            <IncomeChart
              data={limitedData}
              isLoading={loadingFinancial}
              showNetByDefault={showNet}
              onRefresh={() => {
                if (componentMounted) {
                  setFinancialData([]);
                  setLoadingFinancial(true);
                  setTimeout(() => {
                    if (componentMounted) {
                      setLoadingFinancial(false);
                    }
                  }, 500);
                }
              }}
            />
          )}
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
      setTimeout(() => {
        if (!summaryData) {
          setSummaryData(EMPTY_SUMMARY_DATA);
        }
      }, 100);
      
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
              <p>Caricamento dei dati di riepilogo in corso...</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Verifica se tutti i valori sono zero
    const allZero = Object.values(summaryData).every(val => val === 0);
    
    if (allZero) {
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
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun dato disponibile per il periodo selezionato</p>
              <p className="text-sm mt-2">Seleziona un altro periodo o verifica la connessione al database</p>
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
    
    if (!propertyData || propertyData.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Performance per Proprietà
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun dato disponibile per le proprietà nel periodo selezionato</p>
              <p className="text-sm mt-2">Seleziona un altro periodo o verifica la connessione al database</p>
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
        <CardContent className="p-0">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[650px] p-4">
              <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground border-b pb-2">
                <div className="col-span-4">Proprietà</div>
                <div className="col-span-2 text-right">Entrate</div>
                <div className="col-span-2 text-right">Uscite</div>
                <div className="col-span-2 text-right">Netto</div>
                <div className="col-span-2 text-right">Occ.</div>
              </div>
              
              {propertyData.map((property) => (
                <div key={property.propertyId} className="grid grid-cols-12 text-sm py-2 border-b last:border-0">
                  <div className="col-span-4 font-medium">{property.propertyName}</div>
                  <div className="col-span-2 text-right text-green-600">€{property.income.toLocaleString()}</div>
                  <div className="col-span-2 text-right text-red-500">€{property.expenses.toLocaleString()}</div>
                  <div className="col-span-2 text-right font-medium">€{(property.income - property.expenses).toLocaleString()}</div>
                  <div className="col-span-2 text-right">{property.occupancyRate}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center items-center py-2 text-muted-foreground text-xs">
            <span>👈 Scorri lateralmente per vedere tutti i dati 👉</span>
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
