"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { PercentInput } from "@/components/ui/PercentInput";
import { Button } from "@/components/ui/Button";
import { BoltIcon, CloseIcon, CheckIcon } from "@/components/ui/Icons";
import { formatCurrency, formatPercent } from "@/lib/format/currency";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { emptyCostComponents } from "@/lib/pricing/types";
import {
  calcularPriceTargets,
  costBreakdown,
} from "@/lib/pricing/calculations";

interface QuickCalcModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCalcModal({ isOpen, onClose }: QuickCalcModalProps) {
  const router = useRouter();
  const channels = useChannelsStore((s) => s.channels);
  const margemAlvoPadrao = useSettingsStore((s) => s.margemAlvoPadrao);
  const margemSegurancaPadrao = useSettingsStore((s) => s.margemSegurancaPadrao);
  const addProduct = useProductsStore((s) => s.addProduct);

  const [nome, setNome] = useState("");
  const [custoProduto, setCustoProduto] = useState<number>(30);
  const [custoEmbalagem, setCustoEmbalagem] = useState<number>(2);
  const [outrosCustos, setOutrosCustos] = useState<number>(0);
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id ?? "");
  const [margemAlvo, setMargemAlvo] = useState<number>(margemAlvoPadrao);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentChannel = channels.find((c) => c.id === selectedChannelId) ?? channels[0];
  const custoTotal = custoProduto + custoEmbalagem + outrosCustos;

  const targets = currentChannel
    ? calcularPriceTargets(custoTotal, currentChannel, margemSegurancaPadrao, margemAlvo)
    : { precoEquilibrio: null, precoMinimoRecomendado: null, precoIdeal: null };

  const precoIdeal = targets.precoIdeal ?? 0;
  const breakdown = currentChannel && precoIdeal > 0
    ? costBreakdown(precoIdeal, custoTotal, currentChannel)
    : null;

  function handleSaveAsProduct() {
    const nomeFinal = nome.trim() || `Produto Rápido (${currentChannel?.nome ?? "Novo"})`;
    const newProduct = addProduct({
      nome: nomeFinal,
      custos: {
        ...emptyCostComponents(),
        aquisicao: custoProduto,
        embalagem: custoEmbalagem,
        outrosCustosVariaveis: outrosCustos,
      },
      margemAlvoPadrao: margemAlvo !== margemAlvoPadrao ? margemAlvo : undefined,
    });

    onClose();
    router.push(`/produtos/detalhe?id=${newProduct.id}`);
  }

  function handleCopySummary() {
    if (!currentChannel || !precoIdeal) return;
    const text = `⚡ *Cálculo Rápido - Margem Certa*\n` +
      `📦 ${nome.trim() || "Simulação Rápida"}\n` +
      `🏬 Canal: *${currentChannel.nome}*\n` +
      `💰 Custo Total: ${formatCurrency(custoTotal)}\n` +
      `🎯 Margem Alvo: ${formatPercent(margemAlvo)}\n` +
      `--------------------------\n` +
      `⚖️ Ponto de Equilíbrio: ${targets.precoEquilibrio ? formatCurrency(targets.precoEquilibrio) : "N/D"}\n` +
      `🟢 Preço Ideal Recomendado: *${formatCurrency(precoIdeal)}*\n` +
      `💵 Lucro Líquido Unitário: *${breakdown ? formatCurrency(breakdown.lucro) : "N/D"}*`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BoltIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Cálculo Rápido Express</h2>
              <p className="text-xs text-text-muted">Simule preço e margem sem salvar antecipadamente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-muted hover:text-text transition-colors"
            title="Fechar"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Inputs */}
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">Nome ou descrição (opcional)</span>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fone Bluetooth TWS"
              className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-text">Custo do produto</span>
              <CurrencyInput value={custoProduto} onChange={setCustoProduto} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-text">Embalagem + Outros</span>
              <CurrencyInput
                value={custoEmbalagem + outrosCustos}
                onChange={(val) => {
                  setCustoEmbalagem(val);
                  setOutrosCustos(0);
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-text">Marketplace</span>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary font-medium"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-text">Margem desejada</span>
              <PercentInput value={margemAlvo} onChange={setMargemAlvo} />
            </label>
          </div>

          {/* Resultado em tempo real */}
          <div className="rounded-xl bg-bg-muted p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Custo total acumulado:</span>
              <span className="font-bold text-text">{formatCurrency(custoTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase text-text-muted">Ponto de Equilíbrio (0%)</span>
                <span className="text-sm font-bold text-text">
                  {targets.precoEquilibrio !== null ? formatCurrency(targets.precoEquilibrio) : "Inviável"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase text-primary">Preço Ideal Recomendado</span>
                <span className="text-lg font-extrabold text-primary">
                  {targets.precoIdeal !== null ? formatCurrency(targets.precoIdeal) : "Inviável"}
                </span>
              </div>
            </div>

            {breakdown && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <span className="text-text-muted">Lucro líquido estimado:</span>
                <span className="font-bold text-success text-sm">{formatCurrency(breakdown.lucro)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopySummary}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5"
          >
            {copied ? <CheckIcon size={16} className="text-success" /> : null}
            <span>{copied ? "Copiado!" : "Copiar Resumo"}</span>
          </Button>
          <Button
            type="button"
            onClick={handleSaveAsProduct}
            className="w-full sm:w-auto"
          >
            Salvar como Produto
          </Button>
        </div>
      </div>
    </div>
  );
}
