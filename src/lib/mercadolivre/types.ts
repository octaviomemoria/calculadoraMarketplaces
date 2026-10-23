export interface MercadoLivreConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendOrigin: string;
  siteId: string;
}

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}
