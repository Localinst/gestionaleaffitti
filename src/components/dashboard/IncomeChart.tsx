import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Toggle } from "@/components/ui/toggle";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/utils";

export interface FinancialData {
  date: string;
  income: number;
  expenses: number;
  netIncome?: number;
  net?: number; // Supporta entrambi i nomi per retrocompatibilità
}

interface IncomeChartProps {
  data?: FinancialData[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  onRefresh?: () => void;
}

export default function IncomeChart({ 
  data = [], 
  isLoading = false, 
  title = "Andamento Entrate e Uscite", 
  description = "Visualizzazione mensile delle entrate e uscite",
  onRefresh
}: IncomeChartProps) {
  const [showGross, setShowGross] = useState(true);
  const [showNet, setShowNet] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
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
  
  // Normalizza i dati per gestire sia netIncome che net
  const normalizedData = React.useMemo(() => {
    if (!data || data.length === 0) {
      console.log("IncomeChart: Nessun dato disponibile");
      return [];
    }
    
    return data.map(item => ({
      date: item.date,
      income: Number(item.income) || 0,
      expenses: Number(item.expenses) || 0,
      net: Number(item.netIncome || item.net) || (Number(item.income || 0) - Number(item.expenses || 0))
    }));
  }, [data]);
  
  console.log("IncomeChart - dati normalizzati:", normalizedData);
  
  if (isLoading) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento dati finanziari...</p>
        </div>
      </Card>
    );
  }
  
  if (!normalizedData || normalizedData.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
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
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <Toggle
            pressed={showGross}
            onPressedChange={setShowGross}
            size="sm"
            variant={showGross ? "default" : "outline"}
            className={`text-xs md:text-sm ${showGross ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
          >
            Lordo
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
          <Toggle
            pressed={showExpenses}
            onPressedChange={setShowExpenses}
            size="sm"
            variant={showExpenses ? "default" : "outline"}
            className={`text-xs md:text-sm ${showExpenses ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
          >
            Spese
          </Toggle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={normalizedData}
              margin={{
                top: 20,
                right: 30,
                left: isMobile ? 0 : 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickFormatter={(value) => isMobile ? value.substring(0, 3) : value}
                interval={isMobile ? 1 : 0}
              />
              <YAxis 
                tickFormatter={(value) => `€${Math.abs(value) >= 1000 ? (Math.abs(value) / 1000).toFixed(0) + 'k' : value}`}
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 40 : 60}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)} 
                labelFormatter={(label) => `Periodo: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              {showGross && (
                <Bar 
                  dataKey="income" 
                  name="Entrate" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              )}
              {showExpenses && (
                <Bar 
                  dataKey="expenses" 
                  name="Uscite" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                />
              )}
              {showNet && (
                <Bar 
                  dataKey="net" 
                  name="Profitto" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 