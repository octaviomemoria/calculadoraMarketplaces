import type { CostComponents, MarketplaceChannel } from "./types";

/**
 * Motor de cálculo puro — sem dependências de React/Zustand/DOM.
 * Margem é sempre lucro ÷ preço (base receita), nunca lucro ÷ custo (markup).
 */

export interface ChannelFees {
  /** soma de todas as taxas proporcionais ao preço (decimal) */
  totalPercentageRate: number;
  /** soma de todas as taxas em valor fixo (R$) */
  totalFixedFees: number;
}

export interface DynamicFeeResolution {
  comissaoPct: number;
  taxaFixa: number;
  custoFreteLiquido: number;
  faixaDescricao?: string;
}

export function resolveDynamicFees(channel: MarketplaceChannel, preco: number): DynamicFeeResolution {
  const regra = channel.regraDinamica ?? "nenhuma";
  const freteLiquidoPadrao = Math.max(channel.custoFrete - channel.subsidioFrete, 0);

  if (regra === "shopee_2026") {
    // Escalonamento oficial Shopee 2026:
    // Até R$ 79,99: 20% comissão (ou base do canal) + R$ 4,00 fixo
    // R$ 80 a R$ 99,99: 14% comissão + R$ 16,00 fixo
    // R$ 100 a R$ 199,99: 14% comissão + R$ 20,00 fixo
    // R$ 200 a R$ 499,99: 14% comissão + R$ 26,00 fixo
    // A partir de R$ 500: 14% comissão + R$ 26,00 fixo
    if (preco < 80) {
      return {
        comissaoPct: channel.comissaoPct || 0.2,
        taxaFixa: channel.taxaFixa || 4,
        custoFreteLiquido: freteLiquidoPadrao,
        faixaDescricao: "Shopee: até R$ 79,99 (20% + R$ 4)",
      };
    }
    if (preco < 100) {
      return {
        comissaoPct: 0.14,
        taxaFixa: 16,
        custoFreteLiquido: freteLiquidoPadrao,
        faixaDescricao: "Shopee: R$ 80 a R$ 99,99 (14% + R$ 16)",
      };
    }
    if (preco < 200) {
      return {
        comissaoPct: 0.14,
        taxaFixa: 20,
        custoFreteLiquido: freteLiquidoPadrao,
        faixaDescricao: "Shopee: R$ 100 a R$ 199,99 (14% + R$ 20)",
      };
    }
    return {
      comissaoPct: 0.14,
      taxaFixa: 26,
      custoFreteLiquido: freteLiquidoPadrao,
      faixaDescricao: "Shopee: a partir de R$ 200 (14% + R$ 26)",
    };
  }

  if (regra === "mercadolivre") {
    // Mercado Livre 2026:
    // Abaixo de R$ 79: taxa fixa / custo operacional unitário (ex: R$ 6,00), frete vendedor = 0
    // A partir de R$ 79: taxa fixa = R$ 0,00, frete obrigatório com coparticipação
    if (preco < 79) {
      return {
        comissaoPct: channel.comissaoPct,
        taxaFixa: channel.taxaFixa,
        custoFreteLiquido: 0,
        faixaDescricao: "Mercado Livre: < R$ 79 (com taxa fixa unitária, sem frete grátis obrigatório)",
      };
    }
    return {
      comissaoPct: channel.comissaoPct,
      taxaFixa: 0,
      custoFreteLiquido: freteLiquidoPadrao,
      faixaDescricao: "Mercado Livre: ≥ R$ 79 (sem taxa fixa, com frete grátis obrigatório)",
    };
  }

  if (regra === "tiktok_shop_2026") {
    // TikTok Shop Brasil 2026:
    // Abaixo de R$ 50: 10% comissão + 6% programa frete = 16%, taxa fixa R$ 4,00
    // A partir de R$ 50: 6% comissão + 6% programa frete = 12%, taxa fixa R$ 6,00
    if (preco < 50) {
      return {
        comissaoPct: 0.16,
        taxaFixa: 4,
        custoFreteLiquido: freteLiquidoPadrao,
        faixaDescricao: "TikTok Shop: < R$ 50 (16% + R$ 4 fixo)",
      };
    }
    return {
      comissaoPct: 0.12,
      taxaFixa: 6,
      custoFreteLiquido: freteLiquidoPadrao,
      faixaDescricao: "TikTok Shop: ≥ R$ 50 (12% + R$ 6 fixo)",
    };
  }

  return {
    comissaoPct: channel.comissaoPct,
    taxaFixa: channel.taxaFixa,
    custoFreteLiquido: freteLiquidoPadrao,
  };
}

