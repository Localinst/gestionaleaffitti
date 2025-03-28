declare module 'pg' {
  export interface PoolConfig {
    user?: string;
    password?: string;
    host?: string;
    port?: number;
    database?: string;
    connectionString?: string;
    ssl?: boolean | {
      rejectUnauthorized?: boolean;
      ca?: string;
      key?: string;
      cert?: string;
      checkServerIdentity?: (host: string, cert: any) => undefined | Error;
    };
    family?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query(text: string, params?: any[]): Promise<QueryResult>;
    end(): Promise<void>;
    on(event: string, listener: Function): this;
  }

  export interface PoolClient {
    query(text: string, params?: any[]): Promise<QueryResult>;
    release(): void;
  }

  export interface QueryResult {
    rows: any[];
    rowCount: number;
    command: string;
    fields: any[];
  }
} 