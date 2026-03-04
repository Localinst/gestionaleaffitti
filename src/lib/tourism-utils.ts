// Utility per gestire la locazione turistica a livello di unità

import { Property } from '@/services/api';

/**
 * Verifica se una proprietà ha almeno una unità in locazione turistica
 */
export const isTouristicProperty = (property: Property | null | undefined): boolean => {
  if (!property) return false;
  if (!property.is_tourism) return false;
  
  // Se tourism_units non è specificato, significa che TUTTE le unità sono in turismo
  if (!property.tourism_units) return true;
  
  // Se tourism_units è un array non vuoto, la proprietà è turistica
  if (Array.isArray(property.tourism_units)) {
    return property.tourism_units.length > 0;
  }
  
  // Se è una stringa JSON, parsala
  try {
    const parsed = JSON.parse(property.tourism_units as string);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
};

/**
 * Verifica se una specifica unità è in locazione turistica
 */
export const isUnitTouristic = (property: Property | null | undefined, unitIndex: number): boolean => {
  if (!property) return false;
  if (!property.is_tourism) return false;
  
  // Se tourism_units non è specificato, TUTTE le unità sono in turismo
  if (!property.tourism_units) return true;
  
  let tourismUnits: number[] = [];
  
  if (Array.isArray(property.tourism_units)) {
    tourismUnits = property.tourism_units;
  } else {
    try {
      tourismUnits = JSON.parse(property.tourism_units as string);
    } catch {
      return false;
    }
  }
  
  return tourismUnits.includes(unitIndex);
};

/**
 * Ottieni la lista delle unità in locazione turistica
 */
export const getTouristicUnits = (property: Property | null | undefined): number[] => {
  if (!property?.is_tourism) return [];
  
  // Se tourism_units non è specificato, ritorna tutte le unità
  if (!property.tourism_units) {
    return Array.from({ length: property.units }, (_, i) => i);
  }
  
  if (Array.isArray(property.tourism_units)) {
    return property.tourism_units;
  }
  
  try {
    const parsed = JSON.parse(property.tourism_units as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
