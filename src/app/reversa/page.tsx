"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReversePricingForm } from "@/components/reversa/ReversePricingForm";

function ReversaContent() {
  const searchParams = useSearchParams();
  const produtoId = searchParams.get("produtoId") ?? undefined;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-text">Precificação reversa</h1>
        <p className="text-sm text-text-muted">
          Informe o preço do concorrente e veja o custo máximo viável para manter sua margem.
        </p>
      </div>
      <ReversePricingForm initialProdutoId={produtoId} />
    </div>
  );
}

export default function ReversaPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-muted">Carregando…</p>}>
      <ReversaContent />
    </Suspense>
  );
}
