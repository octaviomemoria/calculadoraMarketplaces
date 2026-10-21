/**
 * Preset de referência para o subsídio de frete grátis do Mercado Livre por
 * reputação do vendedor. NÃO confirmado na página oficial de ajuda do ML (o
 * acesso automatizado foi bloqueado) — baseado em fontes de terceiros
 * consultadas em julho/2026. Trate como ponto de partida, não como verdade
 * definitiva: confira na sua própria conta antes de confiar nos números.
 */

export type NivelReputacao = "vermelha_laranja" | "amarela" | "verde_mercadolider";
export type FaixaPreco = "ate_19" | "de_19_a_79" | "acima_79";

export const REPUTACAO_LABELS: Record<NivelReputacao, string> = {
  vermelha_laranja: "Vermelha ou Laranja (sem desconto)",
  amarela: "Amarela (60% de desconto)",
  verde_mercadolider: "Verde ou MercadoLíder (70% de desconto)",
};

export const FAIXA_PRECO_LABELS: Record<FaixaPreco, string> = {
  ate_19: "Abaixo de R$ 19 (frete por conta do comprador)",
  de_19_a_79: "R$ 19 a R$ 78,99 (vendedor não paga frete obrigatório no envio individual)",
  acima_79: "A partir de R$ 79 (frete grátis obrigatório ao vendedor, com desconto por reputação)",
};

const DESCONTO_POR_REPUTACAO: Record<NivelReputacao, number> = {
  vermelha_laranja: 0,
  amarela: 0.6,
  verde_mercadolider: 0.7,
};

/** Estima o subsídio de frete (valor que o marketplace cobre) dado o custo de frete cheio. */
export function calcularSubsidioFretePreset(
  custoFrete: number,
  faixa: FaixaPreco,
  reputacao: NivelReputacao,
): number {
  if (faixa === "ate_19") return 0;
  if (faixa === "de_19_a_79") return custoFrete;
  return custoFrete * DESCONTO_POR_REPUTACAO[reputacao];
}
