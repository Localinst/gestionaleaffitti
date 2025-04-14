// Interfacce per le locazioni turistiche

export interface TourismProperty extends Property {
  is_tourism: boolean;
  max_guests: number;
  amenities?: Record<string, boolean>;
}

export interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string | Date;
  check_out_date: string | Date;
  num_guests: number;
  total_price: number;
  deposit_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  booking_source: string;
  booking_reference?: string;
  notes?: string;
  cleaning_status: 'pending' | 'in-progress' | 'completed';
  is_paid: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface SeasonalRate {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  start_date: string | Date;
  end_date: string | Date;
  daily_rate: number;
  min_stay: number;
  weekend_rate?: number;
  weekly_discount_percent: number;
  monthly_discount_percent: number;
  is_active: boolean;
}

export interface AdditionalService {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  description?: string;
  price: number;
  price_type: 'flat' | 'per_person' | 'per_day' | 'per_stay';
  is_active: boolean;
}

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface CleaningTask {
  id: string;
  property_id: string;
  booking_id?: string;
  user_id: string;
  scheduled_date: string | Date;
  scheduled_time?: string;
  cleaner_name?: string;
  cleaner_phone?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  cost: number;
} 