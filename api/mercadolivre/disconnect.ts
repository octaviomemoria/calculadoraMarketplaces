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
import { disconnect } from "../../src/lib/mercadolivre/connection";

export async function disconnectHandler(
  req: FunctionRequest,
  res: FunctionResponse,
  runtime: MercadoLivreRuntime,
): Promise<void> {
  if (!prepareCors(req, res, runtime.config)) return;
  if (req.method !== "POST") return methodNotAllowed(res, "POST, OPTIONS");
  try {
    await disconnect(runtime.store, connectionIdFromRequest(req) || "");
    res.status(204).end();
  } catch (error) {
    jsonError(res, error, 400);
  }
}

export default async function handler(req: FunctionRequest, res: FunctionResponse): Promise<void> {
  try {
    await disconnectHandler(req, res, loadRuntime());
  } catch {
    res.status(500).json({ error: "Integração Mercado Livre não configurada" });
  }
}
