"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChannelList } from "@/components/canais/ChannelList";
import { useChannelsStore } from "@/lib/store/useChannelsStore";

export default function CanaisPage() {
  const channels = useChannelsStore((s) => s.channels);
  const addCustomChannel = useChannelsStore((s) => s.addCustomChannel);
  const [novoNome, setNovoNome] = useState("");
  const [addingOpen, setAddingOpen] = useState(false);

  function handleAdd() {
    const nome = novoNome.trim();
    if (!nome) return;
    addCustomChannel(nome);
    setNovoNome("");
    setAddingOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Canais</h1>
          <p className="text-sm text-text-muted">
            Cada modalidade (Clássico, Premium, Full, FBA...) é um canal próprio e pode ser
            comparada lado a lado no Comparador. As taxas são valores de referência — edite
            livremente, pois cada plataforma muda as regras com frequência.
          </p>
        </div>
        <Button onClick={() => setAddingOpen((v) => !v)}>+ Canal personalizado</Button>
      </div>

      {addingOpen && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated p-3">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nome do canal (ex: Site próprio v2)"
            autoFocus
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
          <Button onClick={handleAdd} disabled={!novoNome.trim()}>
            Adicionar
          </Button>
        </div>
      )}

      <ChannelList channels={channels} />
    </div>
  );
}
