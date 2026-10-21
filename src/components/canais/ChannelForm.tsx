"use client";

import { useState } from "react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { PercentInput } from "@/components/ui/PercentInput";
import { Button } from "@/components/ui/Button";
import type { CustomFee, MarketplaceChannel } from "@/lib/pricing/types";
import {
  calcularSubsidioFretePreset,
  FAIXA_PRECO_LABELS,
  REPUTACAO_LABELS,
  type FaixaPreco,
  type NivelReputacao,
} from "@/lib/pricing/shippingPresets";

export function ChannelForm({
  channel,
  onChange,
}: {
  channel: MarketplaceChannel;
  onChange: (patch: Partial<MarketplaceChannel>) => void;
}) {
  const taxas = channel.taxasPersonalizadas ?? [];
  const [reputacao, setReputacao] = useState<NivelReputacao>("verde_mercadolider");
  const [faixaPreco, setFaixaPreco] = useState<FaixaPreco>("acima_79");

  function aplicarPresetFrete() {
    const subsidio = calcularSubsidioFretePreset(channel.custoFrete, faixaPreco, reputacao);
    onChange({ subsidioFrete: Math.round(subsidio * 100) / 100 });
  }

  function updateFee(id: string, patch: Partial<CustomFee>) {
    onChange({ taxasPersonalizadas: taxas.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  }

  function removeFee(id: string) {
    onChange({ taxasPersonalizadas: taxas.filter((f) => f.id !== id) });
  }

  function addFee() {
    onChange({
      taxasPersonalizadas: [
        ...taxas,
        { id: crypto.randomUUID(), nome: "", tipo: "percentual", valor: 0 },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-bg p-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-text">Regra Tarifária Automática</span>
          <select
            value={channel.regraDinamica ?? "nenhuma"}
            onChange={(e) =>
              onChange({
                regraDinamica: e.target.value as MarketplaceChannel["regraDinamica"],
              })
            }
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="nenhuma">Manual (taxas fixas e comissão padrão)</option>
            <option value="mercadolivre">
              Mercado Livre (taxa unitária &lt; R$ 79; frete obrigatório ≥ R$ 79)
            </option>
            <option value="shopee_2026">
              Shopee 2026 (escalonado oficial: R$ 4 até R$ 80; R$ 16/R$ 20/R$ 26 acima)
            </option>
            <option value="tiktok_shop_2026">
              TikTok Shop 2026 (16% + R$ 4 &lt; R$ 50; 12% + R$ 6 ≥ R$ 50)
            </option>
          </select>
        </label>

        {channel.regraDinamica === "shopee_2026" && (
          <p className="text-xs text-text-muted">
            💡 <strong>Regra Shopee 2026 ativa:</strong> calcula a comissão e taxa fixa automaticamente
            conforme a faixa de preço final (R$ 4 até R$ 80; R$ 16 de R$ 80-100; R$ 20 de R$ 100-200;
            R$ 26 a partir de R$ 200, com 14% de comissão acima de R$ 80).
          </p>
        )}

        {channel.regraDinamica === "mercadolivre" && (
          <p className="text-xs text-text-muted">
            💡 <strong>Regra Mercado Livre ativa:</strong> Para produtos <strong>abaixo de R$ 79</strong>,
            aplica a taxa fixa/manuseio unitário informada e isenta o frete obrigatório do vendedor. Para produtos
            <strong>a partir de R$ 79</strong>, zera a taxa fixa e cobra o frete líquido obrigatório.
          </p>
        )}

        {channel.regraDinamica === "tiktok_shop_2026" && (
          <p className="text-xs text-text-muted">
            💡 <strong>Regra TikTok Shop ativa:</strong> Produtos <strong>&lt; R$ 50</strong> recebem 16% (comissão + programa de envio) + R$ 4 fixo; produtos <strong>≥ R$ 50</strong> recebem 12% + R$ 6 fixo.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">Comissão base</span>
          <PercentInput value={channel.comissaoPct} onChange={(v) => onChange({ comissaoPct: v })} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text">Taxa fixa por venda</span>
          <CurrencyInput value={channel.taxaFixa} onChange={(v) => onChange({ taxaFixa: v })} />
        </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text">Custo de frete</span>
        <CurrencyInput value={channel.custoFrete} onChange={(v) => onChange({ custoFrete: v })} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text">Subsídio de frete do marketplace</span>
        <CurrencyInput value={channel.subsidioFrete} onChange={(v) => onChange({ subsidioFrete: v })} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text">Imposto</span>
        <PercentInput value={channel.impostoPct} onChange={(v) => onChange({ impostoPct: v })} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text">Taxa de pagamento</span>
        <PercentInput
          value={channel.taxaPagamentoPct}
          onChange={(v) => onChange({ taxaPagamentoPct: v })}
        />
      </label>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text">Taxa de antecipação</span>
        <div className="flex items-center gap-2">
          <PercentInput
            value={channel.taxaAntecipacaoPct}
            onChange={(v) => onChange({ taxaAntecipacaoPct: v })}
            className="flex-1"
          />
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={channel.antecipacaoAtiva}
              onChange={(e) => onChange({ antecipacaoAtiva: e.target.checked })}
            />
            usar
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-text">Custo de anúncio (ads)</span>
        <div className="flex items-center gap-2">
          {channel.tipoCustoAds === "percentual" ? (
            <PercentInput value={channel.custoAds} onChange={(v) => onChange({ custoAds: v })} className="flex-1" />
          ) : (
            <CurrencyInput value={channel.custoAds} onChange={(v) => onChange({ custoAds: v })} className="flex-1" />
          )}
          <select
            value={channel.tipoCustoAds}
            onChange={(e) => onChange({ tipoCustoAds: e.target.value as MarketplaceChannel["tipoCustoAds"] })}
            className="rounded-lg border border-border bg-bg-elevated px-2 py-2 text-xs text-text outline-none"
          >
            <option value="percentual">% do preço</option>
            <option value="fixo">R$ fixo</option>
          </select>
        </div>
      </div>
    </div>

      <p className="text-xs text-text-muted">
        <strong className="text-text">Como modelar o frete:</strong> se o frete é grátis (você
        paga), preencha &ldquo;Custo de frete&rdquo; com o valor cheio e &ldquo;Subsídio&rdquo; com
        o que a plataforma cobre. Se o frete é pago pelo cliente, deixe &ldquo;Custo de frete&rdquo;
        em 0 — ele não sai da sua margem. Para modalidades diferentes da mesma plataforma (Clássico,
        Premium, Full, FBA...), use um canal separado para cada uma.
      </p>

      <div className="flex flex-col gap-2 rounded-lg border border-warning-bg bg-warning-bg/40 p-3">
        <span className="text-sm font-medium text-text">Preset de frete grátis por reputação</span>
        <p className="text-xs text-text-muted">
          Baseado em regras de referência do Mercado Livre (não confirmadas na página oficial —
          o acesso automatizado foi bloqueado). Confira os percentuais na sua própria conta antes
          de confiar. Preenche o campo &ldquo;Subsídio de frete do marketplace&rdquo; a partir do
          &ldquo;Custo de frete&rdquo; já informado acima.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={reputacao}
            onChange={(e) => setReputacao(e.target.value as NivelReputacao)}
            className="rounded-lg border border-border bg-bg-elevated px-2 py-2 text-xs text-text outline-none"
          >
            {Object.entries(REPUTACAO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={faixaPreco}
            onChange={(e) => setFaixaPreco(e.target.value as FaixaPreco)}
            className="rounded-lg border border-border bg-bg-elevated px-2 py-2 text-xs text-text outline-none"
          >
            {Object.entries(FAIXA_PRECO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button variant="secondary" className="self-start" onClick={aplicarPresetFrete}>
          Aplicar preset ao subsídio de frete
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Taxas personalizadas</span>
        <p className="text-xs text-text-muted">
          Adicione impostos específicos (ICMS, ISS...), comissão de vendedor interno ou qualquer
          outra taxa que falte acima.
        </p>

        {taxas.length > 0 && (
          <div className="flex flex-col gap-2">
            {taxas.map((fee) => (
              <div key={fee.id} className="flex flex-wrap items-center gap-2">
                <input
                  value={fee.nome}
                  onChange={(e) => updateFee(fee.id, { nome: e.target.value })}
                  placeholder="Ex: Comissão vendedor"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-primary"
                />
                {fee.tipo === "percentual" ? (
                  <PercentInput
                    value={fee.valor}
                    onChange={(v) => updateFee(fee.id, { valor: v })}
                    className="w-32"
                  />
                ) : (
                  <CurrencyInput
                    value={fee.valor}
                    onChange={(v) => updateFee(fee.id, { valor: v })}
                    className="w-32"
                  />
                )}
                <select
                  value={fee.tipo}
                  onChange={(e) =>
                    updateFee(fee.id, { tipo: e.target.value as CustomFee["tipo"] })
                  }
                  className="rounded-lg border border-border bg-bg-elevated px-2 py-2 text-xs text-text outline-none"
                >
                  <option value="percentual">% do preço</option>
                  <option value="fixo">R$ fixo</option>
                </select>
                <Button variant="danger" onClick={() => removeFee(fee.id)}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button variant="secondary" className="self-start" onClick={addFee}>
          + Adicionar taxa
        </Button>
      </div>
    </div>
  );
}
