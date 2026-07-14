"use client";

import { Card } from "@/components/ui/Card";
import { PercentInput } from "@/components/ui/PercentInput";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import type { PriceTargets } from "@/lib/pricing/calculations";

function StatTile({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-lg bg-bg-muted px-3 py-2.5">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`font-bold text-text ${emphasis ? "text-lg" : "text-base"}`}>{value}</p>
    </div>
  );
}

export function ResultSummaryCard({
  targets,
  lucroNoIdeal,
  margemNoIdeal,
  margemAlvo,
  onMargemAlvoChange,
  margemSeguranca,
  onMargemSegurancaChange,
  impossivel,
}: {
  targets: PriceTargets;
  lucroNoIdeal: number | null;
  margemNoIdeal: number | null;
  margemAlvo: number;
  onMargemAlvoChange: (value: number) => void;
  margemSeguranca: number;
  onMargemSegurancaChange: (value: number) => void;
  impossivel: boolean;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">Margem de segurança</span>
          <PercentInput value={margemSeguranca} onChange={onMargemSegurancaChange} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">Margem alvo (desejada)</span>
          <PercentInput value={margemAlvo} onChange={onMargemAlvoChange} />
        </label>
      </div>

      {impossivel ? (
        <p className="rounded-lg bg-danger-bg px-3 py-2.5 text-sm text-danger">
          As taxas configuradas somam, junto com a margem desejada, 100% ou mais do preço — não é
          possível atingir esse resultado. Revise as taxas do canal ou reduza a margem alvo.
        </p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <StatTile
              label="Preço de equilíbrio"
              value={targets.precoEquilibrio !== null ? formatCurrency(targets.precoEquilibrio) : "—"}
            />
            <StatTile
              label="Preço mínimo recomendado"
              value={
                targets.precoMinimoRecomendado !== null
                  ? formatCurrency(targets.precoMinimoRecomendado)
                  : "—"
              }
            />
            <StatTile
              label="Preço ideal"
              value={targets.precoIdeal !== null ? formatCurrency(targets.precoIdeal) : "—"}
              emphasis
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <StatTile
              label="Lucro líquido (no preço ideal)"
              value={lucroNoIdeal !== null ? formatCurrency(lucroNoIdeal) : "—"}
            />
            <StatTile
              label="Margem real (no preço ideal)"
              value={margemNoIdeal !== null ? formatPercent(margemNoIdeal) : "—"}
            />
          </div>
        </>
      )}
    </Card>
  );
}
