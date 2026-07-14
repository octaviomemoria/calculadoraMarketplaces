"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { custoTotalProduto } from "@/lib/pricing/calculations";
import { formatCurrency } from "@/lib/format/currency";
import { useProductsStore } from "@/lib/store/useProductsStore";
import type { Product } from "@/lib/pricing/types";

export function ProductList({ products }: { products: Product[] }) {
  const removeProduct = useProductsStore((s) => s.removeProduct);
  const duplicateProduct = useProductsStore((s) => s.duplicateProduct);

  return (
    <div className="flex flex-col gap-3">
      {products.map((product) => {
        const total = custoTotalProduto(product.custos);
        return (
          <Card key={product.id} className="flex items-center justify-between gap-3">
            <Link href={`/produtos/detalhe?id=${product.id}`} className="min-w-0 flex-1">
              <p className="truncate font-semibold text-text">{product.nome}</p>
              <p className="text-xs text-text-muted">
                {product.sku ? `SKU ${product.sku} · ` : ""}Custo total {formatCurrency(total)}
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
  );
}
