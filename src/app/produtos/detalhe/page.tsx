"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { CopySummaryButton } from "@/components/ui/CopySummaryButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductForm } from "@/components/produtos/ProductForm";
import { ResultSummaryCard } from "@/components/resultados/ResultSummaryCard";
import { CostBreakdownBar } from "@/components/resultados/CostBreakdownBar";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import {
  calcularPriceTargets,
  costBreakdown,
  custoTotalProduto,
  indicadoresMarkup,
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
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Canal de Venda
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeChannels.map((c) => {
                const isSelected = c.id === (selectedChannel?.id ?? "");
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannelId(c.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-bg-elevated text-text hover:bg-bg-muted"
                    }`}
                  >
                    <span>{c.nome}</span>
                    {c.regraDinamica && c.regraDinamica !== "nenhuma" && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-bg-muted text-text-muted"
                        }`}
                      >
                        Auto
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedChannel && (
            <ResultadosDoCanal
              custoTotal={custoTotal}
              channel={selectedChannel}
              margemAlvo={margemAlvo}
              onMargemAlvoChange={(v) => updateProduct(product.id, { margemAlvoPadrao: v })}
              margemSeguranca={margemSeguranca}
              onMargemSegurancaChange={setMargemSeguranca}
              produtoId={product.id}
              produtoNome={product.nome}
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
  produtoNome,
}: {
  custoTotal: number;
  channel: MarketplaceChannel;
  margemAlvo: number;
  onMargemAlvoChange: (v: number) => void;
  margemSeguranca: number;
  onMargemSegurancaChange: (v: number) => void;
  produtoId: string;
  produtoNome: string;
}) {
  const targets = calcularPriceTargets(custoTotal, channel, margemSeguranca, margemAlvo);
  const impossivel = targets.precoIdeal === null;

  const [precoPraticado, setPrecoPraticado] = useState<number | null>(null);

  // Usa o valor digitado ou reflete o ideal inicial
  const valorPraticado = precoPraticado ?? targets.precoIdeal ?? 0;

  const lucroNoIdeal =
    targets.precoIdeal !== null ? lucroLiquido(targets.precoIdeal, custoTotal, channel) : null;
  const margemNoIdeal =
    targets.precoIdeal !== null ? margemReal(targets.precoIdeal, custoTotal, channel) : null;

  const lucroPraticado =
    valorPraticado > 0 ? lucroLiquido(valorPraticado, custoTotal, channel) : null;
  const margemPraticada =
    valorPraticado > 0 ? margemReal(valorPraticado, custoTotal, channel) : null;
  const indicadores =
    valorPraticado > 0 ? indicadoresMarkup(valorPraticado, custoTotal, channel) : null;

  // Classificação de saúde da margem do preço praticado
  let statusMargem: { tone: "success" | "warning" | "danger"; label: string } = {
    tone: "warning",
    label: "Abaixo da meta",
  };

  if (lucroPraticado !== null && margemPraticada !== null) {
    if (lucroPraticado <= 0) {
      statusMargem = { tone: "danger", label: "Prejuízo no anúncio" };
    } else if (margemPraticada >= margemAlvo) {
      statusMargem = { tone: "success", label: "Margem meta atingida" };
    } else if (margemPraticada >= margemSeguranca) {
      statusMargem = { tone: "warning", label: "Margem segura, abaixo da meta" };
    } else {
      statusMargem = { tone: "danger", label: "Margem de risco (< segurança)" };
    }
  }

  function getWhatsAppSummary() {
    const linhas = [
      `📊 *Precificação: ${produtoNome}*`,
      `• *Custo real:* ${formatCurrency(custoTotal)}`,
      `• *Canal:* ${channel.nome}`,
      `• *Preço ideal sugerido:* ${targets.precoIdeal !== null ? formatCurrency(targets.precoIdeal) : "—"} (Margem: ${margemNoIdeal !== null ? formatPercent(margemNoIdeal) : "—"} | Lucro: ${lucroNoIdeal !== null ? formatCurrency(lucroNoIdeal) : "—"})`,
      `• *Preço de equilíbrio:* ${targets.precoEquilibrio !== null ? formatCurrency(targets.precoEquilibrio) : "—"}`,
    ];

    if (valorPraticado > 0 && Math.abs(valorPraticado - (targets.precoIdeal ?? 0)) > 0.01) {
      linhas.push(
        `• *Preço no anúncio testado:* ${formatCurrency(valorPraticado)} (Margem: ${margemPraticada !== null ? formatPercent(margemPraticada) : "—"} | Lucro: ${lucroPraticado !== null ? formatCurrency(lucroPraticado) : "—"})`,
      );
    }

    linhas.push("", "_Calculado via Margem Certa 🚀_");
    return linhas.join("\n");
  }

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

      {/* Simulador de Preço Praticado in-place */}
      {!impossivel && (
        <Card className="flex flex-col gap-3 border-primary/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-text">Simular Preço no Anúncio</p>
              <p className="text-xs text-text-muted">
                Digite o valor que pretende colocar na loja ou marketplace para ver o retorno real.
              </p>
            </div>
            {targets.precoIdeal !== null && (
              <button
                type="button"
                onClick={() => setPrecoPraticado(Math.round(targets.precoIdeal! * 100) / 100)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Resetar p/ preço ideal ({formatCurrency(targets.precoIdeal)})
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-text">Preço no anúncio (R$)</span>
              <CurrencyInput
                value={valorPraticado}
                onChange={(val) => setPrecoPraticado(val)}
              />
            </label>

            <div className="rounded-xl bg-bg-muted p-2.5">
              <p className="text-xs text-text-muted">Lucro líquido no bolso</p>
              <p
                className={`text-base font-bold ${
                  lucroPraticado !== null && lucroPraticado < 0 ? "text-danger" : "text-text"
                }`}
              >
                {lucroPraticado !== null ? formatCurrency(lucroPraticado) : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-bg-muted p-2.5">
              <p className="text-xs text-text-muted">Margem real resultante</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-text">
                  {margemPraticada !== null ? formatPercent(margemPraticada) : "—"}
                </span>
                {margemPraticada !== null && (
                  <Badge tone={statusMargem.tone}>{statusMargem.label}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-bg-muted p-2.5">
              <p className="text-xs text-text-muted">Líquido recebido (estimado)</p>
              <p className="text-base font-bold text-text">
                {indicadores ? formatCurrency(indicadores.valorLiquidoRecebido) : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-bg-muted p-2.5">
              <p className="text-xs text-text-muted">Líquido / preço</p>
              <p className="text-base font-bold text-text">
                {indicadores ? formatPercent(indicadores.liquidoSobrePreco) : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-bg-muted p-2.5">
              <p className="text-xs text-text-muted">Markup líquido / custo</p>
              <p className="text-base font-bold text-text">
                {indicadores
                  ? `${indicadores.liquidoSobreCusto.toFixed(2).replace(".", ",")}x (${formatPercent(indicadores.liquidoSobreCusto)})`
                  : "—"}
              </p>
            </div>
          </div>

          <p className="text-xs text-text-muted">
            Estimativa baseada nas tarifas configuradas no canal. O valor real depende da categoria e
            da logística do anúncio.
          </p>
        </Card>
      )}

      {!impossivel && targets.precoIdeal !== null && (
        <>
          <CostBreakdownBar breakdown={costBreakdown(valorPraticado > 0 ? valorPraticado : targets.precoIdeal, custoTotal, channel)} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CopySummaryButton getText={getWhatsAppSummary} label="Copiar para WhatsApp" />
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
