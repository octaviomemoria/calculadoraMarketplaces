import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { AccessGate } from "@/components/access/AccessGate";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Margem Certa — Calculadora de Preços para Marketplaces",
  description:
    "Descubra quanto cobrar em cada marketplace para manter a margem de lucro desejada.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AccessGate>
            <AppShell>{children}</AppShell>
          </AccessGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
