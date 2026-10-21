"use client";

import { useState } from "react";
import { tryUnlock } from "@/lib/access/gate";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tryUnlock(password)) {
      setErro(false);
      onUnlock();
    } else {
      setErro(true);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-6"
      >
        <div>
          <h1 className="text-lg font-bold text-text">Margem Certa</h1>
          <p className="text-sm text-text-muted">Digite a senha de acesso para continuar.</p>
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErro(false);
          }}
          placeholder="Senha"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
        />
        {erro && <p className="text-sm text-danger">Senha incorreta.</p>}
        <button
          type="submit"
          className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