function isMarketplaceChannel(obj: ChannelFees | MarketplaceChannel): obj is MarketplaceChannel {
  return "nome" in obj && "comissaoPct" in obj;
}

export function collapseChannelFees(channel: MarketplaceChannel, preco?: number): ChannelFees {
  const dynamic = preco !== undefined ? resolveDynamicFees(channel, preco) : null;
  const comissaoPct = dynamic ? dynamic.comissaoPct : channel.comissaoPct;
  const taxaFixa = dynamic ? dynamic.taxaFixa : channel.taxaFixa;
  const freteLiquido =
    dynamic ? dynamic.custoFreteLiquido : Math.max(channel.custoFrete - channel.subsidioFrete, 0);

  const custom = channel.taxasPersonalizadas ?? [];
  const customPercentageRate = custom
    .filter((f) => f.tipo === "percentual")
    .reduce((sum, f) => sum + f.valor, 0);
  const customFixedFees = custom
    .filter((f) => f.tipo === "fixo")
    .reduce((sum, f) => sum + f.valor, 0);

  const totalPercentageRate =
    comissaoPct +
    channel.impostoPct +
    channel.taxaPagamentoPct +
    (channel.antecipacaoAtiva ? channel.taxaAntecipacaoPct : 0) +
    (channel.tipoCustoAds === "percentual" ? channel.custoAds : 0) +
    customPercentageRate;

  const totalFixedFees =
    taxaFixa +
    freteLiquido +
    (channel.tipoCustoAds === "fixo" ? channel.custoAds : 0) +
    customFixedFees;

  return { totalPercentageRate, totalFixedFees };
}

export interface MarkupIndicators {
  valorLiquidoRecebido: number;
  liquidoSobrePreco: number;
  liquidoSobreCusto: number;
}

/**
 * Estima o repasse líquido da plataforma antes dos custos próprios do vendedor.
 * Imposto, Ads e taxas personalizadas continuam compondo o lucro, mas não são
 * classificados automaticamente como desconto feito pelo marketplace.
 */
export function valorLiquidoRecebido(preco: number, channel: MarketplaceChannel): number {
  const dynamic = resolveDynamicFees(channel, preco);
  const percentualPlataforma =
    dynamic.comissaoPct +
    channel.taxaPagamentoPct +
    (channel.antecipacaoAtiva ? channel.taxaAntecipacaoPct : 0);
  const fixoPlataforma = dynamic.taxaFixa + dynamic.custoFreteLiquido;

  return preco * (1 - percentualPlataforma) - fixoPlataforma;
}

export function indicadoresMarkup(
  preco: number,
  custoTotal: number,
  channel: MarketplaceChannel,
): MarkupIndicators | null {
  if (preco <= 0 || custoTotal <= 0) return null;

  const valorLiquido = valorLiquidoRecebido(preco, channel);
  return {
    valorLiquidoRecebido: valorLiquido,
    liquidoSobrePreco: valorLiquido / preco,
    liquidoSobreCusto: valorLiquido / custoTotal,
  };
}

export function custoTotalProduto(custos: CostComponents): number {
  return (
    custos.aquisicao +
    custos.fabricacao +
    custos.embalagem +
    custos.etiqueta +
    custos.armazenagem +
    custos.maoDeObra +
    custos.separacao +
    custos.custoMedioDevolucoes +
    custos.outrosCustosVariaveis
  );
}

export function lucroLiquido(
  preco: number,
  custoTotal: number,
  feesOrChannel: ChannelFees | MarketplaceChannel,
): number {
  const fees = isMarketplaceChannel(feesOrChannel)
    ? collapseChannelFees(feesOrChannel, preco)
    : feesOrChannel;
  return preco * (1 - fees.totalPercentageRate) - custoTotal - fees.totalFixedFees;
}

export function margemReal(
  preco: number,
  custoTotal: number,
  feesOrChannel: ChannelFees | MarketplaceChannel,
): number | null {
  if (preco === 0) return null;
  return lucroLiquido(preco, custoTotal, feesOrChannel) / preco;
}

function getTiersForChannel(
  channel: MarketplaceChannel,
): { min: number; max: number | null; sample: number }[] {
  const regra = channel.regraDinamica ?? "nenhuma";
  if (regra === "shopee_2026") {
    return [
      { min: 0, max: 80, sample: 50 },
      { min: 80, max: 100, sample: 90 },
      { min: 100, max: 200, sample: 150 },
      { min: 200, max: 500, sample: 300 },
      { min: 500, max: null, sample: 600 },
    ];
  }
  if (regra === "mercadolivre") {
    return [
      { min: 0, max: 79, sample: 50 },
      { min: 79, max: null, sample: 120 },
    ];
  }
  if (regra === "tiktok_shop_2026") {
    return [
      { min: 0, max: 50, sample: 30 },
      { min: 50, max: null, sample: 70 },
    ];
  }
  return [{ min: 0, max: null, sample: 100 }];
}

