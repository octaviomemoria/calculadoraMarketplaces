import { createPkcePair, randomOpaqueValue } from "./pkce";
import { buildAuthorizationUrl, exchangeAuthorizationCode, refreshAccessToken } from "./oauth";
import type {
  KeyValueStore,
  MercadoLivreConfig,
  OAuthStateRecord,
  StoredConnection,
} from "./types";

const STATE_TTL_SECONDS = 600;
const CONNECTION_KEY_PREFIX = "mercadolivre:connection:";
const STATE_KEY_PREFIX = "mercadolivre:oauth-state:";

function validateReturnTo(config: MercadoLivreConfig, returnTo?: string): string {
  const value = returnTo || config.frontendOrigin;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("returnTo inválido");
  }
  if (url.origin !== config.frontendOrigin) throw new Error("returnTo não permitido");
  return url.toString();
}

export async function beginAuthorization(
  store: KeyValueStore,
  config: MercadoLivreConfig,
  returnTo?: string,
): Promise<{ url: string; state: string }> {
  const state = randomOpaqueValue();
  const { codeVerifier, codeChallenge } = createPkcePair();
  const safeReturnTo = validateReturnTo(config, returnTo);
  const record: OAuthStateRecord = { codeVerifier, returnTo: safeReturnTo, createdAt: Date.now() };
  await store.set(`${STATE_KEY_PREFIX}${state}`, record, STATE_TTL_SECONDS);
  return { url: buildAuthorizationUrl(config, state, codeChallenge), state };
}

export async function completeAuthorization(
  store: KeyValueStore,
  config: MercadoLivreConfig,
  code: string,
  state: string,
): Promise<{ connectionId: string; returnTo: string }> {
  if (!code || !state) throw new Error("OAuth incompleto");
  const stateKey = `${STATE_KEY_PREFIX}${state}`;
  const record = await store.get<OAuthStateRecord>(stateKey);
  await store.del(stateKey);
  if (!record) throw new Error("state inválido ou expirado");

  const token = await exchangeAuthorizationCode(config, code, record.codeVerifier);
  if (!token.refresh_token) throw new Error("Mercado Livre não retornou refresh token");
  const connectionId = randomOpaqueValue();
  const connection: StoredConnection = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    createdAt: Date.now(),
  };
  await store.set(`${CONNECTION_KEY_PREFIX}${connectionId}`, connection);
  return { connectionId, returnTo: record.returnTo };
}

export async function getValidAccessToken(
  store: KeyValueStore,
  config: MercadoLivreConfig,
  connectionId: string,
): Promise<string> {
  if (!connectionId) throw new Error("Conexão ausente");
  const key = `${CONNECTION_KEY_PREFIX}${connectionId}`;
  const connection = await store.get<StoredConnection>(key);
  if (!connection) throw new Error("Conexão não encontrada");
  if (connection.expiresAt > Date.now() + 60_000) return connection.accessToken;

  const token = await refreshAccessToken(config, connection.refreshToken);
  const refreshed: StoredConnection = {
    ...connection,
    accessToken: token.access_token,
    refreshToken: token.refresh_token || connection.refreshToken,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
  await store.set(key, refreshed);
  return refreshed.accessToken;
}

export function connectionKey(connectionId: string): string {
  return `${CONNECTION_KEY_PREFIX}${connectionId}`;
}

export async function disconnect(store: KeyValueStore, connectionId: string): Promise<void> {
  if (connectionId) await store.del(connectionKey(connectionId));
}

export async function hasConnection(store: KeyValueStore, connectionId: string): Promise<boolean> {
  if (!connectionId) return false;
  return (await store.get<StoredConnection>(connectionKey(connectionId))) !== null;
}
