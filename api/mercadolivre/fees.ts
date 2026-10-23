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
import { getValidAccessToken } from "../../src/lib/mercadolivre/connection";
import {
  fetchOfficialListingPrices,
  validateListingPricesRequest,
} from "../../src/lib/mercadolivre/fees";

export async function feesHandler(
  req: FunctionRequest,
  res: FunctionResponse,
  runtime: MercadoLivreRuntime,
): Promise<void> {
  if (!prepareCors(req, res, runtime.config)) return;
  if (req.method !== "POST") return methodNotAllowed(res, "POST, OPTIONS");
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({ error: "Body inválido" });
    return;
  }
  try {
    const input = validateListingPricesRequest({
      ...(req.body as Record<string, unknown>),
      connectionId: connectionIdFromRequest(req),
    });
    const accessToken = await getValidAccessToken(runtime.store, runtime.config, input.connectionId);
    const result = await fetchOfficialListingPrices(accessToken, runtime.config.siteId, input);
    res.status(200).json({
      listingTypeId: result.listingTypeId,
      listingTypeName: result.listingTypeName,
      currencyId: result.currencyId,
      listingFeeAmount: result.listingFeeAmount,
      saleFeeAmount: result.saleFeeAmount,
      saleFeePercentage: result.saleFeePercentage,
      saleFeeFixed: result.saleFeeFixed,
      netReceived: result.netReceived,
    });
  } catch (error) {
    jsonError(res, error, 400);
  }
}

export default async function handler(req: FunctionRequest, res: FunctionResponse): Promise<void> {
  try {
    await feesHandler(req, res, loadRuntime());
  } catch {
    res.status(500).json({ error: "Integração Mercado Livre não configurada" });
  }
}
