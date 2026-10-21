const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** value é decimal (0.12 -> "12,00%") */
export function formatPercent(value: number, fractionDigits = 2): string {
  return `${(value * 100).toFixed(fractionDigits).replace(".", ",")}%`;
}

/** "1.234,56" -> 1234.56. Aceita string parcial durante digitação. */
export function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/** number -> string editável em pt-BR sem símbolo de moeda, ex 1234.5 -> "1234,50" */
export function formatDecimalInput(value: number): string {
  return decimalFormatter.format(value);
}

/** "12,5" -> 0.125 (decimal). Aceita string parcial durante digitação. */
export function parsePercentInput(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value / 100 : 0;
}

/** 0.125 -> "12,50" (sem símbolo %, para uso dentro do input) */
export function formatPercentInput(value: number): string {
  return decimalFormatter.format(value * 100);
}
