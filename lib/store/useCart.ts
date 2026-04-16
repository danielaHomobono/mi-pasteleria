import { create } from "zustand";
import type { ProductVariantForCatalog } from "@/lib/actions/products";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  priceInCents: number;
  quantity: number;
  customMessage?: string;
}

interface CartStore {
  items: CartItem[];
  
  // Acciones
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCustomMessage: (itemId: string, message: string) => void;
  clearCart: () => void;
  
  // Selectores
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item: Omit<CartItem, "id">) => {
    set((state: CartStore) => {
      // Verificar si el item ya existe (mismo producto, variante y mensaje)
      const existingItem = state.items.find(
        (i: CartItem) =>
          i.productId === item.productId &&
          i.variantId === item.variantId &&
          i.customMessage === item.customMessage
      );

      if (existingItem) {
        // Incrementar cantidad si ya existe
        return {
          items: state.items.map((i: CartItem) =>
            i.id === existingItem.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }

      // Crear nuevo item con ID único
      const newItem: CartItem = {
        ...item,
        id: `${item.productId}-${item.variantId}-${Date.now()}`,
      };

      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (itemId: string) => {
    set((state: CartStore) => ({
      items: state.items.filter((item: CartItem) => item.id !== itemId),
    }));
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    set((state: CartStore) => ({
      items: state.items.map((item: CartItem) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    }));
  },

  updateCustomMessage: (itemId: string, message: string) => {
    set((state: CartStore) => ({
      items: state.items.map((item: CartItem) =>
        item.id === itemId ? { ...item, customMessage: message } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalItems: () => {
    const state = get();
    return state.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    const state = get();
    return state.items.reduce(
      (total: number, item: CartItem) => total + item.priceInCents * item.quantity,
      0
    );
  },
}));
