import { emptyCostComponents, type Product, type AppSettings } from "@/lib/pricing/types";

function escapeCsvField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converte a lista de produtos cadastrados em uma string CSV estruturada (separador ponto-e-vírgula para compatibilidade nativa com Excel BR).
 */
export function exportProductsToCsv(products: Product[]): string {
  const header = [
    "Nome",
    "SKU",
    "Custo Produto (R$)",
    "Custo Embalagem (R$)",
    "Outros Custos (R$)",
    "Margem Alvo (%)",
  ].join(";");

  const rows = products.map((p) => {
    const custoProduto = p.custos.aquisicao > 0 ? p.custos.aquisicao : p.custos.fabricacao;
    const custoEmbalagem = p.custos.embalagem;
    const outrosCustos =
      p.custos.etiqueta +
      p.custos.armazenagem +
      p.custos.maoDeObra +
      p.custos.separacao +
      p.custos.custoMedioDevolucoes +
      p.custos.outrosCustosVariaveis;

    return [
      escapeCsvField(p.nome),
      escapeCsvField(p.sku ?? ""),
      escapeCsvField(custoProduto.toFixed(2).replace(".", ",")),
      escapeCsvField(custoEmbalagem.toFixed(2).replace(".", ",")),
      escapeCsvField(outrosCustos.toFixed(2).replace(".", ",")),
      escapeCsvField(
        p.margemAlvoPadrao !== undefined
          ? (p.margemAlvoPadrao * 100).toFixed(1).replace(".", ",")
          : ""
      ),
    ].join(";");
  });

  return [header, ...rows].join("\r\n");
}

function parseDecimal(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.trim().replace("R$", "").replace("%", "").replace(/\s/g, "");
  // Se tem vírgula e ponto (ex: 1.234,56), remove pontos de milhar e troca vírgula por ponto
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  // Se tem apenas vírgula (ex: 12,50)
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(",", ".")) || 0;
  }
  return parseFloat(cleaned) || 0;
}

/**
 * Faz o parsing de um arquivo CSV (vírgula ou ponto-e-vírgula) para objetos de Produto.
 */
export function parseProductsCsv(
  csvText: string,
  _defaultSettings?: AppSettings
): { validProducts: Omit<Product, "id" | "createdAt" | "updatedAt">[]; errors: string[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      validProducts: [],
      errors: ["O arquivo CSV está vazio ou contém apenas o cabeçalho."],
    };
  }

  // Detecta delimitador na primeira linha
  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // pula aspas escapadas
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const rawHeaders = splitLine(firstLine).map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
  );

  // Mapeia índices de colunas com flexibilidade
  const colNome = rawHeaders.findIndex((h) => h.includes("nome") || h.includes("produto") || h.includes("titulo"));
  const colSku = rawHeaders.findIndex((h) => h.includes("sku") || h.includes("codigo") || h.includes("referencia"));
  const colCusto = rawHeaders.findIndex(
    (h) => h.includes("custoproduto") || (h.includes("custo") && !h.includes("embalagem") && !h.includes("outro"))
  );
  const colEmbalagem = rawHeaders.findIndex((h) => h.includes("embalagem"));
  const colOutros = rawHeaders.findIndex((h) => h.includes("outro"));
  const colMargemAlvo = rawHeaders.findIndex((h) => h.includes("alvo") || h.includes("margem"));

  if (colNome === -1 && colCusto === -1) {
    return {
      validProducts: [],
      errors: ["Não foi possível identificar as colunas de 'Nome' ou 'Custo' no cabeçalho do arquivo."],
    };
  }

  const validProducts: Omit<Product, "id" | "createdAt" | "updatedAt">[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitLine(lines[i]);
    const nome = colNome >= 0 ? row[colNome] : `Produto Linha ${i}`;
    if (!nome) {
      continue; // pula linhas em branco
    }

    const sku = colSku >= 0 && row[colSku] ? row[colSku] : undefined;
    const custoProduto = colCusto >= 0 ? parseDecimal(row[colCusto]) : 0;
    const custoEmbalagem = colEmbalagem >= 0 ? parseDecimal(row[colEmbalagem]) : 0;
    const outrosCustos = colOutros >= 0 ? parseDecimal(row[colOutros]) : 0;

    const rawMargemAlvo = colMargemAlvo >= 0 ? row[colMargemAlvo] : undefined;
    let margemAlvoPadrao: number | undefined = undefined;
    if (rawMargemAlvo) {
      const parsed = parseDecimal(rawMargemAlvo);
      // Se digitou > 1 (ex: 20 para 20%), divide por 100
      margemAlvoPadrao = parsed > 1 ? parsed / 100 : parsed;
    }

    validProducts.push({
      nome,
      sku,
      custos: {
        ...emptyCostComponents(),
        aquisicao: custoProduto,
        embalagem: custoEmbalagem,
        outrosCustosVariaveis: outrosCustos,
      },
      margemAlvoPadrao,
    });
  }

  return { validProducts, errors };
}
