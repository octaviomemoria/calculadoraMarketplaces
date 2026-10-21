"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { PercentInput } from "@/components/ui/PercentInput";
import { Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { CopySummaryButton } from "@/components/ui/CopySummaryButton";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import { custoTotalProduto, precificacaoReversa } from "@/lib/pricing/calculations";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";

export function ReversePricingForm({ initialProdutoId }: { initialProdutoId?: string }) {
  const products = useProductsStore((s) => s.products);
  const channels = useChannelsStore((s) => s.channels);
  const margemAlvoPadrao = useSettingsStore((s) => s.margemAlvoPadrao);
  const activeChannels = useMemo(() => channels.filter((c) => c.ativo), [channels]);

  const [precoConcorrente, setPrecoConcorrente] = useState(0);
  const [margemAlvo, setMargemAlvo] = useState(margemAlvoPadrao);
  const [produtoId, setProdutoId] = useState(initialProdutoId ?? "");

  const produtoVinculado = products.find((p) => p.id === produtoId);
  const custoReal = produtoVinculado ? custoTotalProduto(produtoVinculado.custos) : undefined;

  const linhas = useMemo(
    () =>
      activeChannels.map((channel) => ({
        channel,
        resultado: precificacaoReversa(precoConcorrente, channel, margemAlvo, custoReal),
      })),
    [activeChannels, precoConcorrente, margemAlvo, custoReal],
  );

  const summaryText = useMemo(() => {
    if (precoConcorrente <= 0) return "";
    return (
      `🔁 *Precificação Reversa - Margem Certa*\n` +
      `🎯 Preço do Concorrente: ${formatCurrency(precoConcorrente)}\n` +
      `📊 Margem Alvo Desejada: ${formatPercent(margemAlvo)}\n` +
      (produtoVinculado
        ? `📦 Produto: ${produtoVinculado.nome} (Custo Real: ${formatCurrency(custoReal ?? 0)})\n`
        : "") +
      `--------------------------\n` +
      `*Custo Máximo Viável por Canal:*\n` +
      linhas
        .map(({ channel, resultado }) => {
          const status = produtoVinculado
            ? resultado.viavel
              ? " ✅ Viável"
              : " ❌ Inviável"
            : "";
          return `• ${channel.nome}: máx ${formatCurrency(resultado.custoMaximoViavel)}${status}`;
        })
        .join("\n")
    );
  }, [precoConcorrente, margemAlvo, produtoVinculado, custoReal, linhas]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">Preço do concorrente</span>
            <CurrencyInput value={precoConcorrente} onChange={setPrecoConcorrente} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">Margem alvo</span>
            <PercentInput value={margemAlvo} onChange={setMargemAlvo} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">Produto vinculado (opcional)</span>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary"
            >
              <option value="">Nenhum — só custo máximo</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {precoConcorrente > 0 && (
          <div className="flex justify-end pt-1 border-t border-border">
            <CopySummaryButton textToCopy={summaryText} label="Copiar análise reversa (WhatsApp)" />
          </div>
        )}
      </Card>

      {activeChannels.length === 0 ? (
        <p className="text-sm text-text-muted">Ative pelo menos um canal na tela de Canais.</p>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Canal</Th>
              <Th>Custo máximo viável</Th>
              {produtoVinculado && <Th>Custo real do produto</Th>}
              {produtoVinculado && <Th>Margem estimada</Th>}
              {produtoVinculado && <Th>Viável?</Th>}
            </tr>
          </Thead>
          <tbody>
            {linhas.map(({ channel, resultado }) => (
              <Tr key={channel.id}>
                <Td className="font-medium text-text">{channel.nome}</Td>
                <Td className={resultado.custoMaximoViavel < 0 ? "text-danger" : ""}>
                  {formatCurrency(resultado.custoMaximoViavel)}
                </Td>
                {produtoVinculado && <Td>{formatCurrency(resultado.custoReal ?? 0)}</Td>}
                {produtoVinculado && (
                  <Td>
                    {resultado.margemRealEstimada !== null && resultado.margemRealEstimada !== undefined
                      ? formatPercent(resultado.margemRealEstimada)
                      : "—"}
                  </Td>
                )}
                {produtoVinculado && (
                  <Td>
                    <Badge tone={resultado.viavel ? "success" : "danger"}>
                      {resultado.viavel ? "Viável" : "Inviável"}
                    </Badge>
                  </Td>
                )}
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
