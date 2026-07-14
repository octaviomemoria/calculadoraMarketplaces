import { Card } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import type { CostBreakdown } from "@/lib/pricing/calculations";

const SEGMENT_COLORS = [
  "bg-text-muted",
  "bg-warning",
  "bg-danger",
  "bg-primary",
  "bg-text",
  "bg-border",
];

export function CostBreakdownBar({ breakdown }: { breakdown: CostBreakdown }) {
  const { itens, lucro, preco } = breakdown;
  if (preco <= 0) return null;

  const segments = [
    ...itens.map((item, i) => ({
      label: item.label,
      valor: item.valor,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    })),
    { label: "Lucro", valor: Math.max(lucro, 0), color: "bg-success" },
  ];

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-medium text-text">Para onde vai cada real do preço</p>
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {segments.map((s, i) => {
          const pct = (s.valor / preco) * 100;
          if (pct <= 0) return null;
          return <div key={i} className={s.color} style={{ width: `${pct}%` }} title={s.label} />;
        })}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-muted">
              <span className={`inline-block h-2 w-2 rounded-full ${s.color}`} />
              {s.label}
            </span>
            <span className="font-medium text-text">
              {formatCurrency(s.valor)} ({formatPercent(s.valor / preco, 1)})
            </span>
          </div>
        ))}
      </div>
      {lucro < 0 && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-xs text-danger">
          Atenção: a preço {formatCurrency(preco)} o lucro é negativo ({formatCurrency(lucro)}).
        </p>
      )}
    </Card>
  );
}
