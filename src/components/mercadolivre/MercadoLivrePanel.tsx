"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/format/currency";

export interface MercadoLivrePanelProps {
  apiBaseUrl: string;
  price: number;
  cost: number;
}

export interface OfficialFeeResponse {
  listingTypeId: string;
  listingTypeName: string;
  currencyId: string;
  listingFeeAmount: number;
  saleFeeAmount: number;
  saleFeePercentage: number | null;
  saleFeeFixed: number | null;
  netReceived: number;
}

export function isMercadoLivreChannelName(name: string): boolean {
  return name.toLocaleLowerCase("pt-BR").includes("mercado livre");
}

export function calcularIndicadoresOficiais(
  price: number,
  cost: number,
  saleFeeAmount: number,
): { netReceived: number; liquidoSobrePreco: number; liquidoSobreCusto: number } | null {
  if (price <= 0 || cost <= 0 || saleFeeAmount < 0) return null;
  const netReceived = price - saleFeeAmount;
  return {
    netReceived,
    liquidoSobrePreco: netReceived / price,
    liquidoSobreCusto: netReceived / cost,
  };
}

function apiUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}${path}`;
}

export function MercadoLivrePanel({ apiBaseUrl, price, cost }: MercadoLivrePanelProps) {
  const [connectionId, setConnectionId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("mkt-calc:mercadolivre-connection"),
  );
  const [connected, setConnected] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [listingTypeId, setListingTypeId] = useState("gold_special");
  const [logisticType, setLogisticType] = useState("");
  const [shippingMode, setShippingMode] = useState("");
  const [billableWeight, setBillableWeight] = useState("");
  const [result, setResult] = useState<OfficialFeeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const baseUrl = useMemo(
    () => apiBaseUrl || "https://calculadora.memoriaapps.site",
    [apiBaseUrl],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedConnectionId = params.get("connectionId");
    if (params.get("mercadolivre") === "connected" && returnedConnectionId) {
      window.localStorage.setItem("mkt-calc:mercadolivre-connection", returnedConnectionId);
      window.setTimeout(() => setConnectionId(returnedConnectionId), 0);
      params.delete("mercadolivre");
      params.delete("connectionId");
      window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
      return;
    }
  }, []);

  useEffect(() => {
    if (!connectionId) return;
    fetch(apiUrl(baseUrl, "/api/mercadolivre/status"), {
      headers: { Authorization: `Bearer ${connectionId}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível verificar a conexão");
        return response.json() as Promise<{ connected: boolean }>;
      })
      .then((data) => setConnected(data.connected))
      .catch(() => setConnected(false));
  }, [baseUrl, connectionId]);

  function connect() {
    const returnTo = encodeURIComponent(window.location.href);
    window.location.assign(`${apiUrl(baseUrl, "/api/mercadolivre/auth")}?returnTo=${returnTo}`);
  }

  async function disconnect() {
    if (connectionId) {
      await fetch(apiUrl(baseUrl, "/api/mercadolivre/disconnect"), {
        method: "POST",
        headers: { Authorization: `Bearer ${connectionId}` },
      });
    }
    window.localStorage.removeItem("mkt-calc:mercadolivre-connection");
    setConnectionId(null);
    setConnected(false);
    setResult(null);
  }

  async function consultFees() {
    if (!connectionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl(baseUrl, "/api/mercadolivre/fees"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connectionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price,
          categoryId,
          listingTypeId,
          currencyId: "BRL",
          logisticType: logisticType || undefined,
          shippingMode: shippingMode || undefined,
          billableWeight: billableWeight ? Number(billableWeight) : undefined,
        }),
      });
      const data = (await response.json()) as OfficialFeeResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível consultar as tarifas");
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível consultar as tarifas");
    } finally {
      setLoading(false);
    }
  }

  const indicators = result ? calcularIndicadoresOficiais(price, cost, result.saleFeeAmount) : null;

  return (
    <Card className="flex flex-col gap-3 border-primary/30">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-text">Tarifas reais do Mercado Livre</p>
          <p className="text-xs text-text-muted">
            Consulta oficial por categoria, anúncio e logística. O cálculo manual continua disponível acima.
          </p>
        </div>
        {connected && <Badge tone="success">Conectado</Badge>}
      </div>

      {!connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg-muted p-3">
          <p className="text-sm text-text">Conecte sua conta para buscar as tarifas atuais.</p>
          <Button type="button" onClick={connect}>Conectar Mercado Livre</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-text">
              Categoria (ex.: MLB1055)
              <input value={categoryId} onChange={(event) => setCategoryId(event.target.value.toUpperCase())} className="rounded-lg border border-border bg-bg p-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text">
              Tipo de anúncio
              <select value={listingTypeId} onChange={(event) => setListingTypeId(event.target.value)} className="rounded-lg border border-border bg-bg p-2 text-sm">
                <option value="gold_special">Clássico</option>
                <option value="gold_pro">Premium</option>
                <option value="free">Grátis</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text">
              Peso faturável (g, opcional)
              <input inputMode="numeric" value={billableWeight} onChange={(event) => setBillableWeight(event.target.value.replace(/\D/g, ""))} className="rounded-lg border border-border bg-bg p-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text">
              Logística (opcional)
              <input value={logisticType} onChange={(event) => setLogisticType(event.target.value)} placeholder="drop_off" className="rounded-lg border border-border bg-bg p-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text">
              Modo de envio (opcional)
              <input value={shippingMode} onChange={(event) => setShippingMode(event.target.value)} placeholder="me2" className="rounded-lg border border-border bg-bg p-2 text-sm" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={consultFees} disabled={loading || !categoryId}>
              {loading ? "Consultando…" : "Consultar tarifas oficiais"}
            </Button>
            <Button type="button" variant="ghost" onClick={disconnect}>Desconectar</Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {result && indicators && (
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-bg-muted p-2.5"><p className="text-xs text-text-muted">Tarifa total ML</p><p className="font-bold text-text">{formatCurrency(result.saleFeeAmount)}</p></div>
              <div className="rounded-xl bg-bg-muted p-2.5"><p className="text-xs text-text-muted">Líquido recebido</p><p className="font-bold text-text">{formatCurrency(indicators.netReceived)}</p></div>
              <div className="rounded-xl bg-bg-muted p-2.5"><p className="text-xs text-text-muted">Líquido / preço</p><p className="font-bold text-text">{formatPercent(indicators.liquidoSobrePreco)}</p></div>
              <div className="rounded-xl bg-bg-muted p-2.5"><p className="text-xs text-text-muted">Markup líquido / custo</p><p className="font-bold text-text">{indicators.liquidoSobreCusto.toFixed(2).replace(".", ",")}x ({formatPercent(indicators.liquidoSobreCusto)})</p></div>
            </div>
          )}
          {result && <p className="text-xs text-text-muted">Resultado oficial para {result.listingTypeName}. O custo fixo informado pelo Mercado Livre já está dentro da tarifa total.</p>}
        </>
      )}
    </Card>
  );
}