/**
 * Resolve lucroLiquido(P)/P = margemAlvo para P.
 * Suporta canais com regras dinâmicas escalonadas por faixa de preço.
 * Retorna null se as taxas + margem alvo somarem 100% ou mais do preço (impossível de atingir).
 */
export function priceForTargetMargin(
  custoTotal: number,
  feesOrChannel: ChannelFees | MarketplaceChannel,
  margemAlvo: number,
): number | null {
  if (!isMarketplaceChannel(feesOrChannel)) {
    const fees = feesOrChannel;
    const denominador = 1 - fees.totalPercentageRate - margemAlvo;
    if (denominador <= 0) return null;
    return (custoTotal + fees.totalFixedFees) / denominador;
  }

  const channel = feesOrChannel;
  const tiers = getTiersForChannel(channel);

  if (tiers.length === 1) {
    const fees = collapseChannelFees(channel);
    const denominador = 1 - fees.totalPercentageRate - margemAlvo;
    if (denominador <= 0) return null;
    return (custoTotal + fees.totalFixedFees) / denominador;
  }

  // Busca a faixa onde o preço alvo calculado é consistente com os limites da faixa
  for (const tier of tiers) {
    const fees = collapseChannelFees(channel, tier.sample);
    const denominador = 1 - fees.totalPercentageRate - margemAlvo;
    if (denominador <= 0) continue;
    const precoCand = (custoTotal + fees.totalFixedFees) / denominador;

    if (precoCand >= tier.min && (tier.max === null || precoCand < tier.max)) {
      return precoCand;
    }
  }

  // Tratamento de descontinuidade de borda (ex: degrau entre faixas)
  for (const tier of tiers) {
    if (tier.max !== null) {
      const margemNoCorte = margemReal(tier.max, custoTotal, channel);
      if (margemNoCorte !== null && margemNoCorte >= margemAlvo) {
        return tier.max;
      }
    }
  }

  const highestTier = tiers[tiers.length - 1];
  const feesHighest = collapseChannelFees(channel, highestTier.sample);
  const denominador = 1 - feesHighest.totalPercentageRate - margemAlvo;
  if (denominador <= 0) return null;
  return (custoTotal + feesHighest.totalFixedFees) / denominador;
}

export interface PriceTargets {
  precoEquilibrio: number | null;
  precoMinimoRecomendado: number | null;
  precoIdeal: number | null;
}

export function calcularPriceTargets(
  custoTotal: number,
  feesOrChannel: ChannelFees | MarketplaceChannel,
  margemSeguranca: number,
  margemAlvo: number,
): PriceTargets {
  return {
    precoEquilibrio: priceForTargetMargin(custoTotal, feesOrChannel, 0),
    precoMinimoRecomendado: priceForTargetMargin(custoTotal, feesOrChannel, margemSeguranca),
    precoIdeal: priceForTargetMargin(custoTotal, feesOrChannel, margemAlvo),
  };
}

export interface CostBreakdownItem {
  label: string;
  valor: number;
}

export interface CostBreakdown {
  itens: CostBreakdownItem[];
  lucro: number;
  preco: number;
  faixaDescricao?: string;
}

/** Breakdown de para onde vai cada centavo de um preço P — soma deve bater com P. */
export function costBreakdown(
  preco: number,
  custoTotal: number,
  channel: MarketplaceChannel,
): CostBreakdown {
  const fees = collapseChannelFees(channel, preco);
  const dynamic = resolveDynamicFees(channel, preco);
  const comissaoPct = dynamic.comissaoPct;
  const taxaFixa = dynamic.taxaFixa;
  const freteLiquido = dynamic.custoFreteLiquido;

  const itens: CostBreakdownItem[] = [
    { label: "Custo do produto", valor: custoTotal },
    {
      label: dynamic.faixaDescricao
        ? `Comissão (${Math.round(comissaoPct * 100)}%)`
        : "Comissão",
      valor: preco * comissaoPct,
    },
    { label: "Imposto", valor: preco * channel.impostoPct },
    { label: "Taxa de pagamento", valor: preco * channel.taxaPagamentoPct },
  ];

  if (channel.antecipacaoAtiva) {
    itens.push({ label: "Taxa de antecipação", valor: preco * channel.taxaAntecipacaoPct });
  }
  if (channel.tipoCustoAds === "percentual") {
    itens.push({ label: "Custo de anúncio", valor: preco * channel.custoAds });
  }

  const fretesFixos = taxaFixa + freteLiquido;
  if (fretesFixos > 0) {
    let labelFrete = "Taxa fixa + frete líquido";
    if (taxaFixa > 0 && freteLiquido === 0) labelFrete = "Taxa fixa / manuseio unitário";
    else if (taxaFixa === 0 && freteLiquido > 0) labelFrete = "Frete líquido obrigatório";
    itens.push({ label: labelFrete, valor: fretesFixos });
  }
  if (channel.tipoCustoAds === "fixo" && channel.custoAds > 0) {
    itens.push({ label: "Custo de anúncio (fixo)", valor: channel.custoAds });
  }

  for (const fee of channel.taxasPersonalizadas ?? []) {
    const valor = fee.tipo === "percentual" ? preco * fee.valor : fee.valor;
    itens.push({ label: fee.nome.trim() || "Taxa personalizada", valor });
  }

  const lucro = lucroLiquido(preco, custoTotal, fees);
  return { itens, lucro, preco, faixaDescricao: dynamic.faixaDescricao };
}

