"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navItems";
import { BottomNav } from "./BottomNav";
import { BoltIcon, SettingsIcon } from "@/components/ui/Icons";
import { QuickCalcModal } from "@/components/calculadora/QuickCalcModal";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [quickCalcOpen, setQuickCalcOpen] = useState(false);

  return (
    <div className="min-h-dvh pb-16 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-border bg-bg-elevated">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/produtos" className="text-base font-bold text-text hover:text-primary transition-colors">
              Margem Certa
            </Link>
            <button
              type="button"
              onClick={() => setQuickCalcOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 text-xs font-semibold transition-colors"
              title="Abrir calculadora rápida express"
            >
              <BoltIcon size={14} />
              <span className="hidden sm:inline">Cálculo Rápido</span>
            </button>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-text-muted hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href="/configuracoes"
              className={`rounded-lg p-2 transition-colors ${
                pathname === "/configuracoes" ? "text-primary bg-primary/10" : "text-text-muted hover:text-text"
              }`}
              aria-label="Configurações"
            >
              <SettingsIcon size={20} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>

      <BottomNav />

      <QuickCalcModal isOpen={quickCalcOpen} onClose={() => setQuickCalcOpen(false)} />
    </div>
  );
}
