import { loadMercadoLivreConfig } from "./config";
import { createUpstashStore } from "./store";
import type { KeyValueStore, MercadoLivreConfig } from "./types";

export interface FunctionRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export interface FunctionResponse {
  status(code: number): FunctionResponse;
  json(body: unknown): FunctionResponse;
  redirect(location: string): FunctionResponse;
  setHeader(name: string, value: string | number): FunctionResponse;
  end(): FunctionResponse | void;
}

export interface MercadoLivreRuntime {
  config: MercadoLivreConfig;
  store: KeyValueStore;
}

export function loadRuntime(): MercadoLivreRuntime {
  return { config: loadMercadoLivreConfig(), store: createUpstashStore() };
}

function header(req: FunctionRequest, name: string): string | undefined {
  const value = Object.entries(req.headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(value) ? value[0] : value;
}

export function queryValue(req: FunctionRequest, name: string): string | undefined {
  const value = req.query?.[name];
  return Array.isArray(value) ? value[0] : value;
}

export function connectionIdFromRequest(req: FunctionRequest): string | undefined {
  const authorization = header(req, "authorization");
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const value = authorization.slice("Bearer ".length).trim();
  return /^[A-Za-z0-9_-]{20,128}$/.test(value) ? value : undefined;
}

export function prepareCors(
  req: FunctionRequest,
  res: FunctionResponse,
  config: MercadoLivreConfig,
): boolean {
  const origin = header(req, "origin");
  if (origin && origin !== config.frontendOrigin) {
    res.status(403).json({ error: "Origem não permitida" });
    return false;
  }
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }
  return true;
}

export function jsonError(res: FunctionResponse, error: unknown, status = 400): void {
  const message = error instanceof Error ? error.message : "Não foi possível concluir a operação";
  res.status(status).json({ error: message });
}

export function methodNotAllowed(res: FunctionResponse, allowed: string): void {
  res.setHeader("Allow", allowed);
  res.status(405).json({ error: "Método não permitido" });
}
