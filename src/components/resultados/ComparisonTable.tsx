"use client";

import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Table, Thead, Th, Td, Tr } from "@/components/ui/Table";
import { formatCurrency, formatPercent } from "@/lib/format/currency";

export interface ComparisonRow {
  channelId: string;
  channelName: string;
  precoIdeal: number | null;
  precoPraticado: number;
  lucro: number;
  margem: number | null;
}

export function ComparisonTable({
  rows,
  onPrecoPraticadoChange,
}: {
  rows: ComparisonRow[];
  onPrecoPraticadoChange: (channelId: string, value: number) => void;
}) {
  const sorted = [...rows].sort((a, b) => b.lucro - a.lucro);
  const melhorLucro = sorted[0]?.lucro ?? -Infinity;

  return (
    <Table>
      <Thead>
        <tr>
          <Th>Canal</Th>
          <Th>Preço ideal</Th>
          <Th>Preço praticado</Th>
          <Th>Lucro líquido</Th>
          <Th>Margem real</Th>
        </tr>
      </Thead>
      <tbody>
        {sorted.map((row) => {
          const isBest = row.lucro === melhorLucro && row.lucro > -Infinity;
          return (
            <Tr key={row.channelId} highlighted={isBest}>
              <Td className="font-medium text-text">
                {isBest && "🏆 "}
                {row.channelName}
              </Td>
              <Td>{row.precoIdeal !== null ? formatCurrency(row.precoIdeal) : "—"}</Td>
              <Td>
                <CurrencyInput
                  value={row.precoPraticado}
                  onChange={(v) => onPrecoPraticadoChange(row.channelId, v)}
                  className="w-32"
                />
              </Td>
              <Td className={row.lucro < 0 ? "font-semibold text-danger" : "font-semibold text-text"}>
                {formatCurrency(row.lucro)}
              </Td>
              <Td>{row.margem !== null ? formatPercent(row.margem) : "—"}</Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
