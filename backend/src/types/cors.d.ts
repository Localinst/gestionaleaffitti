import { RequestHandler } from 'express';

declare module 'cors' {
  interface CorsOptions {
    origin?: boolean | string | string[] | RegExp | RegExp[] | Function;
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
} 