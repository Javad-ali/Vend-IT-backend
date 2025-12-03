declare module 'pg' {
  export class Client {
    constructor(config: { connectionString: string; ssl?: { rejectUnauthorized: boolean } });
    connect(): Promise<void>;
    query<T = unknown>(sql: string): Promise<{ rows: T[] }>;
    end(): Promise<void>;
  }
}
