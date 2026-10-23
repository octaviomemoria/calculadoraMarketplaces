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

export interface OAuthStateRecord {
  codeVerifier: string;
  returnTo: string;
  createdAt: number;
}

export interface StoredConnection {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface MercadoLivreTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface ListingPricesRequest {
  connectionId: string;
  price: number;
  categoryId: string;
  listingTypeId: string;
  currencyId?: string;
  logisticType?: string;
  shippingMode?: string;
  billableWeight?: number;
  tags?: string;
}
