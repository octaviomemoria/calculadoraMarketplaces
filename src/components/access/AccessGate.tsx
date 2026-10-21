"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ACCESS_CONFIG } from "@/lib/access/config";
import { isUnlocked } from "@/lib/access/gate";
import { LockScreen } from "./LockScreen";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return isUnlocked();
}

/** Durante o export estático (sem window), assume bloqueado se o portão estiver ativo — evita
 *  qualquer flash do conteúdo protegido antes da checagem real no cliente. */
function getServerSnapshot() {
  return !ACCESS_CONFIG.enabled;
}

export function AccessGate({ children }: { children: ReactNode }) {
  const persistedUnlocked = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);

  if (persistedUnlocked || sessionUnlocked) {
    return <>{children}</>;
  }
  return <LockScreen onUnlock={() => setSessionUnlocked(true)} />;
}