export interface DiscountSimulationInput {
  precoBase: number;
  custoTotal: number;
  channel: MarketplaceChannel;
  percentDiscount: number;
  fixedDiscount: number;
  freeShipping: boolean;
}

export interface DiscountSimulationResult {
  precoAntes: number;
  precoDepois: number;
  lucroAntes: number;
  lucroDepois: number;
  margemAntes: number | null;
  margemDepois: number | null;
  breakevenDepois: number | null;
  isPrejuizo: boolean;
  /**
   * Percentual decimal de aumento de volume necessário para manter o mesmo lucro bruto total anterior.
   * null se inviável (lucroDepois <= 0 ou lucroAntes <= 0), ou 0 se o lucroDepois for igual ou maior.
   */
  aumentoVolumeNecessarioPct: number | null;
}

export function simularDesconto(input: DiscountSimulationInput): DiscountSimulationResult {
  const { precoBase, custoTotal, channel, percentDiscount, fixedDiscount, freeShipping } = input;

  const precoDepois = precoBase * (1 - percentDiscount) - fixedDiscount;

  const feesAntes = collapseChannelFees(channel, precoBase);
  const feesDepoisBase = collapseChannelFees(channel, precoDepois);

  const feesDepois: ChannelFees = {
    totalPercentageRate: feesDepoisBase.totalPercentageRate,
    totalFixedFees: feesDepoisBase.totalFixedFees + (freeShipping ? channel.custoFrete : 0),
  };

  const lucroAntes = lucroLiquido(precoBase, custoTotal, feesAntes);
  const lucroDepois = lucroLiquido(precoDepois, custoTotal, feesDepois);
  const breakevenDepois = priceForTargetMargin(custoTotal, feesDepois, 0);

  let aumentoVolumeNecessarioPct: number | null = null;
  if (lucroDepois > 0 && lucroAntes > 0) {
    if (lucroDepois < lucroAntes) {
      aumentoVolumeNecessarioPct = (lucroAntes - lucroDepois) / lucroDepois;
    } else {
      aumentoVolumeNecessarioPct = 0;
    }
  }

  return {
    precoAntes: precoBase,
    precoDepois,
    lucroAntes,
    lucroDepois,
    margemAntes: margemReal(precoBase, custoTotal, feesAntes),
    margemDepois: margemReal(precoDepois, custoTotal, feesDepois),
    breakevenDepois,
    isPrejuizo: breakevenDepois !== null && precoDepois < breakevenDepois,
    aumentoVolumeNecessarioPct,
  };
}

export interface ReversePricingResult {
  custoMaximoViavel: number;
  /** presentes apenas se um produto real foi vinculado */
  custoReal?: number;
  lucroReal?: number;
  margemRealEstimada?: number | null;
  viavel?: boolean;
}

export function precificacaoReversa(
  precoConcorrente: number,
  channel: MarketplaceChannel,
  margemAlvo: number,
  custoRealProduto?: number,
): ReversePricingResult {
  const fees = collapseChannelFees(channel, precoConcorrente);
  const custoMaximoViavel =
    precoConcorrente * (1 - fees.totalPercentageRate - margemAlvo) - fees.totalFixedFees;

  if (custoRealProduto === undefined) {
    return { custoMaximoViavel };
  }

  const lucroReal = lucroLiquido(precoConcorrente, custoRealProduto, fees);
  return {
    custoMaximoViavel,
    custoReal: custoRealProduto,
    lucroReal,
    margemRealEstimada: margemReal(precoConcorrente, custoRealProduto, fees),
    viavel: custoRealProduto <= custoMaximoViavel,
  };
}
