"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { PercentInput } from "@/components/ui/PercentInput";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import { simularDesconto } from "@/lib/pricing/calculations";
import type { MarketplaceChannel } from "@/lib/pricing/types";
import { TrendingUpIcon } from "@/components/ui/Icons";
import { CopySummaryButton } from "@/components/ui/CopySummaryButton";

function Resultado({
  label,
  preco,
  lucro,
  margem,
}: {
  label: string;
  preco: number;
  lucro: number;
  margem: number | null;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-xl bg-bg-muted p-3">
      <p className="text-xs font-semibold uppercase text-text-muted">{label}</p>
      <p className="text-lg font-bold text-text">{formatCurrency(preco)}</p>
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">Lucro</span>
        <span className={lucro < 0 ? "font-semibold text-danger" : "font-medium text-text"}>
          {formatCurrency(lucro)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">Margem</span>
        <span className="font-medium text-text">{margem !== null ? formatPercent(margem) : "—"}</span>
      </div>
    </div>
  );
}

export function DiscountSimulator({
  custoTotal,
  channel,
  precoBase,
  onPrecoBaseChange,
}: {
  custoTotal: number;
  channel: MarketplaceChannel;
  precoBase: number;
  onPrecoBaseChange: (value: number) => void;
}) {
  const [percentDiscount, setPercentDiscount] = useState(0);
  const [fixedDiscount, setFixedDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);

  const result = simularDesconto({
    precoBase,
    custoTotal,
    channel,
    percentDiscount,
    fixedDiscount,
    freeShipping,
  });

  return (
    <Card className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text">Preço base (antes do desconto)</span>
        <CurrencyInput value={precoBase} onChange={onPrecoBaseChange} className="max-w-xs" />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">Desconto percentual</span>
          <PercentInput value={percentDiscount} onChange={setPercentDiscount} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">Cupom / desconto fixo</span>
          <CurrencyInput value={fixedDiscount} onChange={setFixedDiscount} />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={freeShipping}
            onChange={(e) => setFreeShipping(e.target.checked)}
          />
          <span className="font-medium text-text">Frete grátis (por conta do vendedor)</span>
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Resultado label="Antes" preco={result.precoAntes} lucro={result.lucroAntes} margem={result.margemAntes} />
        <Resultado
          label="Depois"
          preco={result.precoDepois}
          lucro={result.lucroDepois}
          margem={result.margemDepois}
        />
      </div>

      {result.isPrejuizo && (
        <p className="rounded-lg bg-danger-bg px-3 py-2.5 text-sm font-medium text-danger">
          ⚠️ Atenção: prejuízo! Esse desconto leva o preço abaixo do ponto de equilíbrio
          {result.breakevenDepois !== null && ` (${formatCurrency(result.breakevenDepois)})`}. Aumentar o volume não compensará uma venda com margem negativa.
        </p>
      )}

      {!result.isPrejuizo && result.aumentoVolumeNecessarioPct !== null && result.aumentoVolumeNecessarioPct > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-text">
          <div className="rounded-lg bg-primary/10 p-1.5 text-primary shrink-0">
            <TrendingUpIcon size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-primary">Meta de Volume para Compensar Desconto</span>
            <p className="text-text-muted leading-relaxed">
              Como o lucro unitário caiu de <strong className="text-text">{formatCurrency(result.lucroAntes)}</strong> para{" "}
              <strong className="text-text">{formatCurrency(result.lucroDepois)}</strong>, você precisará vender{" "}
              <strong className="text-primary font-bold">+{formatPercent(result.aumentoVolumeNecessarioPct)}</strong> em volume
              de pedidos para manter o mesmo lucro bruto total que tinha antes da promoção.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1 border-t border-border">
        <CopySummaryButton
          label="Copiar simulação (WhatsApp)"
          textToCopy={
            `🏷️ *Simulação de Desconto - Margem Certa*\n` +
            `🏬 Canal: *${channel.nome}*\n` +
            `💰 Preço Antes: ${formatCurrency(result.precoAntes)} (Lucro: ${formatCurrency(result.lucroAntes)} | Margem: ${result.margemAntes !== null ? formatPercent(result.margemAntes) : "—"})\n` +
            `🏷️ Preço c/ Desconto: *${formatCurrency(result.precoDepois)}* (Lucro: ${formatCurrency(result.lucroDepois)} | Margem: ${result.margemDepois !== null ? formatPercent(result.margemDepois) : "—"})\n` +
            (result.aumentoVolumeNecessarioPct && result.aumentoVolumeNecessarioPct > 0
              ? `📈 Meta de volume para compensar: *+${formatPercent(result.aumentoVolumeNecessarioPct)}*\n`
              : "") +
            (result.isPrejuizo ? `⚠️ Atenção: Preço abaixo do ponto de equilíbrio (${formatCurrency(result.breakevenDepois ?? 0)})` : "")
          }
        />
      </div>
    </Card>
  );
}
