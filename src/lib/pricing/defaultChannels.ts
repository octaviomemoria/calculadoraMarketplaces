import type { CustomFee, MarketplaceChannel } from "./types";

/**
 * Valores iniciais aproximados, só para dar um ponto de partida realista.
 * Todos os campos são editáveis na tela de Canais — marketplaces mudam
 * taxas com frequência, então nada aqui deve ser tratado como definitivo.
 */
type DefaultChannelSeed = Omit<MarketplaceChannel, "id" | "createdAt" | "updatedAt">;

const now = () => new Date().toISOString();

/** Cria uma linha de taxa personalizada (usada para fulfillment/armazenagem das modalidades Full/FBA). */
function fee(nome: string, valor: number, tipo: CustomFee["tipo"] = "fixo"): CustomFee {
  return { id: crypto.randomUUID(), nome, tipo, valor };
}

function seed(partial: Partial<DefaultChannelSeed> & { nome: string }): MarketplaceChannel {
  const ts = now();
  return {
    id: crypto.randomUUID(),
    isCustom: false,
    ativo: true,
    regraDinamica: "nenhuma",
    comissaoPct: 0,
    taxaFixa: 0,
    custoFrete: 0,
    subsidioFrete: 0,
    taxaAntecipacaoPct: 0,
    antecipacaoAtiva: false,
    custoAds: 0,
    tipoCustoAds: "percentual",
    impostoPct: 0.04,
    taxaPagamentoPct: 0,
    taxasPersonalizadas: [],
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

export function createDefaultChannels(): MarketplaceChannel[] {
  return [
    seed({
      nome: "Mercado Livre Clássico",
      regraDinamica: "mercadolivre",
      comissaoPct: 0.12,
      taxaFixa: 6,
      custoFrete: 18,
      subsidioFrete: 10,
      custoAds: 0.05,
      tipoCustoAds: "percentual",
    }),
    seed({
      nome: "Mercado Livre Premium",
      regraDinamica: "mercadolivre",
      comissaoPct: 0.17,
      taxaFixa: 6,
      custoFrete: 18,
      subsidioFrete: 10,
      custoAds: 0.05,
      tipoCustoAds: "percentual",
    }),
    seed({
      nome: "Mercado Livre Full",
      regraDinamica: "mercadolivre",
      comissaoPct: 0.17,
      taxaFixa: 6,
      custoFrete: 0,
      subsidioFrete: 0,
      custoAds: 0.05,
      tipoCustoAds: "percentual",
      taxasPersonalizadas: [fee("Armazenagem/Full", 6)],
    }),
    seed({
      nome: "Shopee",
      regraDinamica: "shopee_2026",
      comissaoPct: 0.2,
      taxaFixa: 4,
      custoFrete: 20,
      subsidioFrete: 20,
      custoAds: 0.04,
      tipoCustoAds: "percentual",
    }),
    seed({
      nome: "Amazon FBM",
      regraDinamica: "nenhuma",
      comissaoPct: 0.15,
      taxaFixa: 0,
      custoFrete: 15,
      subsidioFrete: 6,
      custoAds: 0.06,
      tipoCustoAds: "percentual",
    }),
    seed({
      nome: "Amazon FBA",
      regraDinamica: "nenhuma",
      comissaoPct: 0.15,
      taxaFixa: 0,
      custoFrete: 0,
      subsidioFrete: 0,
      custoAds: 0.06,
      tipoCustoAds: "percentual",
      taxasPersonalizadas: [fee("Fulfillment FBA", 10)],
    }),
    seed({
      nome: "Magalu",
      regraDinamica: "nenhuma",
      comissaoPct: 0.16,
      taxaFixa: 4,
      custoFrete: 15,
      subsidioFrete: 7,
      custoAds: 0.03,
      tipoCustoAds: "percentual",
    }),
    seed({
      nome: "Magalu Full",
      regraDinamica: "nenhuma",
      comissaoPct: 0.16,
      taxaFixa: 4,
      custoFrete: 0,
      subsidioFrete: 0,
      custoAds: 0.03,
      tipoCustoAds: "percentual",
      taxasPersonalizadas: [fee("Fulfillment Magalu", 8)],
    }),
    seed({
      nome: "TikTok Shop",
      regraDinamica: "tiktok_shop_2026",
      comissaoPct: 0.12,
      taxaFixa: 4,
      custoFrete: 12,
      subsidioFrete: 6,
      custoAds: 0.05,
      tipoCustoAds: "percentual",
    }),
    seed({
      nome: "Shein",
      regraDinamica: "nenhuma",
      comissaoPct: 0.18,
      taxaFixa: 0,
      custoFrete: 10,
      subsidioFrete: 5,
    }),
    seed({
      nome: "Americanas",
      regraDinamica: "nenhuma",
      comissaoPct: 0.16,
      taxaFixa: 5,
      custoFrete: 15,
      subsidioFrete: 6,
      custoAds: 0.03,
      tipoCustoAds: "percentual",
    }),
    seed({
      nome: "Loja Própria",
      comissaoPct: 0.02,
      taxaFixa: 0.5,
      custoFrete: 15,
      subsidioFrete: 0,
      taxaPagamentoPct: 0.03,
    }),
    seed({
      nome: "WhatsApp",
      comissaoPct: 0,
      taxaFixa: 0,
      custoFrete: 12,
      subsidioFrete: 0,
      taxaPagamentoPct: 0.03,
    }),
    seed({
      nome: "Venda Física",
      comissaoPct: 0,
      taxaFixa: 0,
      custoFrete: 0,
      subsidioFrete: 0,
      taxaPagamentoPct: 0.02,
    }),
  ];
}
