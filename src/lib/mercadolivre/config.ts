import type { MercadoLivreConfig } from "./types";

type Environment = Record<string, string | undefined>;

function required(env: Environment, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function validHttpUrl(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Variável inválida: ${name}`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Variável inválida: ${name}`);
  }
  return url.toString().replace(/\/$/, "");
}

export function loadMercadoLivreConfig(env: Environment = process.env): MercadoLivreConfig {
  return {
    clientId: required(env, "MERCADOLIVRE_CLIENT_ID"),
    clientSecret: required(env, "MERCADOLIVRE_CLIENT_SECRET"),
    redirectUri: validHttpUrl(required(env, "MERCADOLIVRE_REDIRECT_URI"), "MERCADOLIVRE_REDIRECT_URI"),
    frontendOrigin: validHttpUrl(
      required(env, "MERCADOLIVRE_FRONTEND_ORIGIN"),
      "MERCADOLIVRE_FRONTEND_ORIGIN",
    ),
    siteId: (env.MERCADOLIVRE_SITE_ID?.trim() || "MLB").toUpperCase(),
  };
}
