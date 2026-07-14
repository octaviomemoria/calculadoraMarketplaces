"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NAV_ITEMS } from "./navItems";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh pb-16 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-border bg-bg-elevated">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/produtos" className="text-base font-bold text-text">
            Margem Certa
          </Link>
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
          <Link
            href="/configuracoes"
            className={`rounded-lg p-2 text-lg ${
              pathname === "/configuracoes" ? "text-primary" : "text-text-muted hover:text-text"
            }`}
            aria-label="Configurações"
          >
            ⚙️
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>

      <BottomNav />
    </div>
  );
}
