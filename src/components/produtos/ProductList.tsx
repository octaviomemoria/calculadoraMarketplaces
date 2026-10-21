"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { custoTotalProduto } from "@/lib/pricing/calculations";
import { formatCurrency } from "@/lib/format/currency";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { exportProductsToCsv } from "@/lib/csv/productCsv";
import { DownloadIcon } from "@/components/ui/Icons";
import type { Product } from "@/lib/pricing/types";

type SortOption = "recentes" | "nome" | "maior_custo" | "menor_custo";

export function ProductList({ products }: { products: Product[] }) {
  const removeProduct = useProductsStore((s) => s.removeProduct);
  const duplicateProduct = useProductsStore((s) => s.duplicateProduct);

  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<SortOption>("recentes");

  const filteredAndSorted = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = products.filter((p) => {
      if (!termo) return true;
      const matchNome = p.nome.toLowerCase().includes(termo);
      const matchSku = p.sku?.toLowerCase().includes(termo) ?? false;
      return matchNome || matchSku;
    });

    return filtrados.sort((a, b) => {
      if (ordenacao === "nome") {
        return a.nome.localeCompare(b.nome);
      }
      if (ordenacao === "maior_custo") {
        return custoTotalProduto(b.custos) - custoTotalProduto(a.custos);
      }
      if (ordenacao === "menor_custo") {
        return custoTotalProduto(a.custos) - custoTotalProduto(b.custos);
      }
      // "recentes" padrão
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, busca, ordenacao]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controles de busca e ordenação */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou SKU..."
            className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary pr-8"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text"
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted whitespace-nowrap">Ordenar por:</span>
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as SortOption)}
            className="rounded-xl border border-border bg-bg-elevated px-2.5 py-2 text-xs font-medium text-text outline-none focus:border-primary"
          >
            <option value="recentes">Mais recentes</option>
            <option value="nome">Nome (A-Z)</option>
            <option value="maior_custo">Maior custo</option>
            <option value="menor_custo">Menor custo</option>
          </select>

          <button
            type="button"
            onClick={() => {
              const csv = exportProductsToCsv(products);
              const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `produtos-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-bg-elevated px-2.5 py-2 text-xs font-medium text-text hover:bg-bg-muted transition-colors whitespace-nowrap"
            title="Exportar todos os produtos para CSV"
          >
            <DownloadIcon size={14} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {busca && (
        <p className="text-xs text-text-muted">
          Exibindo {filteredAndSorted.length} de {products.length} {products.length === 1 ? "produto" : "produtos"}
        </p>
      )}

      {/* Lista de itens ou estado vazio de busca */}
      {filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-8 text-center">
          <p className="text-sm font-medium text-text">Nenhum produto encontrado</p>
          <p className="mt-1 text-xs text-text-muted">
            Não encontramos resultados para &ldquo;{busca}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setBusca("")}
            className="mt-3 text-xs font-semibold text-primary underline"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAndSorted.map((product) => {
            const total = custoTotalProduto(product.custos);
            return (
              <Card key={product.id} className="flex items-center justify-between gap-3 hover:border-primary/50 transition-colors">
                <Link href={`/produtos/detalhe?id=${product.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text">{product.nome}</p>
                  <p className="text-xs text-text-muted">
                    {product.sku ? `SKU ${product.sku} · ` : ""}Custo real {formatCurrency(total)}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link href={`/produtos/detalhe?id=${product.id}`}>
                    <Button variant="secondary">Ver</Button>
                  </Link>
                  <Button variant="secondary" onClick={() => duplicateProduct(product.id)}>
                    Duplicar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Excluir "${product.nome}"?`)) {
                        removeProduct(product.id);
                      }
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
