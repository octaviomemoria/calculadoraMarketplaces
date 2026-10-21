"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PercentInput } from "@/components/ui/PercentInput";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { createDefaultChannels } from "@/lib/pricing/defaultChannels";
import { DEFAULT_APP_SETTINGS, type ThemePreference } from "@/lib/pricing/types";
import { ACCESS_CONFIG } from "@/lib/access/config";
import { lockThisDevice } from "@/lib/access/gate";
import { exportProductsToCsv, parseProductsCsv } from "@/lib/csv/productCsv";
import { SunIcon, MoonIcon, MonitorIcon, DownloadIcon, UploadIcon } from "@/components/ui/Icons";

const BACKUP_VERSION = 1;

export default function ConfiguracoesPage() {
  const margemAlvoPadrao = useSettingsStore((s) => s.margemAlvoPadrao);
  const setMargemAlvoPadrao = useSettingsStore((s) => s.setMargemAlvoPadrao);
  const margemSegurancaPadrao = useSettingsStore((s) => s.margemSegurancaPadrao);
  const setMargemSegurancaPadrao = useSettingsStore((s) => s.setMargemSegurancaPadrao);
  const currentTheme = useSettingsStore((s) => s.theme) ?? "system";
  const setTheme = useSettingsStore((s) => s.setTheme);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Backup JSON completo
  function handleExportJson() {
    const backup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      products: useProductsStore.getState().products,
      channels: useChannelsStore.getState().channels,
      settings: {
        margemAlvoPadrao: useSettingsStore.getState().margemAlvoPadrao,
        margemSegurancaPadrao: useSettingsStore.getState().margemSegurancaPadrao,
        theme: useSettingsStore.getState().theme,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `margem-certa-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportJsonFile(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.products) || !Array.isArray(parsed.channels)) {
        throw new Error("Arquivo inválido");
      }
      useProductsStore.setState({ products: parsed.products });
      useChannelsStore.setState({ channels: parsed.channels });
      if (parsed.settings) {
        useSettingsStore.setState({
          margemAlvoPadrao: parsed.settings.margemAlvoPadrao ?? DEFAULT_APP_SETTINGS.margemAlvoPadrao,
          margemSegurancaPadrao:
            parsed.settings.margemSegurancaPadrao ?? DEFAULT_APP_SETTINGS.margemSegurancaPadrao,
          theme: parsed.settings.theme ?? DEFAULT_APP_SETTINGS.theme,
        });
      }
      setFeedback("✅ Backup JSON importado com sucesso.");
    } catch {
      setFeedback("❌ Não foi possível ler esse arquivo. Verifique se é um backup exportado por este app.");
    }
  }

  // Exportar produtos para CSV
  function handleExportProductsCsv() {
    const products = useProductsStore.getState().products;
    if (products.length === 0) {
      setFeedback("⚠️ Nenhum produto cadastrado para exportar.");
      return;
    }
    const csvContent = exportProductsToCsv(products);
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produtos-margem-certa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback(`✅ ${products.length} produtos exportados para CSV.`);
  }

  // Importar produtos de CSV
  async function handleImportProductsCsv(file: File) {
    try {
      const text = await file.text();
      const settings = useSettingsStore.getState();
      const { validProducts, errors } = parseProductsCsv(text, settings);

      if (errors.length > 0 && validProducts.length === 0) {
        setFeedback(`❌ Erro no CSV: ${errors[0]}`);
        return;
      }

      if (validProducts.length === 0) {
        setFeedback("⚠️ Nenhum produto válido encontrado no arquivo CSV.");
        return;
      }

      const addProduct = useProductsStore.getState().addProduct;
      for (const p of validProducts) {
        addProduct(p);
      }

      setFeedback(`✅ ${validProducts.length} produto(s) importado(s) com sucesso para sua lista!`);
    } catch {
      setFeedback("❌ Falha ao processar o arquivo CSV.");
    }
  }

  function handleReset() {
    if (!confirm("Isso vai apagar todos os produtos e restaurar os canais e margens padrão. Continuar?")) {
      return;
    }
    useProductsStore.setState({ products: [] });
    useChannelsStore.setState({ channels: createDefaultChannels() });
    useSettingsStore.setState({ ...DEFAULT_APP_SETTINGS });
    setFeedback("Dados resetados para as configurações originais de fábrica.");
  }

  const themeOptions: { value: ThemePreference; label: string; icon: typeof SunIcon }[] = [
    { value: "light", label: "Claro", icon: SunIcon },
    { value: "dark", label: "Escuro", icon: MoonIcon },
    { value: "system", label: "Sistema", icon: MonitorIcon },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text">Configurações</h1>

      {feedback && (
        <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm font-medium text-text shadow-xs">
          {feedback}
        </div>
      )}

      {/* Aparência e Tema */}
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text">Aparência do aplicativo</p>
        <p className="text-xs text-text-muted">
          Escolha entre tema Claro, Escuro ou sincronize automaticamente com o modo do seu dispositivo.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = currentTheme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-bg-elevated text-text hover:bg-bg-muted"
                }`}
              >
                <Icon size={18} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Margens padrão */}
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text">Margens padrão</p>
        <p className="text-xs text-text-muted">
          Usadas em novos produtos e sempre que uma margem específica não é definida.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">Margem de segurança padrão</span>
            <PercentInput value={margemSegurancaPadrao} onChange={setMargemSegurancaPadrao} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">Margem alvo padrão</span>
            <PercentInput value={margemAlvoPadrao} onChange={setMargemAlvoPadrao} />
          </label>
        </div>
      </Card>

      {/* Planilhas e Produtos (CSV) */}
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text">Planilhas e Produtos (CSV)</p>
        <p className="text-xs text-text-muted">
          Exporte seus produtos para abrir no Excel / Google Planilhas ou importe produtos em massa a partir de um arquivo CSV.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExportProductsCsv} className="flex items-center gap-2">
            <DownloadIcon size={16} />
            <span>Exportar Produtos (.csv)</span>
          </Button>
          <Button variant="secondary" onClick={() => csvInputRef.current?.click()} className="flex items-center gap-2">
            <UploadIcon size={16} />
            <span>Importar Produtos (.csv)</span>
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportProductsCsv(file);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      {/* Backup completo do sistema (JSON) */}
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text">Backup completo do sistema (JSON)</p>
        <p className="text-xs text-text-muted">
          Seus dados ficam armazenados neste navegador. Exporte um backup completo (produtos, canais e taxas personalizadas) para transferir entre computadores ou celular.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExportJson}>
            Exportar backup (JSON)
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Importar backup (JSON)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportJsonFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="danger" onClick={handleReset}>
            Resetar tudo
          </Button>
        </div>
      </Card>

      {/* Acesso ao app */}
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text">Acesso ao app</p>
        <p className="text-xs text-text-muted">
          Status: {ACCESS_CONFIG.enabled ? "bloqueio por senha ativado" : "bloqueio desativado"}
          {ACCESS_CONFIG.enabled && ` · versão ${ACCESS_CONFIG.version}`}
        </p>
        <p className="text-xs text-text-muted">
          A senha é definida fora do app, nas variáveis de ambiente da Vercel
          (<code>NEXT_PUBLIC_ACCESS_ENABLED</code>, <code>NEXT_PUBLIC_ACCESS_PASSWORD</code>,{" "}
          <code>NEXT_PUBLIC_ACCESS_VERSION</code>).
        </p>
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => {
            lockThisDevice();
            window.location.reload();
          }}
        >
          Sair deste dispositivo
        </Button>
      </Card>
    </div>
  );
}
