"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductPicker } from "@/components/produtos/ProductPicker";
import { DiscountSimulator } from "@/components/desconto/DiscountSimulator";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { calcularPriceTargets, collapseChannelFees, custoTotalProduto } from "@/lib/pricing/calculations";

function DescontoContent() {
  const searchParams = useSearchParams();
  const produtoId = searchParams.get("produtoId");
  const canalId = searchParams.get("canalId");

  const product = useProductsStore((s) => (produtoId ? s.getProduct(produtoId) : undefined));
  const channels = useChannelsStore((s) => s.channels);
  const margemAlvoPadrao = useSettingsStore((s) => s.margemAlvoPadrao);
  const margemSegurancaPadrao = useSettingsStore((s) => s.margemSegurancaPadrao);
  const activeChannels = channels.filter((c) => c.ativo);
  const channel = canalId ? activeChannels.find((c) => c.id === canalId) : undefined;

  const custoTotal = product ? custoTotalProduto(product.custos) : 0;
  const precoIdealInicial =
    product && channel
      ? calcularPriceTargets(
          custoTotal,
          collapseChannelFees(channel),
          margemSegurancaPadrao,
          product.margemAlvoPadrao ?? margemAlvoPadrao,
        ).precoIdeal
      : null;

  const [precoBase, setPrecoBase] = useState<number | null>(null);
  const precoBaseAtual = precoBase ?? precoIdealInicial ?? 0;

  if (!produtoId) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-text">Simulador de desconto</h1>
        <ProductPicker
          title="Escolha um produto"
          hrefFor={(id) => `/desconto?produtoId=${id}`}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Produto não encontrado"
        action={
          <Link href="/desconto">
            <Button>Escolher outro produto</Button>
          </Link>
        }
      />
    );
  }

  if (!channel) {
    if (activeChannels.length === 0) {
      return (
        <EmptyState
          title="Nenhum canal ativo"
          description="Ative pelo menos um canal na tela de Canais."
          action={
            <Link href="/canais">
              <Button>Ir para Canais</Button>
            </Link>
          }
        />
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-text">Simulador de desconto — {product.nome}</h1>
        <p className="text-sm font-medium text-text">Escolha o canal</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {activeChannels.map((c) => (
            <Link key={c.id} href={`/desconto?produtoId=${product.id}&canalId=${c.id}`}>
              <Card className="hover:border-primary">
                <p className="font-medium text-text">{c.nome}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href={`/desconto?produtoId=${product.id}`} className="text-xs text-text-muted hover:text-text">
          ← Trocar canal
        </Link>
        <h1 className="text-xl font-bold text-text">
          Simulador de desconto — {product.nome} · {channel.nome}
        </h1>
      </div>
      <DiscountSimulator
        custoTotal={custoTotal}
        channel={channel}
        precoBase={precoBaseAtual}
        onPrecoBaseChange={setPrecoBase}
      />
    </div>
  );
}

export default function DescontoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-muted">Carregando…</p>}>
      <DescontoContent />
    </Suspense>
  );
}
