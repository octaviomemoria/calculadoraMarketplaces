export interface CostComponents {
  aquisicao: number;
  fabricacao: number;
  embalagem: number;
  etiqueta: number;
  armazenagem: number;
  maoDeObra: number;
  separacao: number;
  custoMedioDevolucoes: number;
  outrosCustosVariaveis: number;
}

export const COST_COMPONENT_KEYS: (keyof CostComponents)[] = [
  "aquisicao",
  "fabricacao",
  "embalagem",
  "etiqueta",
  "armazenagem",
  "maoDeObra",
  "separacao",
  "custoMedioDevolucoes",
  "outrosCustosVariaveis",
];

export const COST_COMPONENT_LABELS: Record<keyof CostComponents, string> = {
  aquisicao: "Custo de aquisição",
  fabricacao: "Custo de fabricação",
  embalagem: "Embalagem",
  etiqueta: "Etiqueta",
  armazenagem: "Armazenagem",
  maoDeObra: "Mão de obra",
  separacao: "Separação/expedição",
  custoMedioDevolucoes: "Custo médio de devoluções",
  outrosCustosVariaveis: "Outros custos variáveis",
};

export function emptyCostComponents(): CostComponents {
  return {
    aquisicao: 0,
    fabricacao: 0,
    embalagem: 0,
    etiqueta: 0,
    armazenagem: 0,
    maoDeObra: 0,
    separacao: 0,
    custoMedioDevolucoes: 0,
    outrosCustosVariaveis: 0,
  };
}

export interface Product {
  id: string;
  nome: string;
  sku?: string;
  custos: CostComponents;
  /** decimal, ex 0.20 = 20%. Se ausente, usa o padrão global de AppSettings. */
  margemAlvoPadrao?: number;
  createdAt: string;
  updatedAt: string;
}

export type TipoCustoAds = "percentual" | "fixo";

export interface CustomFee {
  id: string;
  nome: string;
  tipo: TipoCustoAds;
  /** decimal se tipo='percentual' (0.03 = 3%), R$ se 'fixo' */
  valor: number;
}

export type RegraDinamicaCanal =
  | "nenhuma"
  | "shopee_2026"
  | "mercadolivre"
  | "tiktok_shop_2026";

export interface MarketplaceChannel {
  id: string;
  nome: string;
  isCustom: boolean;
  ativo: boolean;
  /** Regra tarifária automatizada com faixas de preço específicas da plataforma */
  regraDinamica?: RegraDinamicaCanal;
  /** decimal, ex 0.12 = 12% */
  comissaoPct: number;
  /** R$ por venda */
  taxaFixa: number;
  /** R$, custo de envio pago pelo vendedor */
  custoFrete: number;
  /** R$, repasse/subsídio do marketplace no frete */
  subsidioFrete: number;
  /** decimal */
  taxaAntecipacaoPct: number;
  antecipacaoAtiva: boolean;
  /** R$ se tipoCustoAds='fixo', decimal se 'percentual' */
  custoAds: number;
  tipoCustoAds: TipoCustoAds;
  /** decimal */
  impostoPct: number;
  /** decimal, taxa de processamento de pagamento */
  taxaPagamentoPct: number;
  /** taxas/comissões adicionais nomeadas pelo usuário (impostos específicos, comissão de vendedor, etc.) */
  taxasPersonalizadas: CustomFee[];
  createdAt: string;
  updatedAt: string;
}

export type ThemePreference = "light" | "dark" | "system";

export interface AppSettings {
  /** decimal, ex 0.20 = 20% */
  margemAlvoPadrao: number;
  /** decimal, ex 0.05 = 5% */
  margemSegurancaPadrao: number;
  /** preferência visual de tema */
  theme?: ThemePreference;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  margemAlvoPadrao: 0.2,
  margemSegurancaPadrao: 0.05,
  theme: "system",
};
