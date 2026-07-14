"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/produtos/ProductForm";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { emptyCostComponents, type CostComponents } from "@/lib/pricing/types";

export default function NovoProdutoPage() {
  const router = useRouter();
  const addProduct = useProductsStore((s) => s.addProduct);

  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [custos, setCustos] = useState<CostComponents>(emptyCostComponents());

  const canSave = nome.trim().length > 0;

  function handleSalvar() {
    if (!canSave) return;
    const product = addProduct(nome.trim(), custos, sku.trim() || undefined);
    router.push(`/produtos/detalhe?id=${product.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Novo produto</h1>
        <Link href="/produtos" className="text-sm text-text-muted hover:text-text">
          Cancelar
        </Link>
      </div>

      <ProductForm
        nome={nome}
        onNomeChange={setNome}
        sku={sku}
        onSkuChange={setSku}
        custos={custos}
        onCustosChange={setCustos}
      />

      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={!canSave}>
          Salvar produto
        </Button>
      </div>
    </div>
  );
}
