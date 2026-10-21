"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProductsStore } from "@/lib/store/useProductsStore";

export function ProductPicker({
  title,
  hrefFor,
}: {
  title: string;
  hrefFor: (produtoId: string) => string;
}) {
  const products = useProductsStore((s) => s.products);

  if (products.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto cadastrado ainda"
        description="Cadastre um produto primeiro para usar esta ferramenta."
        action={
          <Link href="/produtos/novo">
            <Button>+ Novo Produto</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-text">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {products.map((p) => (
          <Link key={p.id} href={hrefFor(p.id)}>
            <Card className="hover:border-primary">
              <p className="font-medium text-text">{p.nome}</p>
              {p.sku && <p className="text-xs text-text-muted">SKU {p.sku}</p>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
