import {
  jsonError,
  loadRuntime,
  methodNotAllowed,
  prepareCors,
  queryValue,
  type FunctionRequest,
  type FunctionResponse,
  type MercadoLivreRuntime,
} from "../../src/lib/mercadolivre/http";
import { beginAuthorization } from "../../src/lib/mercadolivre/connection";

export async function authHandler(
  req: FunctionRequest,
  res: FunctionResponse,
  runtime: MercadoLivreRuntime,
): Promise<void> {
  if (!prepareCors(req, res, runtime.config)) return;
  if (req.method !== "GET") return methodNotAllowed(res, "GET, OPTIONS");
  try {
    const result = await beginAuthorization(runtime.store, runtime.config, queryValue(req, "returnTo"));
    res.redirect(result.url);
  } catch (error) {
    jsonError(res, error, 400);
  }
}

export default async function handler(req: FunctionRequest, res: FunctionResponse): Promise<void> {
  try {
    await authHandler(req, res, loadRuntime());
  } catch {
    res.status(500).json({ error: "Integração Mercado Livre não configurada" });
  }
}
