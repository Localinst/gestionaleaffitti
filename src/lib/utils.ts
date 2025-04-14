import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatta un valore numerico come valuta (€)
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '€0,00';
  }
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(numValue);
}

/**
 * Formatta un valore numerico come percentuale
 */
export function formatPercent(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0%';
  }
  
  return new Intl.NumberFormat('it-IT', {
    style: 'percent',
    maximumFractionDigits: 1
  }).format(numValue / 100);
}
