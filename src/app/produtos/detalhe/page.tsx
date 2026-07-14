"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductForm } from "@/components/produtos/ProductForm";
import { ResultSummaryCard } from "@/components/resultados/ResultSummaryCard";
import { CostBreakdownBar } from "@/components/resultados/CostBreakdownBar";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import {
  calcularPriceTargets,
  collapseChannelFees,
  costBreakdown,
  custoTotalProduto,
  lucroLiquido,
  margemReal,
} from "@/lib/pricing/calculations";
import type { CostComponents, MarketplaceChannel } from "@/lib/pricing/types";

function ProdutoDetalheContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const product = useProductsStore((s) => s.getProduct(id));
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const channels = useChannelsStore((s) => s.channels);
  const margemAlvoPadrao = useSettingsStore((s) => s.margemAlvoPadrao);
  const margemSegurancaPadrao = useSettingsStore((s) => s.margemSegurancaPadrao);

  const activeChannels = channels.filter((c) => c.ativo);
  const [channelId, setChannelId] = useState<string>(activeChannels[0]?.id ?? "");
  const [margemSeguranca, setMargemSeguranca] = useState(margemSegurancaPadrao);

  if (!product) {
    return (
      <EmptyState
        title="Produto não encontrado"
        description="Ele pode ter sido excluído. Volte para a lista de produtos."
        action={
          <Link href="/produtos">
            <Button>Voltar para Produtos</Button>
          </Link>
        }
      />
    );
  }

  const custoTotal = custoTotalProduto(product.custos);
  const margemAlvo = product.margemAlvoPadrao ?? margemAlvoPadrao;
  const selectedChannel = activeChannels.find((c) => c.id === channelId) ?? activeChannels[0];

  const handleCustosChange = (next: CostComponents) => {
    updateProduct(product.id, { custos: next });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/produtos" className="text-xs text-text-muted hover:text-text">
            ← Produtos
          </Link>
          <h1 className="text-xl font-bold text-text">{product.nome}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/comparacao?produtoId=${product.id}`}>
            <Button variant="secondary">Comparar canais</Button>
          </Link>
          <Link href={`/reversa?produtoId=${product.id}`}>
            <Button variant="secondary">Precificação reversa</Button>
          </Link>
        </div>
      </div>

      <Card>
        <ProductForm
          nome={product.nome}
          onNomeChange={(nome) => updateProduct(product.id, { nome })}
          sku={product.sku ?? ""}
          onSkuChange={(sku) => updateProduct(product.id, { sku: sku || undefined })}
          custos={product.custos}
          onCustosChange={handleCustosChange}
        />
      </Card>

      {activeChannels.length === 0 ? (
        <EmptyState
          title="Nenhum canal ativo"
          description="Configure ou ative um marketplace na tela de Canais para calcular preços."
          action={
            <Link href="/canais">
              <Button>Ir para Canais</Button>
            </Link>
          }
        />
      ) : (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">Canal</span>
            <select
              value={selectedChannel?.id ?? ""}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary"
            >
              {activeChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          {selectedChannel && (
            <ResultadosDoCanal
              custoTotal={custoTotal}
              channel={selectedChannel}
              margemAlvo={margemAlvo}
              onMargemAlvoChange={(v) => updateProduct(product.id, { margemAlvoPadrao: v })}
              margemSeguranca={margemSeguranca}
              onMargemSegurancaChange={setMargemSeguranca}
              produtoId={product.id}
            />
          )}
        </>
      )}
    </div>
  );
}

function ResultadosDoCanal({
  custoTotal,
  channel,
  margemAlvo,
  onMargemAlvoChange,
  margemSeguranca,
  onMargemSegurancaChange,
  produtoId,
}: {
  custoTotal: number;
  channel: MarketplaceChannel;
  margemAlvo: number;
  onMargemAlvoChange: (v: number) => void;
  margemSeguranca: number;
  onMargemSegurancaChange: (v: number) => void;
  produtoId: string;
}) {
  const fees = collapseChannelFees(channel);
  const targets = calcularPriceTargets(custoTotal, fees, margemSeguranca, margemAlvo);
  const impossivel = targets.precoIdeal === null;

  const lucroNoIdeal =
    targets.precoIdeal !== null ? lucroLiquido(targets.precoIdeal, custoTotal, fees) : null;
  const margemNoIdeal =
    targets.precoIdeal !== null ? margemReal(targets.precoIdeal, custoTotal, fees) : null;

  return (
    <div className="flex flex-col gap-4">
      <ResultSummaryCard
        targets={targets}
        lucroNoIdeal={lucroNoIdeal}
        margemNoIdeal={margemNoIdeal}
        margemAlvo={margemAlvo}
        onMargemAlvoChange={onMargemAlvoChange}
        margemSeguranca={margemSeguranca}
        onMargemSegurancaChange={onMargemSegurancaChange}
        impossivel={impossivel}
      />

      {!impossivel && targets.precoIdeal !== null && (
        <>
          <CostBreakdownBar breakdown={costBreakdown(targets.precoIdeal, custoTotal, channel)} />
          <div className="flex justify-end">
            <Link href={`/desconto?produtoId=${produtoId}&canalId=${channel.id}`}>
              <Button variant="secondary">Simular desconto neste canal →</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProdutoDetalhePage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-muted">Carregando…</p>}>
      <ProdutoDetalheContent />
    </Suspense>
  );
}
