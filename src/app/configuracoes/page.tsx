"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PercentInput } from "@/components/ui/PercentInput";
import { useProductsStore } from "@/lib/store/useProductsStore";
import { useChannelsStore } from "@/lib/store/useChannelsStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { createDefaultChannels } from "@/lib/pricing/defaultChannels";
import { DEFAULT_APP_SETTINGS } from "@/lib/pricing/types";
import { ACCESS_CONFIG } from "@/lib/access/config";
import { lockThisDevice } from "@/lib/access/gate";

const BACKUP_VERSION = 1;

export default function ConfiguracoesPage() {
  const margemAlvoPadrao = useSettingsStore((s) => s.margemAlvoPadrao);
  const setMargemAlvoPadrao = useSettingsStore((s) => s.setMargemAlvoPadrao);
  const margemSegurancaPadrao = useSettingsStore((s) => s.margemSegurancaPadrao);
  const setMargemSegurancaPadrao = useSettingsStore((s) => s.setMargemSegurancaPadrao);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleExport() {
    const backup = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      products: useProductsStore.getState().products,
      channels: useChannelsStore.getState().channels,
      settings: {
        margemAlvoPadrao: useSettingsStore.getState().margemAlvoPadrao,
        margemSegurancaPadrao: useSettingsStore.getState().margemSegurancaPadrao,
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

  async function handleImportFile(file: File) {
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
        });
      }
      setFeedback("Backup importado com sucesso.");
    } catch {
      setFeedback("Não foi possível ler esse arquivo. Verifique se é um backup exportado por este app.");
    }
  }

  function handleReset() {
    if (!confirm("Isso vai apagar todos os produtos e restaurar os canais e margens padrão. Continuar?")) {
      return;
    }
    useProductsStore.setState({ products: [] });
    useChannelsStore.setState({ channels: createDefaultChannels() });
    useSettingsStore.setState({ ...DEFAULT_APP_SETTINGS });
    setFeedback("Dados resetados.");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text">Configurações</h1>

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

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text">Backup dos dados</p>
        <p className="text-xs text-text-muted">
          Seus dados ficam só neste navegador. Exporte um backup para não perdê-los ao trocar de
          dispositivo ou limpar o cache.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>
            Exportar backup (JSON)
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Importar backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="danger" onClick={handleReset}>
            Resetar dados
          </Button>
        </div>
        {feedback && <p className="text-sm text-text-muted">{feedback}</p>}
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-text">Acesso ao app</p>
        <p className="text-xs text-text-muted">
          Status: {ACCESS_CONFIG.enabled ? "bloqueio por senha ativado" : "bloqueio desativado"}
          {ACCESS_CONFIG.enabled && ` · versão ${ACCESS_CONFIG.version}`}
        </p>
        <p className="text-xs text-text-muted">
          A senha é definida fora do app, nas variáveis de ambiente da Vercel
          (<code>NEXT_PUBLIC_ACCESS_ENABLED</code>, <code>NEXT_PUBLIC_ACCESS_PASSWORD</code>,{" "}
          <code>NEXT_PUBLIC_ACCESS_VERSION</code>) — mudar a senha exige um redeploy. Trocar só a{" "}
          <code>VERSION</code> força todo mundo a digitar a senha de novo, sem precisar trocar a
          senha em si.
        </p>
        <p className="text-xs text-danger">
          Este bloqueio é um filtro simples contra acesso casual — não é segurança real. A senha
          fica visível para quem inspecionar o código do site. Não reutilize senhas importantes
          aqui.
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
