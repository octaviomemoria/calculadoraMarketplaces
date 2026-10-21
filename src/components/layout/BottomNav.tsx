"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, type NavIconKey } from "./navItems";
import { PackageIcon, StoreIcon, ScaleIcon, TagIcon, RefreshIcon } from "@/components/ui/Icons";

function renderNavIcon(key: NavIconKey, active: boolean) {
  const iconProps = {
    size: 20,
    className: `transition-transform ${active ? "scale-110" : ""}`,
  };

  switch (key) {
    case "produtos":
      return <PackageIcon {...iconProps} />;
    case "canais":
      return <StoreIcon {...iconProps} />;
    case "comparacao":
      return <ScaleIcon {...iconProps} />;
    case "desconto":
      return <TagIcon {...iconProps} />;
    case "reversa":
      return <RefreshIcon {...iconProps} />;
  }
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-bg-elevated px-1 pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
              active ? "text-primary font-semibold" : "text-text-muted hover:text-text"
            }`}
          >
            {renderNavIcon(item.iconKey, active)}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
