import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_APP_SETTINGS, type AppSettings, type ThemePreference } from "@/lib/pricing/types";

interface SettingsState extends AppSettings {
  theme: ThemePreference;
  setMargemAlvoPadrao: (value: number) => void;
  setMargemSegurancaPadrao: (value: number) => void;
  setTheme: (theme: ThemePreference) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_APP_SETTINGS,
      theme: DEFAULT_APP_SETTINGS.theme ?? "system",
      setMargemAlvoPadrao: (value) => set({ margemAlvoPadrao: value }),
      setMargemSegurancaPadrao: (value) => set({ margemSegurancaPadrao: value }),
      setTheme: (theme) => set({ theme }),
      reset: () => set({ ...DEFAULT_APP_SETTINGS, theme: "system" }),
    }),
    {
      name: "mkt-calc:settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
