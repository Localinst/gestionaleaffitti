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
  const endDate = endOfMonth(currentDate); // Mostra 1 mese invece di 3
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    // Funzione separata per il fetch dei dati
    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        // Calcola le date di inizio e fine all'interno della funzione
        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
        
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
      
      // Se è un blocco date, includi anche il giorno di checkout
      if (booking.guest_name === 'Blocco date') {
        // Per blocchi di un singolo giorno, controlla solo se la data è uguale al check-in
        // (la data di check-out sarà il giorno successivo al check-in)
        if ((checkOut.getTime() - checkIn.getTime()) <= 86400000) {  // 86400000 ms = 1 giorno
          return isSameDay(date, checkIn);
        }
        
        // Per blocchi multi-giorno, includi sia check-in che check-out
        return isWithinInterval(date, { start: checkIn, end: checkOut }) ||
          isSameDay(date, checkIn);
      }
      
      // Se è una prenotazione reale, non includere il giorno di checkout
      return isWithinInterval(date, { start: checkIn, end: checkOut }) && !isSameDay(date, checkOut);
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

  // Aggiungi una funzione per determinare se è il primo o l'ultimo giorno di una prenotazione
  const getBookingEdgeType = (date: Date) => {
    let isStart = false;
    let isEnd = false;
    let isBlock = false;
    
    for (const booking of bookings) {
      const checkIn = parseISO(booking.check_in_date as string);
      const checkOut = parseISO(booking.check_out_date as string);
      
      // Controlla se è un giorno di check-in
      if (isSameDay(date, checkIn)) {
        isStart = true;
        isBlock = isBlock || booking.guest_name === 'Blocco date';
      }
      
      // Controlla se è un giorno di check-out (solo per prenotazioni, non per blocchi)
      if (isSameDay(date, checkOut) && booking.guest_name !== 'Blocco date') {
        isEnd = true;
      }
    }
    
    return { 
      isEdge: isStart || isEnd, 
      isStart: isStart,
      isEnd: isEnd,
      isBlock: isBlock
    };
  };

  // Aggiungi una funzione per determinare se è un blocco date
  const isBlockDate = (date: Date) => {
    return bookings.some(booking => {
      if (booking.guest_name === 'Blocco date') {
        const checkIn = parseISO(booking.check_in_date as string);
        const checkOut = parseISO(booking.check_out_date as string);
        
        // Per blocchi di un singolo giorno
        if ((checkOut.getTime() - checkIn.getTime()) <= 86400000) {  // 86400000 ms = 1 giorno
          return isSameDay(date, checkIn);
        }
        
        // Per blocchi multi-giorno
        return isWithinInterval(date, { start: checkIn, end: checkOut }) ||
          isSameDay(date, checkIn);
      }
      return false;
    });
  };

  // Aggiungi una funzione per determinare se è il giorno precedente al checkout
  const isDayBeforeCheckout = (date: Date) => {
    for (const booking of bookings) {
      if (booking.guest_name !== 'Blocco date') {  // Solo per prenotazioni, non per blocchi
        const checkOut = parseISO(booking.check_out_date as string);
        
        // Crea una data che è un giorno prima del checkout
        const dayBeforeCheckout = new Date(checkOut);
        dayBeforeCheckout.setDate(dayBeforeCheckout.getDate() - 1);
        
        if (isSameDay(date, dayBeforeCheckout)) {
          return true;
        }
      }
    }
    return false;
  };

  const getDayColor = (date: Date) => {
    const isBooked = isDateBooked(date);
    const bookingEdge = getBookingEdgeType(date);
    const isToday = isSameDay(date, new Date());
    const isBlock = isBlockDate(date);
    const isPrevCheckout = isDayBeforeCheckout(date);
    
    if (isBlock) {
      // Tutti i giorni in blocco date sono gialli
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        bookingStatus: 'Blocco date',
        edge: null,
        isBeforeCheckout: false,
        isCheckIn: false
      };
    }
    
    if (isBooked) {
      const isCheckIn = bookingEdge.isStart && !bookingEdge.isBlock;
      
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        bookingStatus: isCheckIn ? 'Check-in' : (bookingEdge.isEnd ? 'Check-out' : 'Occupato'),
        edge: bookingEdge.isStart ? 'start' : (bookingEdge.isEnd ? 'end' : null),
        isBeforeCheckout: isPrevCheckout,
        isCheckIn: isCheckIn
      };
    }
    
    // I giorni con tariffa ma non prenotati sono rossi
    const rate = getDateRate(date);
    if (rate) {
      return {
        bg: isToday ? 'bg-red-200' : 'bg-red-100',
        text: 'text-red-800',
        bookingStatus: 'Disponibile',
        rate: `€${rate}`,
        edge: null,
        isBeforeCheckout: false,
        isCheckIn: false
      };
    }
    
    // Tutti gli altri giorni sono rossi ma più chiari
    return {
      bg: isToday ? 'bg-red-100' : 'bg-red-50',
      text: 'text-red-800',
      bookingStatus: 'Nessuna tariffa',
      edge: null,
      isBeforeCheckout: false,
      isCheckIn: false
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Calendario Disponibilità</h2>
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

      <div className="border rounded-lg overflow-hidden shadow-sm">
        {Object.entries(monthGroups).map(([monthYear, daysInMonth]) => (
          <div key={monthYear}>
            <div className="bg-sky-100 p-4 text-center font-semibold border-b">
              {monthYear}
            </div>
            <div className="grid grid-cols-7 text-center text-xs bg-sky-50">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                <div key={day} className="p-3 border-b font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {/* Aggiungi celle vuote per allineare il primo giorno del mese */}
              {Array.from({ length: (new Date(daysInMonth[0]).getDay() === 0 ? 6 : new Date(daysInMonth[0]).getDay() - 1) }).map((_, i) => (
                <div key={`empty-${i}`} className="p-3 h-20 bg-white"></div>
              ))}
              
              {daysInMonth.map(day => {
                const { bg, text, bookingStatus, rate, edge, isBeforeCheckout, isCheckIn } = getDayColor(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isToday = isSameDay(day, new Date());

                let cellClasses = `border text-center transition-colors h-20`;
                
                // Aggiungi il bg solo se non è già definito da getDayColor (per prenotazioni e blocchi)
                if (bg === 'bg-white' && isWeekend) {
                  cellClasses += ' bg-sky-50';
                } else {
                  cellClasses += ` ${bg}`;
                }
                
                // Aggiungi il bordo verde per check-in
                if (isCheckIn) {
                  cellClasses += ' border-l-4 border-l-green-600';
                }
                
                // Aggiungi il bordo rosso sul lato destro per il giorno prima del checkout
                if (isBeforeCheckout) {
                  cellClasses += ' border-r-4 border-r-red-600';
                }
                
                if (isToday) {
                  cellClasses += ' ring-1 ring-blue-400';
                }
                
                return (
                  <div 
                    key={day.toString()} 
                    className={cellClasses}
                    title={`${format(day, 'dd/MM/yyyy')} - ${bookingStatus}${rate ? ` - ${rate}` : ''}`}
                  >
                    <div className="p-3 flex flex-col justify-between h-full">
                      <div className={`text-base font-semibold ${text}`}>
                        {format(day, 'd')}
                      </div>
                      {rate && (
                        <div className="text-sm mt-1 text-green-600 font-medium">
                          {rate}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-sm mt-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-sm bg-green-100 border border-green-200 mr-2"></div>
          <span>Prenotato</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-sm bg-yellow-100 border border-yellow-200 mr-2"></div>
          <span>Blocco date</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-sm bg-red-100 border border-red-200 mr-2"></div>
          <span>Disponibile</span>
        </div>
      </div>
    </div>
  );
} 