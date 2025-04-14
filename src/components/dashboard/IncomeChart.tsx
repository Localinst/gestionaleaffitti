import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Toggle } from "@/components/ui/toggle";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/utils";

export interface FinancialData {
  date: string;
  income: number;
  expenses: number;
  netIncome?: number;
  net?: number; // Supporta entrambi i nomi per retrocompatibilità
  sortKey?: string; // Aggiungiamo la proprietà sortKey per compatibilità con ReportPage
  // Campi aggiuntivi che possono essere presenti nei dati dall'API
  month?: number;
  year?: number;
}

interface IncomeChartProps {
  data?: FinancialData[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  onRefresh?: () => void;
  showNetByDefault?: boolean; // Proprietà per impostare la modalità di visualizzazione iniziale
}

export default function IncomeChart({ 
  data = [], 
  isLoading = false, 
  title = "Andamento Entrate e Uscite", 
  description = "Visualizzazione mensile delle entrate e uscite",
  onRefresh,
  showNetByDefault = false
}: IncomeChartProps) {
  const [showGross, setShowGross] = useState(!showNetByDefault);
  const [showNet, setShowNet] = useState(true);
  const [showExpenses, setShowExpenses] = useState(!showNetByDefault);
  const [isMobile, setIsMobile] = useState(false);
  
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  
  // Aggiorniamo lo stato isMobile quando cambia la dimensione dello schermo
  useEffect(() => {
    setIsMobile(isSmallScreen);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSmallScreen]);
  
  // Log dei dati ricevuti
  useEffect(() => {
    console.log("IncomeChart - dati ricevuti:", data);
  }, [data]);
  
  // Normalizza i dati per gestire sia netIncome che net
  const normalizedData = React.useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("IncomeChart: Nessun dato disponibile");
      return [];
    }
    
    console.log("IncomeChart - normalizzazione dati:", data);
    
    const processedData = data.map(item => {
      if (!item) return null;
      
      console.log("Elemento da elaborare:", item);

      // Costruisci il nome del mese completo se necessario
      let displayDate = item.date;
      if (typeof item.month === 'number' && typeof item.year === 'number') {
        // Se abbiamo month e year separati, usiamoli per formattare correttamente
        const month = item.month;
        const year = item.year;
        displayDate = `${item.date} ${year}`;
      }
      
      // Converti e controlla le proprietà numeriche
      const incomeValue = typeof item.income === 'string' ? parseFloat(item.income) : item.income;
      const expensesValue = typeof item.expenses === 'string' ? parseFloat(item.expenses) : item.expenses;
      const netValue = typeof item.net === 'string' ? parseFloat(item.net) : 
                      item.net !== undefined ? item.net : 
                      typeof item.netIncome === 'string' ? parseFloat(item.netIncome) : 
                      item.netIncome !== undefined ? item.netIncome : 
                      (incomeValue - expensesValue);
      
      // Controllo valori NaN o undefined - log dettagliato
      if (isNaN(incomeValue)) {
        console.warn("Income NaN o undefined:", item, item.income);
      }
      if (isNaN(expensesValue)) {
        console.warn("Expenses NaN o undefined:", item, item.expenses);
      }
      if (isNaN(netValue)) {
        console.warn("Net NaN o undefined:", item, item.net);
      }
      
      return {
        date: displayDate || "Data sconosciuta",
        income: isNaN(incomeValue) ? 0 : incomeValue,
        expenses: isNaN(expensesValue) ? 0 : expensesValue,
        net: isNaN(netValue) ? 0 : netValue,
        sortKey: item.sortKey || ""
      };
    }).filter(Boolean); // Rimuovi gli elementi nulli
    
    console.log("IncomeChart - dati normalizzati:", processedData);
    
    return processedData;
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento dati finanziari...</p>
        </div>
      </div>
    );
  }
  
  if (!normalizedData || normalizedData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Nessun dato finanziario disponibile per il periodo selezionato.</p>
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              Ricarica
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={normalizedData}
            margin={{
              top: 20,
              right: 30,
              left: isMobile ? 0 : 20,
              bottom: 20,
            }}
          >
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={(value) => isMobile ? value.substring(0, 3) : value}
              interval={isMobile ? 1 : 0}
            />
            <YAxis 
              tickFormatter={(value) => {
                const num = Number(value);
                if (isNaN(num)) return "€0";
                return `€${Math.abs(num) >= 1000 ? (Math.abs(num) / 1000).toFixed(0) + 'k' : num}`
              }}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 40 : 60}
            />
            <Tooltip 
              formatter={(value: number) => {
                if (isNaN(value)) return ["€0", undefined];
                return [`€${Number(value).toLocaleString('it-IT')}`, undefined];
              }}
              labelFormatter={(label) => `Periodo: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            {showGross && (
              <Bar 
                dataKey="income" 
                name="Entrate" 
                fill="url(#colorIncome)" 
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            )}
            {showExpenses && (
              <Bar 
                dataKey="expenses" 
                name="Uscite" 
                fill="url(#colorExpenses)" 
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            )}
            {showNet && (
              <Line 
                type="monotone"
                dataKey="net" 
                name="Profitto"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center mt-4 space-x-2">
        <Toggle
          pressed={showGross}
          onPressedChange={setShowGross}
          size="sm"
          variant={showGross ? "default" : "outline"}
          className={`text-xs md:text-sm ${showGross ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
        >
          Entrate
        </Toggle>
        <Toggle
          pressed={showExpenses}
          onPressedChange={setShowExpenses}
          size="sm"
          variant={showExpenses ? "default" : "outline"}
          className={`text-xs md:text-sm ${showExpenses ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
        >
          Uscite
        </Toggle>
        <Toggle
          pressed={showNet}
          onPressedChange={setShowNet}
          size="sm"
          variant={showNet ? "default" : "outline"}
          className={`text-xs md:text-sm ${showNet ? 'bg-green-600 text-white hover:bg-green-700' : ''}`}
        >
          Netto
        </Toggle>
      </div>
    </div>
  );
} 