import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { emptyCostComponents, type CostComponents, type Product } from "@/lib/pricing/types";

export type NewProductPayload = Omit<Product, "id" | "createdAt" | "updatedAt">;

interface ProductsState {
  products: Product[];
  addProduct: {
    (input: NewProductPayload): Product;
    (nome: string, custos: CostComponents, sku?: string): Product;
  };
  updateProduct: (id: string, patch: Partial<Omit<Product, "id" | "createdAt">>) => void;
  removeProduct: (id: string) => void;
  duplicateProduct: (id: string) => Product | null;
  getProduct: (id: string) => Product | undefined;
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (arg1: string | NewProductPayload, arg2?: CostComponents, arg3?: string) => {
        const now = new Date().toISOString();
        let product: Product;

        if (typeof arg1 === "object" && arg1 !== null) {
          product = {
            id: crypto.randomUUID(),
            ...arg1,
            createdAt: now,
            updatedAt: now,
          };
        } else {
          product = {
            id: crypto.randomUUID(),
            nome: arg1,
            sku: arg3,
            custos: arg2 ?? emptyCostComponents(),
            createdAt: now,
            updatedAt: now,
          };
        }

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
          sku: original.sku ? `${original.sku}-copia` : undefined,
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
