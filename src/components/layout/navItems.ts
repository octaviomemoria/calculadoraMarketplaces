export type NavIconKey = "produtos" | "canais" | "comparacao" | "desconto" | "reversa";

export interface NavItem {
  href: string;
  label: string;
  iconKey: NavIconKey;
  iconEmoji: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/produtos", label: "Produtos", iconKey: "produtos", iconEmoji: "📦" },
  { href: "/canais", label: "Canais", iconKey: "canais", iconEmoji: "🏬" },
  { href: "/comparacao", label: "Comparação", iconKey: "comparacao", iconEmoji: "⚖️" },
  { href: "/desconto", label: "Desconto", iconKey: "desconto", iconEmoji: "🏷️" },
  { href: "/reversa", label: "Reversa", iconKey: "reversa", iconEmoji: "🔁" },
];
