declare module 'node-ical' {
  export interface VEvent {
    type: string;
    start: Date;
    end: Date;
    summary?: string;
    description?: string;
    location?: string;
    uid: string;
  }

  export function parseFile(file: string): Promise<Record<string, VEvent>>;
  export function parseICS(icsData: string): Record<string, VEvent>;
  export function fromURL(url: string): Promise<Record<string, VEvent>>;
} 