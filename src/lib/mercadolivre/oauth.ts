import type { MercadoLivreConfig, MercadoLivreTokenResponse } from "./types";

export const MERCADO_LIVRE_AUTHORIZATION_URL = "https://auth.mercadolivre.com.br/authorization";
export const MERCADO_LIVRE_TOKEN_URL = "https://api.mercadolibre.com/oauth/token";

function assertTokenResponse(payload: unknown): MercadoLivreTokenResponse {
  if (!payload || typeof payload !== "object") throw new Error("Resposta OAuth inválida");
  const value = payload as Partial<MercadoLivreTokenResponse>;
  if (typeof value.access_token !== "string" || !value.access_token || typeof value.expires_in !== "number") {
    throw new Error("Resposta OAuth inválida");
  }
  return {
    access_token: value.access_token,
    refresh_token: typeof value.refresh_token === "string" ? value.refresh_token : undefined,
    expires_in: value.expires_in,
  };
}

async function postToken(
  body: URLSearchParams,
  config: MercadoLivreConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<MercadoLivreTokenResponse> {
  const response = await fetchImpl(MERCADO_LIVRE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("Falha na autenticação do Mercado Livre");
  return assertTokenResponse(await response.json());
}

export function buildAuthorizationUrl(
  config: MercadoLivreConfig,
  state: string,
  codeChallenge: string,
): string {
  const url = new URL(MERCADO_LIVRE_AUTHORIZATION_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function exchangeAuthorizationCode(
  config: MercadoLivreConfig,
  code: string,
  codeVerifier: string,
  fetchImpl?: typeof fetch,
): Promise<MercadoLivreTokenResponse> {
  return postToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
    config,
    fetchImpl,
  );
}

export function refreshAccessToken(
  config: MercadoLivreConfig,
  refreshToken: string,
  fetchImpl?: typeof fetch,
): Promise<MercadoLivreTokenResponse> {
  return postToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
    config,
    fetchImpl,
  );
}
