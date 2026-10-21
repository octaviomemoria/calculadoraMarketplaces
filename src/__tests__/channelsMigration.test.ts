import { describe, expect, it } from "vitest";
import { mergeMissingDefaults, migrateChannelsV4 } from "@/lib/store/useChannelsStore";
import type { MarketplaceChannel } from "@/lib/pricing/types";

function legacyChannel(nome: string): MarketplaceChannel {
  const ts = "2026-01-01T00:00:00.000Z";
  return {
    id: "legacy-" + nome,
    nome,
    isCustom: false,
    ativo: true,
    comissaoPct: 0.99, // valor customizado propositalmente absurdo, para detectar sobrescrita
    taxaFixa: 0,
    custoFrete: 0,
    subsidioFrete: 0,
    taxaAntecipacaoPct: 0,
    antecipacaoAtiva: false,
    custoAds: 0,
    tipoCustoAds: "percentual",
    impostoPct: 0,
    taxaPagamentoPct: 0,
    taxasPersonalizadas: [],
    createdAt: ts,
    updatedAt: ts,
  };
}

describe("mergeMissingDefaults (migração v2 -> v3)", () => {
  it("adiciona modalidades novas sem tocar nas existentes", () => {
    const antigo = [legacyChannel("Mercado Livre")];
    const resultado = mergeMissingDefaults(antigo);

    // o canal antigo customizado sobrevive intacto
    const preservado = resultado.find((c) => c.nome === "Mercado Livre");
    expect(preservado).toBeDefined();
    expect(preservado!.comissaoPct).toBe(0.99);

    // e as novas modalidades foram adicionadas
    const nomes = resultado.map((c) => c.nome);
    expect(nomes).toEqual(
      expect.arrayContaining(["Mercado Livre Clássico", "Amazon FBA", "Magalu Full"]),
    );
  });

  it("não duplica canais que já existem por nome", () => {
    const jaTem = [legacyChannel("Shopee")];
    const resultado = mergeMissingDefaults(jaTem);
    const shopees = resultado.filter((c) => c.nome === "Shopee");
    expect(shopees.length).toBe(1);
    expect(shopees[0].comissaoPct).toBe(0.99); // manteve o customizado, não readicionou o padrão
  });
});

describe("migrateChannelsV4 (migração v3 -> v4)", () => {
  it("atribui regraDinamica correspondente para canais padrão legados", () => {
    const legados: MarketplaceChannel[] = [
      { ...legacyChannel("Mercado Livre Clássico"), taxaFixa: 6 },
      { ...legacyChannel("Shopee"), taxaFixa: 4 },
      { ...legacyChannel("TikTok Shop"), taxaFixa: 0 },
      { ...legacyChannel("Amazon FBM"), taxaFixa: 5 },
      { ...legacyChannel("Shein"), comissaoPct: 0.15 },
    ];

    const migrados = migrateChannelsV4(legados);

    const ml = migrados.find((c) => c.nome === "Mercado Livre Clássico")!;
    expect(ml.regraDinamica).toBe("mercadolivre");

    const shopee = migrados.find((c) => c.nome === "Shopee")!;
    expect(shopee.regraDinamica).toBe("shopee_2026");

    const tiktok = migrados.find((c) => c.nome === "TikTok Shop")!;
    expect(tiktok.regraDinamica).toBe("tiktok_shop_2026");

    const amazon = migrados.find((c) => c.nome === "Amazon FBM")!;
    expect(amazon.taxaFixa).toBe(0);

    const shein = migrados.find((c) => c.nome === "Shein")!;
    expect(shein.comissaoPct).toBeCloseTo(0.18, 2);
  });
});
