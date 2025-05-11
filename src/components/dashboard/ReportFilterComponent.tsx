import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, subDays, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, FilterIcon, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// Tipi di periodo predefiniti
type PeriodType = "week" | "month" | "year" | "all" | "custom";

// Interfaccia per la proprietà
interface Property {
  id: string;
  name: string;
}

// Interfaccia per i filtri del report
export interface ReportFilters {
  periodType: PeriodType;
  startDate: Date | null;
  endDate: Date | null;
  propertyId: string | "all";
}

interface ReportFilterComponentProps {
  onFiltersChange: (filters: ReportFilters) => void;
}

export function ReportFilterComponent({ onFiltersChange }: ReportFilterComponentProps) {
  // Stato per i filtri
  const [filters, setFilters] = useState<ReportFilters>({
    periodType: "month",
    startDate: subDays(new Date(), 30), // Ultimi 30 giorni invece dell'intero mese
    endDate: new Date(), // Data corrente
    propertyId: "all"
  });

  // Stato per la lista delle proprietà
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: filters.startDate || undefined,
    to: filters.endDate || undefined
  });

  // Carica le proprietà all'avvio
  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        const response = await api.properties.getAll();
        setProperties(response);
      } catch (error) {
        console.error("Errore nel caricamento delle proprietà:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  // Aggiorna i filtri e notifica il componente genitore
  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Gestisci il cambio di periodo
  const handlePeriodChange = (period: PeriodType) => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();

    switch (period) {
      case "week":
        startDate = startOfWeek(now, { locale: it });
        endDate = endOfWeek(now, { locale: it });
        break;
      case "month":
        // Mostro gli ultimi 30 giorni invece dell'intero mese
        endDate = now; // Data corrente
        startDate = subDays(now, 30); // 30 giorni indietro
        break;
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case "all":
        // Imposta la data di inizio a 24 mesi fa e la data di fine a oggi
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 24);
        startDate.setDate(1); // Primo giorno del mese
        endDate = now; // Data corrente
        break;
      case "custom":
        // Mantieni le date correnti o imposta un intervallo predefinito
        if (!filters.startDate || !filters.endDate) {
          startDate = subMonths(now, 1);
          endDate = now;
        } else {
          startDate = filters.startDate;
          endDate = filters.endDate;
        }
        setDateDialogOpen(true);
        break;
    }

    updateFilters({ 
      periodType: period, 
      startDate, 
      endDate 
    });

    if (period === "custom") {
      setDateRange({
        from: startDate || undefined,
        to: endDate || undefined
      });
    }
  };

  // Formatta l'etichetta del periodo corrente
  const formatPeriodLabel = () => {
    if (filters.periodType === "all") return "Ultimi 24 mesi";
    if (filters.periodType === "custom" && filters.startDate && filters.endDate) {
      return `${format(filters.startDate, "dd/MM/yyyy")} - ${format(filters.endDate, "dd/MM/yyyy")}`;
    }
    
    const labels = {
      week: "Questa settimana",
      month: "Ultimi 30 giorni",
      year: "Quest'anno",
    };
    
    return labels[filters.periodType] || "Periodo personalizzato";
  };

  // Conferma la selezione di date personalizzate
  const confirmCustomDateRange = () => {
    if (dateRange.from && dateRange.to) {
      updateFilters({
        startDate: dateRange.from,
        endDate: dateRange.to
      });
    }
    setDateDialogOpen(false);
  };

  // Formatta il nome della proprietà
  const getPropertyName = () => {
    if (filters.propertyId === "all") return "Tutte le proprietà";
    const property = properties.find(p => p.id === filters.propertyId);
    return property ? property.name : "Proprietà non trovata";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Filtri Report</CardTitle>
        <CardDescription>
          Seleziona periodo e proprietà per generare il report
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro per periodo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Periodo</label>
            <div className="flex space-x-2">
              <Select
                value={filters.periodType}
                onValueChange={(value: PeriodType) => handlePeriodChange(value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleziona periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Questa settimana</SelectItem>
                  <SelectItem value="month">Questo mese</SelectItem>
                  <SelectItem value="year">Quest'anno</SelectItem>
                  <SelectItem value="all">Ultimi 24 mesi</SelectItem>
                  <SelectItem value="custom">Personalizzato</SelectItem>
                </SelectContent>
              </Select>

              {filters.periodType === "custom" && (
                <Button
                  variant="outline"
                  className="px-3"
                  onClick={() => setDateDialogOpen(true)}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Seleziona date
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatPeriodLabel()}
            </div>
          </div>

          {/* Filtro per proprietà */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Proprietà</label>
            <Select
              value={filters.propertyId}
              onValueChange={(value) => updateFilters({ propertyId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona proprietà" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le proprietà</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {getPropertyName()}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-3">
        <div className="text-sm text-muted-foreground">
          <FilterIcon className="h-4 w-4 inline-block mr-1" />
          {filters.startDate && filters.endDate
            ? `Dati dal ${format(filters.startDate, "dd/MM/yyyy")} al ${format(filters.endDate, "dd/MM/yyyy")}`
            : "Tutti i dati disponibili"}
          {filters.propertyId !== "all" && ` per ${getPropertyName()}`}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            handlePeriodChange("month");
            updateFilters({ propertyId: "all" });
          }}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Reimposta
        </Button>
      </CardFooter>

      {/* Dialog per la selezione di date personalizzate */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleziona intervallo date</DialogTitle>
            <DialogDescription>
              Scegli le date di inizio e fine per il report
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange as any}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              className="rounded-md border mx-auto"
            />
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setDateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={confirmCustomDateRange}>
              Conferma
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 