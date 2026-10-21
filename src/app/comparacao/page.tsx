"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ProductPicker } from "@/components/produtos/ProductPicker";
import { ComparisonTable, type ComparisonRow } from "@/components/resultados/ComparisonTable";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { CopySummaryButton } from "@/components/ui/CopySummaryButton";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import {
  calcularPriceTargets,
  custoTotalProduto,
  lucroLiquido,
  margemReal,
} from "@/lib/pricing/calculations";

function ComparacaoContent() {
  const searchParams = useSearchParams();
  const produtoId = searchParams.get("produtoId");

  const product = useProductsStore((s) => (produtoId ? s.getProduct(produtoId) : undefined));
  const channels = useChannelsStore((s) => s.channels);
  const margemAlvoPadrao = useSettingsStore((s) => s.margemAlvoPadrao);
  const margemSegurancaPadrao = useSettingsStore((s) => s.margemSegurancaPadrao);

  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const activeChannels = channels.filter((c) => c.ativo);

  const rows: ComparisonRow[] = useMemo(() => {
    if (!product) return [];
    const custoTotal = custoTotalProduto(product.custos);
    const margemAlvo = product.margemAlvoPadrao ?? margemAlvoPadrao;

    return activeChannels.map((channel) => {
      const targets = calcularPriceTargets(custoTotal, channel, margemSegurancaPadrao, margemAlvo);
      const precoPraticado = overrides[channel.id] ?? targets.precoIdeal ?? 0;
      return {
        channelId: channel.id,
        channelName: channel.nome,
        precoIdeal: targets.precoIdeal,
        precoPraticado,
        lucro: lucroLiquido(precoPraticado, custoTotal, channel),
        margem: margemReal(precoPraticado, custoTotal, channel),
      };
    });
  }, [product, activeChannels, overrides, margemAlvoPadrao, margemSegurancaPadrao]);

  if (!produtoId) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-text">Comparação entre canais</h1>
        <ProductPicker
          title="Escolha um produto para comparar entre os canais ativos"
          hrefFor={(id) => `/comparacao?produtoId=${id}`}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Produto não encontrado"
        action={
          <Link href="/comparacao">
            <Button>Escolher outro produto</Button>
          </Link>
        }
      />
    );
  }

  function getWhatsAppComparisonSummary() {
    if (!product) return "";
    const custoTotal = custoTotalProduto(product.custos);
    const sorted = [...rows].sort((a, b) => b.lucro - a.lucro);
    const melhor = sorted[0];

    const linhas = [
      `📊 *Comparativo de Canais: ${product.nome}*`,
      `• *Custo real do produto:* ${formatCurrency(custoTotal)}`,
      melhor ? `• *Melhor retorno:* 🏆 ${melhor.channelName} (${formatCurrency(melhor.lucro)} líquido)` : null,
      ``,
      `*Desempenho por Canal:*`,
      ...sorted.map((r, i) => {
        const medal = i === 0 ? "🥇 " : "";
        const preco = r.precoPraticado > 0 ? formatCurrency(r.precoPraticado) : "—";
        const lucro = formatCurrency(r.lucro);
        const margem = r.margem !== null ? formatPercent(r.margem) : "—";
        return `${medal}• *${r.channelName}*: Preço ${preco} ➔ Lucro: ${lucro} (${margem})`;
      }),
      ``,
      `_Calculado via Margem Certa 🚀_`,
    ].filter(Boolean);

    return linhas.join("\n");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/comparacao" className="text-xs text-text-muted hover:text-text">
            ← Trocar produto
          </Link>
          <h1 className="text-xl font-bold text-text">Comparação — {product.nome}</h1>
        </div>
        {rows.length > 0 && (
          <CopySummaryButton
            getText={getWhatsAppComparisonSummary}
            label="Copiar comparativo (WhatsApp)"
          />
        )}
      </div>

      {activeChannels.length === 0 ? (
        <EmptyState
          title="Nenhum canal ativo"
          description="Ative pelo menos um canal na tela de Canais."
          action={
            <Link href="/canais">
              <Button>Ir para Canais</Button>
            </Link>
          }
        />
      ) : (
        <ComparisonTable
          rows={rows}
          onPrecoPraticadoChange={(channelId, value) =>
            setOverrides((prev) => ({ ...prev, [channelId]: value }))
          }
        />
      )}
    </div>
  );
}

export default function ComparacaoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-muted">Carregando…</p>}>
      <ComparacaoContent />
    </Suspense>
  );
}
