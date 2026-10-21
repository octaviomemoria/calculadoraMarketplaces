"use client";

import { useEffect, type ReactNode } from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.theme) ?? "system";

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme() {
      if (theme === "dark") {
        root.setAttribute("data-theme", "dark");
        root.classList.add("dark");
        root.classList.remove("light");
      } else if (theme === "light") {
        root.setAttribute("data-theme", "light");
        root.classList.add("light");
        root.classList.remove("dark");
      } else {
        // system
        root.removeAttribute("data-theme");
        root.classList.remove("dark", "light");
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (isDark) {
          root.classList.add("dark");
        } else {
          root.classList.add("light");
        }
      }
    }

    applyTheme();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  return <>{children}</>;
}
