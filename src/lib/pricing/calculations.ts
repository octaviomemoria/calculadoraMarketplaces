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

export function collapseChannelFees(channel: MarketplaceChannel): ChannelFees {
  const custom = channel.taxasPersonalizadas ?? [];
  const customPercentageRate = custom
    .filter((f) => f.tipo === "percentual")
    .reduce((sum, f) => sum + f.valor, 0);
  const customFixedFees = custom
    .filter((f) => f.tipo === "fixo")
    .reduce((sum, f) => sum + f.valor, 0);

  const totalPercentageRate =
    channel.comissaoPct +
    channel.impostoPct +
    channel.taxaPagamentoPct +
    (channel.antecipacaoAtiva ? channel.taxaAntecipacaoPct : 0) +
    (channel.tipoCustoAds === "percentual" ? channel.custoAds : 0) +
    customPercentageRate;

  const totalFixedFees =
    channel.taxaFixa +
    Math.max(channel.custoFrete - channel.subsidioFrete, 0) +
    (channel.tipoCustoAds === "fixo" ? channel.custoAds : 0) +
    customFixedFees;

  return { totalPercentageRate, totalFixedFees };
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

export function lucroLiquido(preco: number, custoTotal: number, fees: ChannelFees): number {
  return preco * (1 - fees.totalPercentageRate) - custoTotal - fees.totalFixedFees;
}

export function margemReal(preco: number, custoTotal: number, fees: ChannelFees): number | null {
  if (preco === 0) return null;
  return lucroLiquido(preco, custoTotal, fees) / preco;
}

/**
 * Resolve lucroLiquido(P)/P = margemAlvo para P.
 * Retorna null se as taxas + margem alvo somarem 100% ou mais do preço (impossível de atingir).
 */
export function priceForTargetMargin(
  custoTotal: number,
  fees: ChannelFees,
  margemAlvo: number,
): number | null {
  const denominador = 1 - fees.totalPercentageRate - margemAlvo;
  if (denominador <= 0) return null;
  return (custoTotal + fees.totalFixedFees) / denominador;
}

export interface PriceTargets {
  precoEquilibrio: number | null;
  precoMinimoRecomendado: number | null;
  precoIdeal: number | null;
}

export function calcularPriceTargets(
  custoTotal: number,
  fees: ChannelFees,
  margemSeguranca: number,
  margemAlvo: number,
): PriceTargets {
  return {
    precoEquilibrio: priceForTargetMargin(custoTotal, fees, 0),
    precoMinimoRecomendado: priceForTargetMargin(custoTotal, fees, margemSeguranca),
    precoIdeal: priceForTargetMargin(custoTotal, fees, margemAlvo),
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
}

/** Breakdown de para onde vai cada centavo de um preço P — soma deve bater com P. */
export function costBreakdown(
  preco: number,
  custoTotal: number,
  channel: MarketplaceChannel,
): CostBreakdown {
  const fees = collapseChannelFees(channel);
  const itens: CostBreakdownItem[] = [
    { label: "Custo do produto", valor: custoTotal },
    { label: "Comissão", valor: preco * channel.comissaoPct },
    { label: "Imposto", valor: preco * channel.impostoPct },
    { label: "Taxa de pagamento", valor: preco * channel.taxaPagamentoPct },
  ];

  if (channel.antecipacaoAtiva) {
    itens.push({ label: "Taxa de antecipação", valor: preco * channel.taxaAntecipacaoPct });
  }
  if (channel.tipoCustoAds === "percentual") {
    itens.push({ label: "Custo de anúncio", valor: preco * channel.custoAds });
  }

  const fretesFixos = channel.taxaFixa + Math.max(channel.custoFrete - channel.subsidioFrete, 0);
  if (fretesFixos > 0) {
    itens.push({ label: "Taxa fixa + frete líquido", valor: fretesFixos });
  }
  if (channel.tipoCustoAds === "fixo" && channel.custoAds > 0) {
    itens.push({ label: "Custo de anúncio (fixo)", valor: channel.custoAds });
  }

  for (const fee of channel.taxasPersonalizadas ?? []) {
    const valor = fee.tipo === "percentual" ? preco * fee.valor : fee.valor;
    itens.push({ label: fee.nome.trim() || "Taxa personalizada", valor });
  }

  const lucro = lucroLiquido(preco, custoTotal, fees);
  return { itens, lucro, preco };
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
}

export function simularDesconto(input: DiscountSimulationInput): DiscountSimulationResult {
  const { precoBase, custoTotal, channel, percentDiscount, fixedDiscount, freeShipping } = input;

  const feesAntes = collapseChannelFees(channel);
  const precoDepois = precoBase * (1 - percentDiscount) - fixedDiscount;

  const feesDepois: ChannelFees = {
    totalPercentageRate: feesAntes.totalPercentageRate,
    totalFixedFees: feesAntes.totalFixedFees + (freeShipping ? channel.custoFrete : 0),
  };

  const lucroAntes = lucroLiquido(precoBase, custoTotal, feesAntes);
  const lucroDepois = lucroLiquido(precoDepois, custoTotal, feesDepois);
  const breakevenDepois = priceForTargetMargin(custoTotal, feesDepois, 0);

  return {
    precoAntes: precoBase,
    precoDepois,
    lucroAntes,
    lucroDepois,
    margemAntes: margemReal(precoBase, custoTotal, feesAntes),
    margemDepois: margemReal(precoDepois, custoTotal, feesDepois),
    breakevenDepois,
    isPrejuizo: breakevenDepois !== null && precoDepois < breakevenDepois,
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
  const fees = collapseChannelFees(channel);
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
