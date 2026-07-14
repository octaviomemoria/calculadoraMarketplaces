import { describe, expect, it } from "vitest";
import { calcularSubsidioFretePreset } from "@/lib/pricing/shippingPresets";

describe("calcularSubsidioFretePreset", () => {
  it("abaixo de R$19: frete grátis não obrigatório, subsídio zero", () => {
    expect(calcularSubsidioFretePreset(20, "ate_19", "verde_mercadolider")).toBe(0);
    expect(calcularSubsidioFretePreset(20, "ate_19", "vermelha_laranja")).toBe(0);
  });

  it("R$19 a R$78,99: Mercado Livre paga 100% do frete, independente da reputação", () => {
    expect(calcularSubsidioFretePreset(20, "de_19_a_79", "vermelha_laranja")).toBe(20);
    expect(calcularSubsidioFretePreset(20, "de_19_a_79", "verde_mercadolider")).toBe(20);
  });

  it("acima de R$79: desconto proporcional à reputação", () => {
    expect(calcularSubsidioFretePreset(20, "acima_79", "vermelha_laranja")).toBe(0);
    expect(calcularSubsidioFretePreset(20, "acima_79", "amarela")).toBeCloseTo(12, 6);
    expect(calcularSubsidioFretePreset(20, "acima_79", "verde_mercadolider")).toBeCloseTo(14, 6);
  });
});
