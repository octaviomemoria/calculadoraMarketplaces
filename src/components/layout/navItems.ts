export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/produtos", label: "Produtos", icon: "📦" },
  { href: "/canais", label: "Canais", icon: "🏬" },
  { href: "/comparacao", label: "Comparação", icon: "⚖️" },
  { href: "/desconto", label: "Desconto", icon: "🏷️" },
  { href: "/reversa", label: "Reversa", icon: "🔁" },
];
