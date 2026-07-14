import { describe, expect, it } from "vitest";
import {
  calcularPriceTargets,
  collapseChannelFees,
  costBreakdown,
  custoTotalProduto,
  lucroLiquido,
  margemReal,
  precificacaoReversa,
  priceForTargetMargin,
  simularDesconto,
} from "@/lib/pricing/calculations";
import { emptyCostComponents, type MarketplaceChannel } from "@/lib/pricing/types";

function testChannel(overrides: Partial<MarketplaceChannel> = {}): MarketplaceChannel {
  return {
    id: "test-channel",
    nome: "Mercado Livre (teste)",
    isCustom: false,
    ativo: true,
    comissaoPct: 0.12,
    taxaFixa: 5,
    custoFrete: 0,
    subsidioFrete: 0,
    taxaAntecipacaoPct: 0,
    antecipacaoAtiva: false,
    custoAds: 0,
    tipoCustoAds: "percentual",
    impostoPct: 0.04,
    taxaPagamentoPct: 0,
    taxasPersonalizadas: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const CTP = 50;
const channel = testChannel();
const fees = collapseChannelFees(channel);

describe("custoTotalProduto", () => {
  it("soma todos os componentes de custo", () => {
    const custos = { ...emptyCostComponents(), aquisicao: 30, embalagem: 5, separacao: 2 };
    expect(custoTotalProduto(custos)).toBeCloseTo(37, 2);
  });
});

describe("collapseChannelFees", () => {
  it("soma taxas percentuais e fixas do canal de teste", () => {
    expect(fees.totalPercentageRate).toBeCloseTo(0.16, 6);
    expect(fees.totalFixedFees).toBeCloseTo(5, 6);
  });

  it("inclui antecipação só quando ativa", () => {
    const comAntecip = collapseChannelFees(
      testChannel({ antecipacaoAtiva: true, taxaAntecipacaoPct: 0.03 }),
    );
    expect(comAntecip.totalPercentageRate).toBeCloseTo(0.19, 6);

    const semAntecip = collapseChannelFees(
      testChannel({ antecipacaoAtiva: false, taxaAntecipacaoPct: 0.03 }),
    );
    expect(semAntecip.totalPercentageRate).toBeCloseTo(0.16, 6);
  });

  it("frete líquido nunca é negativo quando subsídio > custo", () => {
    const result = collapseChannelFees(
      testChannel({ custoFrete: 5, subsidioFrete: 20, taxaFixa: 0 }),
    );
    expect(result.totalFixedFees).toBe(0);
  });

  it("custoAds fixo entra em totalFixedFees, percentual entra em totalPercentageRate", () => {
    const fixo = collapseChannelFees(
      testChannel({ custoAds: 3, tipoCustoAds: "fixo", taxaFixa: 0 }),
    );
    expect(fixo.totalFixedFees).toBeCloseTo(3, 6);
    expect(fixo.totalPercentageRate).toBeCloseTo(0.16, 6);
  });
});

describe("exemplos numéricos do plano (canal: comissão 12% + taxa fixa R$5 + imposto 4%, CTP R$50)", () => {
  it("1. preço de equilíbrio ≈ R$ 65,48", () => {
    const preco = priceForTargetMargin(CTP, fees, 0)!;
    expect(preco).toBeCloseTo(65.48, 2);
    expect(lucroLiquido(preco, CTP, fees)).toBeCloseTo(0, 1);
  });

  it("2. preço mínimo recomendado (margem segurança 5%) ≈ R$ 69,62", () => {
    const preco = priceForTargetMargin(CTP, fees, 0.05)!;
    expect(preco).toBeCloseTo(69.62, 2);
    expect(lucroLiquido(preco, CTP, fees)).toBeCloseTo(3.48, 2);
    expect(margemReal(preco, CTP, fees)!).toBeCloseTo(0.05, 2);
  });

  it("3. preço ideal (margem alvo 20%) ≈ R$ 85,94, lucro ≈ R$ 17,19, margem = 20%", () => {
    const preco = priceForTargetMargin(CTP, fees, 0.2)!;
    expect(preco).toBeCloseTo(85.94, 2);
    expect(lucroLiquido(preco, CTP, fees)).toBeCloseTo(17.19, 2);
    expect(margemReal(preco, CTP, fees)!).toBeCloseTo(0.2, 2);
  });

  it("4. desconto de 10% sobre o preço ideal -> preço ≈ R$ 77,34, lucro ≈ R$ 9,97, margem ≈ 12,89%, sem prejuízo", () => {
    const precoIdeal = priceForTargetMargin(CTP, fees, 0.2)!;
    const result = simularDesconto({
      precoBase: precoIdeal,
      custoTotal: CTP,
      channel,
      percentDiscount: 0.1,
      fixedDiscount: 0,
      freeShipping: false,
    });
    expect(result.precoDepois).toBeCloseTo(77.34, 2);
    expect(result.lucroDepois).toBeCloseTo(9.97, 2);
    expect(result.margemDepois!).toBeCloseTo(0.1289, 3);
    expect(result.isPrejuizo).toBe(false);
  });

  it("desconto suficientemente grande cruza o preço de equilíbrio e dispara prejuízo", () => {
    const precoIdeal = priceForTargetMargin(CTP, fees, 0.2)!;
    const result = simularDesconto({
      precoBase: precoIdeal,
      custoTotal: CTP,
      channel,
      percentDiscount: 0.3,
      fixedDiscount: 0,
      freeShipping: false,
    });
    expect(result.isPrejuizo).toBe(true);
  });

  it("5. precificação reversa: concorrente R$70, margem alvo 15% -> custo máximo viável ≈ R$ 43,30; produto real (R$50) inviável, margem ≈ 5,43%", () => {
    const result = precificacaoReversa(70, channel, 0.15, CTP);
    expect(result.custoMaximoViavel).toBeCloseTo(43.3, 2);
    expect(result.viavel).toBe(false);
    expect(result.margemRealEstimada!).toBeCloseTo(0.0543, 3);
  });
});

describe("calcularPriceTargets", () => {
  it("retorna os três preços consistentes com as chamadas individuais", () => {
    const targets = calcularPriceTargets(CTP, fees, 0.05, 0.2);
    expect(targets.precoEquilibrio).toBeCloseTo(65.48, 2);
    expect(targets.precoMinimoRecomendado).toBeCloseTo(69.62, 2);
    expect(targets.precoIdeal).toBeCloseTo(85.94, 2);
  });
});

describe("casos de borda", () => {
  it("priceForTargetMargin retorna null quando taxas + margem somam 100% ou mais", () => {
    const canalQuebrado = testChannel({ comissaoPct: 0.9, impostoPct: 0.15, taxaFixa: 0 });
    const feesQuebrado = collapseChannelFees(canalQuebrado);
    expect(priceForTargetMargin(CTP, feesQuebrado, 0)).toBeNull();
  });

  it("margemReal não gera NaN/Infinity quando preço é zero", () => {
    expect(margemReal(0, CTP, fees)).toBeNull();
  });

  it("lucroLiquido a preço zero é negativo (só custos), não NaN", () => {
    const lucro = lucroLiquido(0, CTP, fees);
    expect(Number.isFinite(lucro)).toBe(true);
    expect(lucro).toBeLessThan(0);
  });
});

describe("taxasPersonalizadas", () => {
  it("taxas percentuais e fixas personalizadas somam em cima das taxas existentes", () => {
    const canal = testChannel({
      taxasPersonalizadas: [
        { id: "1", nome: "ICMS", tipo: "percentual", valor: 0.04 },
        { id: "2", nome: "Taxa antifraude", tipo: "fixo", valor: 1.5 },
      ],
    });
    const result = collapseChannelFees(canal);
    expect(result.totalPercentageRate).toBeCloseTo(0.16 + 0.04, 6);
    expect(result.totalFixedFees).toBeCloseTo(5 + 1.5, 6);
  });

  it("múltiplas taxas do mesmo tipo somam (não sobrescrevem)", () => {
    const canal = testChannel({
      taxasPersonalizadas: [
        { id: "1", nome: "Comissão vendedor", tipo: "percentual", valor: 0.03 },
        { id: "2", nome: "ISS", tipo: "percentual", valor: 0.02 },
      ],
    });
    const result = collapseChannelFees(canal);
    expect(result.totalPercentageRate).toBeCloseTo(0.16 + 0.03 + 0.02, 6);
  });

  it("costBreakdown gera um item por taxa personalizada com o valor correto", () => {
    const canal = testChannel({
      taxasPersonalizadas: [
        { id: "1", nome: "Comissão vendedor", tipo: "percentual", valor: 0.03 },
        { id: "2", nome: "Taxa antifraude", tipo: "fixo", valor: 1.5 },
      ],
    });
    const breakdown = costBreakdown(100, CTP, canal);
    const comissaoVendedor = breakdown.itens.find((i) => i.label === "Comissão vendedor");
    const antifraude = breakdown.itens.find((i) => i.label === "Taxa antifraude");
    expect(comissaoVendedor?.valor).toBeCloseTo(3, 6);
    expect(antifraude?.valor).toBeCloseTo(1.5, 6);
  });

  it("nome vazio cai no rótulo padrão 'Taxa personalizada'", () => {
    const canal = testChannel({
      taxasPersonalizadas: [{ id: "1", nome: "  ", tipo: "fixo", valor: 2 }],
    });
    const breakdown = costBreakdown(100, CTP, canal);
    expect(breakdown.itens.find((i) => i.valor === 2)?.label).toBe("Taxa personalizada");
  });

  it("funciona mesmo se taxasPersonalizadas vier undefined (dados antigos não migrados)", () => {
    const canal = testChannel();
    // @ts-expect-error simula dado persistido antes da migração v2
    delete canal.taxasPersonalizadas;
    expect(() => collapseChannelFees(canal)).not.toThrow();
    expect(() => costBreakdown(100, CTP, canal)).not.toThrow();
    expect(collapseChannelFees(canal).totalPercentageRate).toBeCloseTo(0.16, 6);
  });
});
