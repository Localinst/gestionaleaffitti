/**
 * Utility per la sicurezza dell'applicazione
 * Questo file contiene funzioni per la protezione da diverse vulnerabilità comuni
 */

/**
 * Sanitizza input per prevenire XSS attacks
 * @param unsafe Input potenzialmente pericoloso
 * @returns Stringa sanitizzata 
 */
export const sanitizeInput = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Funzione di escape per prevenire SQL injection
 * @param str Stringa da sanitizzare 
 * @returns Stringa sanitizzata per SQL
 */
export const escapeSqlString = (str: string): string => {
  if (!str) return "";
  return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
};

/**
 * Hashing per password/token (versione semplificata)
 * In produzione, usare bcrypt, argon2 o altro algoritmo sicuro
 * @param text Testo da hashare 
 * @returns Hash del testo
 */
export const simpleHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converti in intero a 32 bit
  }
  return hash.toString(36);
};

/**
 * Generatore di token sicuri
 * @param length Lunghezza del token
 * @returns Token casuale
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Usa crypto API se disponibile nel browser
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
    return result;
  }
  
  // Fallback meno sicuro
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Utility per la gestione sicura dei cookie
 */
export const SecureCookie = {
  /**
   * Imposta un cookie con opzioni di sicurezza
   * @param name Nome del cookie
   * @param value Valore del cookie
   * @param days Giorni di validità
   * @param secure Imposta flag Secure
   */
  set: (name: string, value: string, days: number, secure: boolean = true): void => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    const secureFlag = secure ? '; Secure' : '';
    
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict${secureFlag}`;
  },
  
  /**
   * Ottiene il valore di un cookie
   * @param name Nome del cookie
   * @returns Valore del cookie o null
   */
  get: (name: string): string | null => {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1);
      }
      
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    
    return null;
  },
  
  /**
   * Elimina un cookie
   * @param name Nome del cookie
   */
  delete: (name: string): void => {
    document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Strict; Secure`;
  }
};

/**
 * Genera un CSRF token sicuro con timestamp incluso
 * @returns Token CSRF con timestamp
 */
export const generateCsrfToken = (): string => {
  const timestamp = Date.now().toString();
  const randomPart = generateSecureToken(16);
  return `${timestamp}:${randomPart}`;
};

/**
 * Verifica che un CSRF token sia valido e non scaduto
 * @param token Token CSRF da verificare
 * @param maxAgeMinutes Validità massima in minuti 
 * @returns Vero se il token è valido e non scaduto
 */
export const validateCsrfToken = (token: string, maxAgeMinutes: number = 30): boolean => {
  const parts = token.split(':');
  
  if (parts.length !== 2) {
    return false;
  }
  
  const timestamp = parseInt(parts[0], 10);
  const now = Date.now();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  
  // Verifica che il timestamp non sia troppo vecchio
  return !isNaN(timestamp) && (now - timestamp < maxAgeMs);
};

/**
 * Rate limiter semplice per richieste
 */
export class RateLimiter {
  private attempts: Record<string, number[]> = {};
  private maxAttempts: number;
  private timeWindowMs: number;
  
  /**
   * @param maxAttempts Numero massimo di tentativi
   * @param timeWindowSeconds Finestra temporale in secondi
   */
  constructor(maxAttempts: number = 5, timeWindowSeconds: number = 60) {
    this.maxAttempts = maxAttempts;
    this.timeWindowMs = timeWindowSeconds * 1000;
  }
  
  /**
   * Controlla se il client può effettuare una nuova richiesta
   * @param clientId Identificatore unico del client
   * @returns true se la richiesta è consentita, false altrimenti
   */
  canMakeRequest(clientId: string): boolean {
    const now = Date.now();
    
    // Inizializza gli attemps se non esistono
    if (!this.attempts[clientId]) {
      this.attempts[clientId] = [];
    }
    
    // Rimuovi i tentativi vecchi
    this.attempts[clientId] = this.attempts[clientId].filter(
      timestamp => now - timestamp < this.timeWindowMs
    );
    
    // Verifica il numero di tentativi
    return this.attempts[clientId].length < this.maxAttempts;
  }
  
  /**
   * Registra un nuovo tentativo
   * @param clientId Identificatore unico del client
   */
  recordAttempt(clientId: string): void {
    if (!this.attempts[clientId]) {
      this.attempts[clientId] = [];
    }
    
    this.attempts[clientId].push(Date.now());
  }
  
  /**
   * Ottiene il tempo rimanente prima che il rate limit si resetti
   * @param clientId Identificatore unico del client
   * @returns Tempo rimanente in millisecondi, 0 se non ci sono tentativi
   */
  getTimeRemaining(clientId: string): number {
    if (!this.attempts[clientId] || this.attempts[clientId].length === 0) {
      return 0;
    }
    
    const now = Date.now();
    const oldestAttempt = Math.min(...this.attempts[clientId]);
    const timeElapsed = now - oldestAttempt;
    
    return Math.max(0, this.timeWindowMs - timeElapsed);
  }
}

export default {
  sanitizeInput,
  escapeSqlString,
  simpleHash,
  generateSecureToken,
  SecureCookie,
  generateCsrfToken,
  validateCsrfToken,
  RateLimiter
}; 