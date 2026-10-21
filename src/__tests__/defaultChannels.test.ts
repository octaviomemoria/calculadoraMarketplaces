import { describe, expect, it } from "vitest";
import { createDefaultChannels } from "@/lib/pricing/defaultChannels";
import { collapseChannelFees } from "@/lib/pricing/calculations";

describe("createDefaultChannels — modalidades", () => {
  const canais = createDefaultChannels();
  const nomes = canais.map((c) => c.nome);

  it("inclui as modalidades de Mercado Livre, Amazon e Magalu", () => {
    expect(nomes).toEqual(
      expect.arrayContaining([
        "Mercado Livre Clássico",
        "Mercado Livre Premium",
        "Mercado Livre Full",
        "Amazon FBM",
        "Amazon FBA",
        "Shopee",
        "Magalu",
        "Magalu Full",
      ]),
    );
  });

  it("ML Premium tem comissão maior que ML Clássico", () => {
    const classico = canais.find((c) => c.nome === "Mercado Livre Clássico")!;
    const premium = canais.find((c) => c.nome === "Mercado Livre Premium")!;
    expect(premium.comissaoPct).toBeGreaterThan(classico.comissaoPct);
  });

  it("modalidades Full/FBA trazem uma linha de fulfillment em taxasPersonalizadas", () => {
    const full = canais.find((c) => c.nome === "Mercado Livre Full")!;
    const fba = canais.find((c) => c.nome === "Amazon FBA")!;
    expect(full.taxasPersonalizadas.some((f) => f.tipo === "fixo" && f.valor > 0)).toBe(true);
    expect(fba.taxasPersonalizadas.some((f) => f.tipo === "fixo" && f.valor > 0)).toBe(true);
  });

  it("a armazenagem do Full soma no totalFixedFees", () => {
    const full = canais.find((c) => c.nome === "Mercado Livre Full")!;
    const armazenagem = full.taxasPersonalizadas.find((f) => f.tipo === "fixo")!;
    const fees = collapseChannelFees(full);
    expect(fees.totalFixedFees).toBeGreaterThanOrEqual(armazenagem.valor);
  });

  it("todos os nomes de canal são únicos", () => {
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it("configura regras dinâmicas para Mercado Livre, Shopee e TikTok Shop", () => {
    const ml = canais.find((c) => c.nome === "Mercado Livre Clássico")!;
    const shopee = canais.find((c) => c.nome === "Shopee")!;
    const tiktok = canais.find((c) => c.nome === "TikTok Shop")!;
    expect(ml.regraDinamica).toBe("mercadolivre");
    expect(shopee.regraDinamica).toBe("shopee_2026");
    expect(tiktok.regraDinamica).toBe("tiktok_shop_2026");
  });

  it("Amazon vem com taxaFixa 0 (plano profissional) e Shein com 18%", () => {
    const fbm = canais.find((c) => c.nome === "Amazon FBM")!;
    const fba = canais.find((c) => c.nome === "Amazon FBA")!;
    const shein = canais.find((c) => c.nome === "Shein")!;
    expect(fbm.taxaFixa).toBe(0);
    expect(fba.taxaFixa).toBe(0);
    expect(shein.comissaoPct).toBeCloseTo(0.18, 2);
  });
});
