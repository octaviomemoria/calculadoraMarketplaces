import {
  connectionIdFromRequest,
  jsonError,
  loadRuntime,
  methodNotAllowed,
  prepareCors,
  type FunctionRequest,
  type FunctionResponse,
  type MercadoLivreRuntime,
} from "../../src/lib/mercadolivre/http";
import { hasConnection } from "../../src/lib/mercadolivre/connection";

export async function statusHandler(
  req: FunctionRequest,
  res: FunctionResponse,
  runtime: MercadoLivreRuntime,
): Promise<void> {
  if (!prepareCors(req, res, runtime.config)) return;
  if (req.method !== "GET") return methodNotAllowed(res, "GET, OPTIONS");
  try {
    const connected = await hasConnection(runtime.store, connectionIdFromRequest(req) || "");
    res.status(200).json({ connected });
  } catch (error) {
    jsonError(res, error, 500);
  }
}

export default async function handler(req: FunctionRequest, res: FunctionResponse): Promise<void> {
  try {
    await statusHandler(req, res, loadRuntime());
  } catch {
    res.status(500).json({ error: "Integração Mercado Livre não configurada" });
  }
}
