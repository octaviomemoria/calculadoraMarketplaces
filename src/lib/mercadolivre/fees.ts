import type { ListingPricesRequest } from "./types";

const LISTING_PRICES_API = "https://api.mercadolibre.com";

export interface OfficialFeeResult {
  listingTypeId: string;
  listingTypeName: string;
  currencyId: string;
  listingFeeAmount: number;
  saleFeeAmount: number;
  saleFeePercentage: number | null;
  saleFeeFixed: number | null;
  netReceived: number;
  raw: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalText(value: unknown, name: string, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > maxLength) throw new Error(`${name} inválido`);
  return value;
}

export function validateListingPricesRequest(input: unknown): ListingPricesRequest {
  if (!isRecord(input)) throw new Error("Body inválido");
  const price = input.price;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0 || price > 10_000_000) {
    throw new Error("price inválido");
  }

  const categoryId = input.categoryId;
  if (typeof categoryId !== "string" || !/^MLB\d{1,12}$/i.test(categoryId)) {
    throw new Error("categoryId inválido");
  }
  const listingTypeId = input.listingTypeId;
  if (typeof listingTypeId !== "string" || !/^[a-z0-9_-]{1,64}$/i.test(listingTypeId)) {
    throw new Error("listingTypeId inválido");
  }
  const connectionId = input.connectionId;
  if (typeof connectionId !== "string" || connectionId.length < 20 || connectionId.length > 128) {
    throw new Error("connectionId inválido");
  }

  const currencyId = optionalText(input.currencyId, "currencyId", 8) || "BRL";
  const logisticType = optionalText(input.logisticType, "logisticType", 32);
  const shippingMode = optionalText(input.shippingMode, "shippingMode", 32);
  const tags = optionalText(input.tags, "tags", 128);
  const billableWeight = input.billableWeight;
  if (
    billableWeight !== undefined &&
    (typeof billableWeight !== "number" || !Number.isInteger(billableWeight) || billableWeight <= 0 || billableWeight > 500_000)
  ) {
    throw new Error("billableWeight inválido");
  }

  return {
    connectionId,
    price,
    categoryId: categoryId.toUpperCase(),
    listingTypeId,
    currencyId: currencyId.toUpperCase(),
    logisticType,
    shippingMode,
    billableWeight,
    tags,
  };
}

export function buildListingPricesUrl(siteId: string, input: ListingPricesRequest): string {
  const params = new URLSearchParams({
    price: input.price.toString(),
    category_id: input.categoryId,
    listing_type_id: input.listingTypeId,
    currency_id: input.currencyId || "BRL",
  });
  if (input.logisticType) params.set("logistic_type", input.logisticType);
  if (input.shippingMode) params.set("shipping_mode", input.shippingMode);
  if (input.billableWeight !== undefined) params.set("billable_weight", input.billableWeight.toString());
  if (input.tags) params.set("tags", input.tags);
  return `${LISTING_PRICES_API}/sites/${encodeURIComponent(siteId)}/listing_prices?${params.toString()}`;
}

function finiteAmount(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function normalizeListingPricesResponse(payload: unknown, price: number): OfficialFeeResult {
  const candidate = Array.isArray(payload) ? payload[0] : payload;
  if (!isRecord(candidate)) throw new Error("Resposta de tarifas inválida");
  const details = isRecord(candidate.sale_fee_details) ? candidate.sale_fee_details : {};
  const saleFeeAmount = finiteAmount(candidate.sale_fee_amount);
  const saleFeeFixed = typeof details.fixed_fee === "number" ? details.fixed_fee : null;
  const saleFeePercentage = typeof details.percentage_fee === "number" ? details.percentage_fee : null;
  const listingTypeId = typeof candidate.listing_type_id === "string" ? candidate.listing_type_id : "";
  if (!listingTypeId || saleFeeAmount < 0) throw new Error("Resposta de tarifas inválida");
  return {
    listingTypeId,
    listingTypeName:
      typeof candidate.listing_type_name === "string" ? candidate.listing_type_name : listingTypeId,
    currencyId: typeof candidate.currency_id === "string" ? candidate.currency_id : "BRL",
    listingFeeAmount: finiteAmount(candidate.listing_fee_amount),
    saleFeeAmount,
    saleFeePercentage,
    saleFeeFixed,
    netReceived: price - saleFeeAmount,
    raw: candidate,
  };
}

export async function fetchOfficialListingPrices(
  accessToken: string,
  siteId: string,
  input: ListingPricesRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<OfficialFeeResult> {
  const response = await fetchImpl(buildListingPricesUrl(siteId, input), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Mercado Livre indisponível (${response.status})`);
  return normalizeListingPricesResponse(await response.json(), input.price);
}
