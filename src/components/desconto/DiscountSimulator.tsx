"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { PercentInput } from "@/components/ui/PercentInput";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import { simularDesconto } from "@/lib/pricing/calculations";
import type { MarketplaceChannel } from "@/lib/pricing/types";

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
          {result.breakevenDepois !== null && ` (${formatCurrency(result.breakevenDepois)})`}.
        </p>
      )}
    </Card>
  );
}
