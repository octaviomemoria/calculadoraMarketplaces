import { describe, expect, it, vi } from "vitest";
import {
  buildListingPricesUrl,
  fetchOfficialListingPrices,
  normalizeListingPricesResponse,
  validateListingPricesRequest,
} from "@/lib/mercadolivre/fees";

const request = {
  connectionId: "connection-id",
  price: 49.67,
  categoryId: "MLB1055",
  listingTypeId: "gold_special",
  currencyId: "BRL",
  logisticType: "drop_off",
  shippingMode: "me2",
  billableWeight: 500,
};

describe("tarifas oficiais Mercado Livre", () => {
  it("monta a URL com categoria, anúncio, moeda e logística", () => {
    const url = buildListingPricesUrl("MLB", request);
    expect(url).toContain("/sites/MLB/listing_prices?");
    expect(url).toContain("price=49.67");
    expect(url).toContain("category_id=MLB1055");
    expect(url).toContain("listing_type_id=gold_special");
    expect(url).toContain("logistic_type=drop_off");
    expect(url).toContain("shipping_mode=me2");
    expect(url).toContain("billable_weight=500");
  });

  it("rejeita preço ou categoria ausentes", () => {
    expect(() => validateListingPricesRequest({ ...request, price: 0 })).toThrow(/price/i);
    expect(() => validateListingPricesRequest({ ...request, categoryId: "" })).toThrow(/category/i);
  });

  it("usa sale_fee_amount sem duplicar fixed_fee", () => {
    const result = normalizeListingPricesResponse(
      {
        currency_id: "BRL",
        listing_type_id: "gold_special",
        listing_type_name: "Clássico",
        listing_fee_amount: 0,
        sale_fee_amount: 19.81,
        sale_fee_details: { fixed_fee: 13.85, percentage_fee: 12 },
      },
      49.67,
    );

    expect(result.saleFeeAmount).toBe(19.81);
    expect(result.saleFeeFixed).toBe(13.85);
    expect(result.netReceived).toBeCloseTo(29.86, 2);
  });

  it("consulta com Bearer e aceita resposta em array", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            currency_id: "BRL",
            listing_type_id: "gold_special",
            listing_type_name: "Clássico",
            sale_fee_amount: 19.81,
            sale_fee_details: { fixed_fee: 13.85, percentage_fee: 12 },
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await fetchOfficialListingPrices("access-token", "MLB", request, fetchMock);

    expect(result.netReceived).toBeCloseTo(29.86, 2);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("listing_type_id=gold_special"),
      expect.objectContaining({ headers: { Authorization: "Bearer access-token" } }),
    );
  });
});
