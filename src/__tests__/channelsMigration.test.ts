import { describe, expect, it } from "vitest";
import { mergeMissingDefaults } from "@/lib/store/useChannelsStore";
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
