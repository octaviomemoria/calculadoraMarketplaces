import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CostComponents, Product } from "@/lib/pricing/types";

interface ProductsState {
  products: Product[];
  addProduct: (nome: string, custos: CostComponents, sku?: string) => Product;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id" | "createdAt">>) => void;
  removeProduct: (id: string) => void;
  duplicateProduct: (id: string) => Product | null;
  getProduct: (id: string) => Product | undefined;
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (nome, custos, sku) => {
        const now = new Date().toISOString();
        const product: Product = {
          id: crypto.randomUUID(),
          nome,
          sku,
          custos,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ products: [...state.products, product] }));
        return product;
      },

      updateProduct: (id, patch) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
          ),
        }));
      },

      removeProduct: (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
      },

      duplicateProduct: (id) => {
        const original = get().products.find((p) => p.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: Product = {
          ...original,
          id: crypto.randomUUID(),
          nome: `${original.nome} (cópia)`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ products: [...state.products, copy] }));
        return copy;
      },

      getProduct: (id) => get().products.find((p) => p.id === id),
    }),
    {
      name: "mkt-calc:products",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
