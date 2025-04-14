import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Definizioni per interfacce specifiche di ical-generator e node-ical
export interface ICalEvent {
  type: string;
  start: Date;
  end: Date;
  summary?: string;
  description?: string;
  location?: string;
  uid: string;
  status?: string;
} 