import { describe, expect, it } from "vitest";
import {
  calcularIndicadoresOficiais,
  isMercadoLivreChannelName,
} from "@/components/mercadolivre/MercadoLivrePanel";

describe("painel oficial do Mercado Livre", () => {
  it("calcula líquido/preço e líquido/custo no exemplo aprovado", () => {
    const result = calcularIndicadoresOficiais(49.67, 20.27, 19.81);

    expect(result?.netReceived).toBeCloseTo(29.86, 2);
    expect(result?.liquidoSobrePreco).toBeCloseTo(0.6012, 4);
    expect(result?.liquidoSobreCusto).toBeCloseTo(1.4731, 4);
  });

  it("não cria indicadores quando preço ou custo são inválidos", () => {
    expect(calcularIndicadoresOficiais(0, 20.27, 19.81)).toBeNull();
    expect(calcularIndicadoresOficiais(49.67, 0, 19.81)).toBeNull();
  });

  it("identifica somente canais Mercado Livre", () => {
    expect(isMercadoLivreChannelName("Mercado Livre Clássico")).toBe(true);
    expect(isMercadoLivreChannelName("Shopee")).toBe(false);
  });
});
