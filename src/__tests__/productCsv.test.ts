import { describe, expect, it } from "vitest";
import { exportProductsToCsv, parseProductsCsv } from "@/lib/csv/productCsv";
import { DEFAULT_APP_SETTINGS, emptyCostComponents, type Product } from "@/lib/pricing/types";

describe("productCsv", () => {
  const sampleProducts: Product[] = [
    {
      id: "prod-1",
      nome: "Cabo USB-C Trançado",
      sku: "CAB-USBC-01",
      custos: {
        ...emptyCostComponents(),
        aquisicao: 12.5,
        embalagem: 1.5,
        outrosCustosVariaveis: 0.5,
      },
      margemAlvoPadrao: 0.25,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "prod-2",
      nome: 'Fone "Sem Fio" Bluetooth',
      sku: "FONE-BT-02",
      custos: {
        ...emptyCostComponents(),
        aquisicao: 45,
        embalagem: 3,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  it("exporta produtos corretamente para CSV com separador ;", () => {
    const csv = exportProductsToCsv(sampleProducts);
    expect(csv).toContain("Nome;SKU;Custo Produto (R$);Custo Embalagem (R$);Outros Custos (R$);Margem Alvo (%)");
    expect(csv).toContain('Cabo USB-C Trançado;CAB-USBC-01;"12,50";"1,50";"0,50";"25,0"');
    expect(csv).toContain('""Sem Fio""'); // escaped quotes
  });

  it("faz o parsing de CSV com ponto-e-vírgula e números com vírgula", () => {
    const csvData = [
      "Nome;SKU;Custo Produto;Custo Embalagem;Outros Custos;Margem Alvo",
      "Teclado Mecânico;TEC-MEC-01;120,50;8,00;2,50;22",
      "Mouse Gamer;MOU-GAM-02;65,00;5,00;0,00;20",
    ].join("\n");

    const result = parseProductsCsv(csvData, DEFAULT_APP_SETTINGS);
    expect(result.errors).toHaveLength(0);
    expect(result.validProducts).toHaveLength(2);

    const p1 = result.validProducts[0];
    expect(p1.nome).toBe("Teclado Mecânico");
    expect(p1.sku).toBe("TEC-MEC-01");
    expect(p1.custos.aquisicao).toBe(120.5);
    expect(p1.custos.embalagem).toBe(8);
    expect(p1.custos.outrosCustosVariaveis).toBe(2.5);
    expect(p1.margemAlvoPadrao).toBeCloseTo(0.22, 2);
  });

  it("faz o parsing de CSV com vírgula e campos entre aspas", () => {
    const csvData = [
      'Nome,SKU,Custo Produto,Custo Embalagem,Outros Custos,Margem Alvo',
      '"Smartwatch, Pro Series",SW-01,150.00,10.00,0.00,0.30',
    ].join("\n");

    const result = parseProductsCsv(csvData, DEFAULT_APP_SETTINGS);
    expect(result.errors).toHaveLength(0);
    expect(result.validProducts).toHaveLength(1);

    const p = result.validProducts[0];
    expect(p.nome).toBe("Smartwatch, Pro Series");
    expect(p.sku).toBe("SW-01");
    expect(p.custos.aquisicao).toBe(150);
    expect(p.margemAlvoPadrao).toBeCloseTo(0.3, 2);
  });
});
