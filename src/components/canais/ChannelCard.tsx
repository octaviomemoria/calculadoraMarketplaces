"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChannelForm } from "@/components/canais/ChannelForm";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import type { MarketplaceChannel } from "@/lib/pricing/types";

export function ChannelCard({ channel }: { channel: MarketplaceChannel }) {
  const updateChannel = useChannelsStore((s) => s.updateChannel);
  const toggleAtivo = useChannelsStore((s) => s.toggleAtivo);
  const restoreDefault = useChannelsStore((s) => s.restoreDefault);
  const removeChannel = useChannelsStore((s) => s.removeChannel);

  return (
    <details className="group rounded-xl border border-border bg-bg-elevated open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-text">{channel.nome}</span>
          {channel.isCustom && <Badge tone="neutral">personalizado</Badge>}
          {!channel.ativo && <Badge tone="warning">inativo</Badge>}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleAtivo(channel.id);
          }}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            channel.ativo ? "bg-success-bg text-success" : "bg-bg-muted text-text-muted"
          }`}
        >
          {channel.ativo ? "Ativo" : "Inativo"}
        </button>
      </summary>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
        <ChannelForm channel={channel} onChange={(patch) => updateChannel(channel.id, patch)} />
        <div className="flex justify-end gap-2">
          {!channel.isCustom && (
            <Button variant="secondary" onClick={() => restoreDefault(channel.id)}>
              Restaurar padrão
            </Button>
          )}
          {channel.isCustom && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Excluir o canal "${channel.nome}"?`)) removeChannel(channel.id);
              }}
            >
              Excluir canal
            </Button>
          )}
        </div>
      </div>
    </details>
  );
}
