import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_APP_SETTINGS, type AppSettings } from "@/lib/pricing/types";

interface SettingsState extends AppSettings {
  setMargemAlvoPadrao: (value: number) => void;
  setMargemSegurancaPadrao: (value: number) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_APP_SETTINGS,
      setMargemAlvoPadrao: (value) => set({ margemAlvoPadrao: value }),
      setMargemSegurancaPadrao: (value) => set({ margemSegurancaPadrao: value }),
      reset: () => set({ ...DEFAULT_APP_SETTINGS }),
    }),
    {
      name: "mkt-calc:settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
