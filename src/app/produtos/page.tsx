"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductList } from "@/components/produtos/ProductList";
import { useProductsStore } from "@/lib/store/useProductsStore";

export default function ProdutosPage() {
  const products = useProductsStore((s) => s.products);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Produtos</h1>
        <Link href="/produtos/novo">
          <Button>+ Novo Produto</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado ainda"
          description="Cadastre um produto com seus custos para calcular o preço mínimo, ideal e comparar entre marketplaces."
          action={
            <Link href="/produtos/novo">
              <Button>+ Novo Produto</Button>
            </Link>
          }
        />
      ) : (
        <ProductList products={products} />
      )}
    </div>
  );
}
