import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createDefaultChannels } from "@/lib/pricing/defaultChannels";
import type { MarketplaceChannel } from "@/lib/pricing/types";

interface ChannelsState {
  channels: MarketplaceChannel[];
  addCustomChannel: (nome: string) => MarketplaceChannel;
  duplicateChannel: (id: string) => MarketplaceChannel | null;
  updateChannel: (id: string, patch: Partial<Omit<MarketplaceChannel, "id" | "createdAt">>) => void;
  removeChannel: (id: string) => void;
  toggleAtivo: (id: string) => void;
  restoreDefault: (id: string) => void;
  getChannel: (id: string) => MarketplaceChannel | undefined;
  /** Semeia os canais padrão se a lista estiver vazia. Não sobrescreve dados existentes. */
  seedIfEmpty: () => void;
}

/** Adiciona modalidades padrão que ainda não existem (por nome), sem tocar nas existentes. */
export function mergeMissingDefaults(channels: MarketplaceChannel[]): MarketplaceChannel[] {
  const nomesExistentes = new Set(channels.map((c) => c.nome));
  const faltantes = createDefaultChannels().filter((d) => !nomesExistentes.has(d.nome));
  return [...channels, ...faltantes];
}

export const useChannelsStore = create<ChannelsState>()(
  persist(
    (set, get) => ({
      channels: [],

      addCustomChannel: (nome) => {
        const now = new Date().toISOString();
        const channel: MarketplaceChannel = {
          id: crypto.randomUUID(),
          nome,
          isCustom: true,
          ativo: true,
          comissaoPct: 0,
          taxaFixa: 0,
          custoFrete: 0,
          subsidioFrete: 0,
          taxaAntecipacaoPct: 0,
          antecipacaoAtiva: false,
          custoAds: 0,
          tipoCustoAds: "percentual",
          impostoPct: 0,
          taxaPagamentoPct: 0,
          taxasPersonalizadas: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ channels: [...state.channels, channel] }));
        return channel;
      },

      duplicateChannel: (id) => {
        const original = get().channels.find((c) => c.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: MarketplaceChannel = {
          ...original,
          id: crypto.randomUUID(),
          nome: `${original.nome} (cópia)`,
          isCustom: true,
          taxasPersonalizadas: original.taxasPersonalizadas.map((f) => ({
            ...f,
            id: crypto.randomUUID(),
          })),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ channels: [...state.channels, copy] }));
        return copy;
      },

      updateChannel: (id, patch) => {
        set((state) => ({
          channels: state.channels.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
          ),
        }));
      },

      removeChannel: (id) => {
        set((state) => ({ channels: state.channels.filter((c) => c.id !== id) }));
      },

      toggleAtivo: (id) => {
        set((state) => ({
          channels: state.channels.map((c) =>
            c.id === id ? { ...c, ativo: !c.ativo, updatedAt: new Date().toISOString() } : c,
          ),
        }));
      },

      restoreDefault: (id) => {
        const current = get().channels.find((c) => c.id === id);
        if (!current || current.isCustom) return;
        const defaults = createDefaultChannels();
        const original = defaults.find((d) => d.nome === current.nome);
        if (!original) return;
        set((state) => ({
          channels: state.channels.map((c) =>
            c.id === id
              ? { ...original, id: c.id, createdAt: c.createdAt, updatedAt: new Date().toISOString() }
              : c,
          ),
        }));
      },

      getChannel: (id) => get().channels.find((c) => c.id === id),

      seedIfEmpty: () => {
        if (get().channels.length === 0) {
          set({ channels: createDefaultChannels() });
        }
      },
    }),
    {
      name: "mkt-calc:channels",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = persistedState as { channels?: MarketplaceChannel[] };
        if (version < 2 && state?.channels) {
          state.channels = state.channels.map((c) => ({
            ...c,
            taxasPersonalizadas: c.taxasPersonalizadas ?? [],
          }));
        }
        if (version < 3 && state?.channels) {
          state.channels = mergeMissingDefaults(state.channels);
        }
        return state as ChannelsState;
      },
      onRehydrateStorage: () => (state) => {
        state?.seedIfEmpty();
      },
    },
  ),
);
