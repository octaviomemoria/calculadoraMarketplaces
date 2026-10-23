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
import { completeAuthorization } from "../../src/lib/mercadolivre/connection";

function redirectResult(res: FunctionResponse, returnTo: string, params: Record<string, string>): void {
  const url = new URL(returnTo);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  res.redirect(url.toString());
}

export async function callbackHandler(
  req: FunctionRequest,
  res: FunctionResponse,
  runtime: MercadoLivreRuntime,
): Promise<void> {
  if (!prepareCors(req, res, runtime.config)) return;
  if (req.method !== "GET") return methodNotAllowed(res, "GET, OPTIONS");
  const error = queryValue(req, "error");
  if (error) {
    redirectResult(res, runtime.config.frontendOrigin, { mercadolivre: "error" });
    return;
  }
  try {
    const result = await completeAuthorization(
      runtime.store,
      runtime.config,
      queryValue(req, "code") || "",
      queryValue(req, "state") || "",
    );
    redirectResult(res, result.returnTo, {
      mercadolivre: "connected",
      connectionId: result.connectionId,
    });
  } catch (caught) {
    jsonError(res, caught, 400);
  }
}

export default async function handler(req: FunctionRequest, res: FunctionResponse): Promise<void> {
  try {
    await callbackHandler(req, res, loadRuntime());
  } catch {
    res.status(500).json({ error: "Integração Mercado Livre não configurada" });
  }
}
