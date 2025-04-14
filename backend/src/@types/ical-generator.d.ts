declare module 'ical-generator' {
  interface ICalOptions {
    name?: string;
    timezone?: string;
    prodId?: {
      company: string;
      product: string;
    };
  }

  interface ICalEventOptions {
    uid: string;
    start: Date;
    end: Date;
    summary?: string;
    description?: string;
    location?: string;
    status?: string;
  }

  interface ICalCalendar {
    createEvent(options: ICalEventOptions): ICalEvent;
    toString(): string;
  }

  interface ICalEvent {
    uid(uid: string): ICalEvent;
    start(start: Date): ICalEvent;
    end(end: Date): ICalEvent;
    summary(summary: string): ICalEvent;
    description(description: string): ICalEvent;
    location(location: string): ICalEvent;
    status(status: string): ICalEvent;
  }

  export default function(options?: ICalOptions): ICalCalendar;
} 