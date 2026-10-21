"use client";

import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { custoTotalProduto } from "@/lib/pricing/calculations";
import { formatCurrency } from "@/lib/format/currency";
import { COST_COMPONENT_KEYS, COST_COMPONENT_LABELS, type CostComponents } from "@/lib/pricing/types";

export function ProductForm({
  nome,
  onNomeChange,
  sku,
  onSkuChange,
  custos,
  onCustosChange,
}: {
  nome: string;
  onNomeChange: (value: string) => void;
  sku: string;
  onSkuChange: (value: string) => void;
  custos: CostComponents;
  onCustosChange: (next: CostComponents) => void;
}) {
  const total = custoTotalProduto(custos);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">Nome do produto</span>
          <input
            value={nome}
            onChange={(e) => onNomeChange(e.target.value)}
            placeholder="Ex: Fone de ouvido bluetooth"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">SKU (opcional)</span>
          <input
            value={sku}
            onChange={(e) => onSkuChange(e.target.value)}
            placeholder="Ex: FONE-BT-001"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {COST_COMPONENT_KEYS.map((key) => (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">{COST_COMPONENT_LABELS[key]}</span>
            <CurrencyInput
              value={custos[key]}
              onChange={(value) => onCustosChange({ ...custos, [key]: value })}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-bg-muted px-4 py-3">
        <span className="text-sm font-medium text-text-muted">Custo total real</span>
        <span className="text-lg font-bold text-text">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
