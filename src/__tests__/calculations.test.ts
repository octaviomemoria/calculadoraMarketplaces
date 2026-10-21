import { describe, expect, it } from "vitest";
import {
  calcularPriceTargets,
  collapseChannelFees,
  costBreakdown,
  custoTotalProduto,
  indicadoresMarkup,
  lucroLiquido,
  margemReal,
  precificacaoReversa,
  priceForTargetMargin,
  simularDesconto,
  valorLiquidoRecebido,
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
describe("indicadores de líquido e markup", () => {
  it("calcula o exemplo do Mercado Livre com comissão e frete", () => {
    const ml = testChannel({
      comissaoPct: 0.12,
      taxaFixa: 0,
      custoFrete: 13.85,
      subsidioFrete: 0,
      impostoPct: 0,
      custoAds: 0,
    });

    const preco = 49.67;
    const custo = 20.27;

    expect(valorLiquidoRecebido(preco, ml)).toBeCloseTo(29.86, 2);

    const indicadores = indicadoresMarkup(preco, custo, ml);
    expect(indicadores?.valorLiquidoRecebido).toBeCloseTo(29.86, 2);
    expect(indicadores?.liquidoSobrePreco).toBeCloseTo(0.6012, 4);
    expect(indicadores?.liquidoSobreCusto).toBeCloseTo(1.4731, 4);
  });

  it("não inclui imposto ou Ads no líquido, mas mantém esses custos no lucro", () => {
    const ml = testChannel({
      comissaoPct: 0.12,
      taxaFixa: 0,
      custoFrete: 13.85,
      impostoPct: 0.04,
      custoAds: 0.05,
    });

    expect(valorLiquidoRecebido(49.67, ml)).toBeCloseTo(29.86, 2);
    expect(lucroLiquido(49.67, 20.27, ml)).toBeCloseTo(5.12, 2);
  });

  it("retorna null para preço ou custo inválido", () => {
    const ml = testChannel({ taxaFixa: 0 });

    expect(indicadoresMarkup(0, 20.27, ml)).toBeNull();
    expect(indicadoresMarkup(49.67, 0, ml)).toBeNull();
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

describe("regras dinâmicas nos canais (Shopee 2026, Mercado Livre e TikTok Shop)", () => {
  it("Shopee 2026: aplica faixa de até R$ 79,99 (20% + R$ 4) para produto barato", () => {
    const shopee = testChannel({
      regraDinamica: "shopee_2026",
      comissaoPct: 0.2,
      taxaFixa: 4,
      impostoPct: 0.04,
      custoFrete: 20,
      subsidioFrete: 20,
    });

    const targets = calcularPriceTargets(10, shopee, 0.05, 0.2);
    // (10 + 4) / (1 - 0.24 - 0.20) = 14 / 0.56 = 25.00
    expect(targets.precoIdeal).toBeCloseTo(25, 2);
    expect(margemReal(targets.precoIdeal!, 10, shopee)!).toBeCloseTo(0.2, 2);

    const breakdown = costBreakdown(targets.precoIdeal!, 10, shopee);
    expect(breakdown.faixaDescricao).toContain("até R$ 79,99");
  });

  it("Shopee 2026: migra automaticamente para 14% + R$ 20 para ticket na faixa R$ 100-200", () => {
    const shopee = testChannel({
      regraDinamica: "shopee_2026",
      comissaoPct: 0.2,
      taxaFixa: 4,
      impostoPct: 0.04,
      custoFrete: 20,
      subsidioFrete: 20,
    });

    const targets = calcularPriceTargets(50, shopee, 0.05, 0.2);
    // Na faixa 100-200: comissão 14% + imposto 4% = 18%, taxa fixa R$ 20
    // (50 + 20) / (1 - 0.18 - 0.20) = 70 / 0.62 ≈ 112.90
    expect(targets.precoIdeal).toBeCloseTo(112.9, 2);
    expect(margemReal(targets.precoIdeal!, 50, shopee)!).toBeCloseTo(0.2, 2);

    const breakdown = costBreakdown(targets.precoIdeal!, 50, shopee);
    expect(breakdown.faixaDescricao).toContain("R$ 100 a R$ 199,99");
  });

  it("Mercado Livre: < R$ 79 aplica taxa unitária e isenta frete do vendedor", () => {
    const ml = testChannel({
      regraDinamica: "mercadolivre",
      comissaoPct: 0.12,
      taxaFixa: 6,
      impostoPct: 0.04,
      custoFrete: 18,
      subsidioFrete: 10,
    });

    const targets = calcularPriceTargets(20, ml, 0.05, 0.2);
    // (20 + 6) / (1 - 0.16 - 0.20) = 26 / 0.64 = 40.625
    expect(targets.precoIdeal).toBeCloseTo(40.63, 2);

    const breakdown = costBreakdown(targets.precoIdeal!, 20, ml);
    expect(breakdown.faixaDescricao).toContain("< R$ 79");
    const itemFixa = breakdown.itens.find((i) => i.label.includes("Taxa fixa"));
    expect(itemFixa?.valor).toBe(6);
  });

  it("Mercado Livre: ≥ R$ 79 zera taxa fixa e aplica frete líquido obrigatório", () => {
    const ml = testChannel({
      regraDinamica: "mercadolivre",
      comissaoPct: 0.12,
      taxaFixa: 6,
      impostoPct: 0.04,
      custoFrete: 18,
      subsidioFrete: 10, // frete liq = 8
    });

    const targets = calcularPriceTargets(80, ml, 0.05, 0.2);
    // (80 + 8 frete) / (1 - 0.16 - 0.20) = 88 / 0.64 = 137.50
    expect(targets.precoIdeal).toBeCloseTo(137.5, 2);
    expect(margemReal(targets.precoIdeal!, 80, ml)!).toBeCloseTo(0.2, 2);

    const breakdown = costBreakdown(targets.precoIdeal!, 80, ml);
    expect(breakdown.faixaDescricao).toContain("≥ R$ 79");
    const itemFrete = breakdown.itens.find((i) => i.label.includes("Frete líquido"));
    expect(itemFrete?.valor).toBe(8);
  });

  it("TikTok Shop 2026: diferencia produtos abaixo e acima de R$ 50", () => {
    const tiktok = testChannel({
      regraDinamica: "tiktok_shop_2026",
      comissaoPct: 0.12,
      taxaFixa: 4,
      impostoPct: 0.04,
    });

    // Custo baixo -> preço abaixo de 50 (16% + R$ 4)
    const targetsBarato = calcularPriceTargets(15, tiktok, 0.05, 0.2);
    expect(targetsBarato.precoIdeal!).toBeLessThan(50);
    const breakdownBarato = costBreakdown(targetsBarato.precoIdeal!, 15, tiktok);
    expect(breakdownBarato.faixaDescricao).toContain("< R$ 50");

    // Custo alto -> preço acima de 50 (12% + R$ 6)
    const targetsCaro = calcularPriceTargets(60, tiktok, 0.05, 0.2);
    expect(targetsCaro.precoIdeal!).toBeGreaterThan(50);
    const breakdownCaro = costBreakdown(targetsCaro.precoIdeal!, 60, tiktok);
    expect(breakdownCaro.faixaDescricao).toContain("≥ R$ 50");
  });
});

describe("simularDesconto e elasticidade de volume", () => {
  it("calcula corretamente o aumento de volume necessário quando o desconto reduz o lucro", () => {
    const ch = testChannel({ comissaoPct: 0.1, impostoPct: 0.05, taxaFixa: 0 });
    // Preço base = 100, custo = 50
    // Fees base = 15% (R$ 15). Lucro base = 100 - 50 - 15 = R$ 35
    // Com desconto de 10% (Preço = 90)
    // Fees depois = 15% de 90 = R$ 13.50. Lucro depois = 90 - 50 - 13.50 = R$ 26.50
    // Aumento de volume necessário = (35 - 26.50) / 26.50 = 8.5 / 26.50 ≈ 32.07%
    const res = simularDesconto({
      precoBase: 100,
      custoTotal: 50,
      channel: ch,
      percentDiscount: 0.1,
      fixedDiscount: 0,
      freeShipping: false,
    });

    expect(res.precoAntes).toBe(100);
    expect(res.precoDepois).toBe(90);
    expect(res.lucroAntes).toBeCloseTo(35, 2);
    expect(res.lucroDepois).toBeCloseTo(26.5, 2);
    expect(res.isPrejuizo).toBe(false);
    expect(res.aumentoVolumeNecessarioPct).toBeCloseTo(8.5 / 26.5, 3);
  });

  it("retorna null para aumentoVolumeNecessarioPct se o desconto gerar prejuízo", () => {
    const ch = testChannel({ comissaoPct: 0.1, impostoPct: 0.05, taxaFixa: 0 });
    const res = simularDesconto({
      precoBase: 100,
      custoTotal: 80,
      channel: ch,
      percentDiscount: 0.3, // Preço = 70, custo = 80 -> Prejuízo
      fixedDiscount: 0,
      freeShipping: false,
    });

    expect(res.isPrejuizo).toBe(true);
    expect(res.lucroDepois).toBeLessThan(0);
    expect(res.aumentoVolumeNecessarioPct).toBeNull();
  });

  it("retorna 0 para aumentoVolumeNecessarioPct quando não há desconto", () => {
    const ch = testChannel({ comissaoPct: 0.1, impostoPct: 0.05, taxaFixa: 0 });
    const res = simularDesconto({
      precoBase: 100,
      custoTotal: 50,
      channel: ch,
      percentDiscount: 0,
      fixedDiscount: 0,
      freeShipping: false,
    });

    expect(res.aumentoVolumeNecessarioPct).toBe(0);
  });
});
