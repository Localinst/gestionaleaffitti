import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { tourismApi } from '@/services/tourism-api';
import { Booking, SeasonalRate } from '@/types/tourism';

interface AvailabilityCalendarProps {
  propertyId: string;
}

export function AvailabilityCalendar({ propertyId }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rates, setRates] = useState<SeasonalRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calcola le date solo quando currentDate cambia, non ad ogni rendering
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(addMonths(currentDate, 2)); // Mostra 3 mesi
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    // Funzione separata per il fetch dei dati
    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        // Calcola le date di inizio e fine all'interno della funzione
        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(addMonths(currentDate, 2)), 'yyyy-MM-dd');
        
        const data = await tourismApi.bookings.getAvailability(
          propertyId,
          start,
          end
        );
        
        setBookings(data.bookings || []);
        setRates(data.rates || []);
      } catch (error) {
        console.error('Errore nel caricamento della disponibilità:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
    // Dipendenze ridotte: solo propertyId e currentDate
  }, [propertyId, currentDate]);

  const previousMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, -1));
  };

  const nextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const isDateBooked = (date: Date) => {
    return bookings.some(booking => {
      const checkIn = parseISO(booking.check_in_date as string);
      const checkOut = parseISO(booking.check_out_date as string);
      return isWithinInterval(date, { start: checkIn, end: checkOut }) ||
        isSameDay(date, checkIn) ||
        isSameDay(date, checkOut);
    });
  };

  const getDateRate = (date: Date): number | null => {
    for (const rate of rates) {
      const startDate = parseISO(rate.start_date as string);
      const endDate = parseISO(rate.end_date as string);
      if (isWithinInterval(date, { start: startDate, end: endDate })) {
        // Applica tariffa weekend se disponibile e il giorno è sabato o domenica
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        if (isWeekend && rate.weekend_rate) {
          return rate.weekend_rate;
        }
        return rate.daily_rate;
      }
    }
    return null;
  };

  const getDayColor = (date: Date) => {
    if (isDateBooked(date)) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        bookingStatus: 'Occupato'
      };
    }
    
    const rate = getDateRate(date);
    if (rate) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        bookingStatus: 'Disponibile',
        rate: `€${rate}`
      };
    }
    
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      bookingStatus: 'Nessuna tariffa'
    };
  };

  // Raggruppa i giorni per mese
  const monthGroups = days.reduce((acc, day) => {
    const monthYear = format(day, 'MMMM yyyy', { locale: it });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(day);
    return acc;
  }, {} as Record<string, Date[]>);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Caricamento calendario...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Calendario Disponibilità</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.entries(monthGroups).map(([monthYear, daysInMonth]) => (
          <div key={monthYear} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 text-center font-medium">
              {monthYear}
            </div>
            <div className="grid grid-cols-7 text-center text-xs">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                <div key={day} className="p-2 border-b font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {/* Aggiungi celle vuote per allineare il primo giorno del mese */}
              {Array.from({ length: new Date(daysInMonth[0]).getDay() || 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 h-12"></div>
              ))}
              
              {daysInMonth.map(day => {
                const { bg, text, bookingStatus, rate } = getDayColor(day);
                return (
                  <div 
                    key={day.toString()} 
                    className={`p-1 border text-center ${bg} cursor-pointer hover:opacity-75 transition-opacity`}
                    title={`${format(day, 'dd/MM/yyyy')} - ${bookingStatus}${rate ? ` - ${rate}` : ''}`}
                  >
                    <div className={`text-sm font-medium ${text}`}>
                      {format(day, 'd')}
                    </div>
                    {rate && (
                      <div className="text-xs leading-tight mt-0.5">
                        {rate}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-sm mt-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-red-100 mr-2"></div>
          <span>Occupato</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-100 mr-2"></div>
          <span>Disponibile con tariffa</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-100 mr-2"></div>
          <span>Nessuna tariffa impostata</span>
        </div>
      </div>
    </div>
  );
} 