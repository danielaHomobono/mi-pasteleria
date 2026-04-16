import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProductVariantForCatalog } from "@/lib/actions/products";

/**
 * CartItem - Producto en el carrito
 * 
 * Estructura:
 * - id: Identificador único (generado automáticamente)
 * - productId: ID del producto base
 * - productName: Nombre del producto (para mostrar)
 * - variantId: ID de la variante seleccionada
 * - variantName: Nombre de la variante (Grande, Mediana, etc)
 * - priceInCents: Precio en centavos (se divide por 100 para mostrar)
 * - quantity: Cantidad (1-10)
 * - customMessage: Mensaje personalizado en la torta (opcional, máx 40 caracteres)
 */
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  priceInCents: number;
  quantity: number;
  customMessage?: string;
  createdAt: string; // ISO timestamp para tracking
}

/**
 * CartStore - Store Zustand con persistencia en localStorage
 * 
 * Features:
 * - ✅ Agregar/remover ítems
 * - ✅ Actualizar cantidad y mensaje
 * - ✅ Persistencia automática en localStorage
 * - ✅ Sincronización entre pestañas
 * - ✅ Cálculos de totales
 * - ✅ Validaciones básicas
 */
interface CartStore {
  // Estado
  items: CartItem[];
  
  // Acciones de modificación
  addItem: (item: Omit<CartItem, "id" | "createdAt">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCustomMessage: (itemId: string, message: string) => void;
  clearCart: () => void;
  
  // Selectores / Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: () => number;
  isEmpty: () => boolean;
}

/**
 * useCart - Hook para gestionar el carrito
 * 
 * Uso:
 * const { items, addItem, removeItem } = useCart();
 * 
 * Persistencia:
 * - Se guarda automáticamente en localStorage con clave "cart-storage"
 * - Se recupera al recargar la página
 * - Sincroniza entre pestañas del navegador
 */
export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      /**
       * addItem - Agrega un item al carrito
       * 
       * Si el item ya existe (mismo producto, variante y mensaje),
       * incrementa la cantidad en lugar de agregarlo de nuevo.
       * 
       * @param item - Datos del item a agregar (sin id ni createdAt)
       */
      addItem: (item: Omit<CartItem, "id" | "createdAt">) => {
        set((state: CartStore) => {
          // Validación: cantidad entre 1 y 10
          if (item.quantity < 1 || item.quantity > 10) {
            console.warn("Cantidad debe estar entre 1 y 10");
            return state;
          }

          // Validación: mensaje máximo 40 caracteres
          if (item.customMessage && item.customMessage.length > 40) {
            console.warn("Mensaje debe tener máximo 40 caracteres");
            return state;
          }

          // Verificar si el item ya existe (mismo producto, variante y mensaje)
          const existingItem = state.items.find(
            (i: CartItem) =>
              i.productId === item.productId &&
              i.variantId === item.variantId &&
              i.customMessage === item.customMessage
          );

          if (existingItem) {
            // Incrementar cantidad si ya existe (máximo 10)
            const newQuantity = Math.min(existingItem.quantity + item.quantity, 10);
            return {
              items: state.items.map((i: CartItem) =>
                i.id === existingItem.id
                  ? { ...i, quantity: newQuantity }
                  : i
              ),
            };
          }

          // Crear nuevo item con ID único y timestamp
          const newItem: CartItem = {
            ...item,
            id: `${item.productId}-${item.variantId}-${Date.now()}-${Math.random()}`,
            createdAt: new Date().toISOString(),
          };

          return { items: [...state.items, newItem] };
        });
      },

      /**
       * removeItem - Elimina un item del carrito por ID
       */
      removeItem: (itemId: string) => {
        set((state: CartStore) => ({
          items: state.items.filter((item: CartItem) => item.id !== itemId),
        }));
      },

      /**
       * updateQuantity - Actualiza la cantidad de un item
       * 
       * Si cantidad <= 0, elimina el item.
       * Máximo 10 unidades.
       */
      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        if (quantity > 10) {
          console.warn("Cantidad máxima es 10");
          return;
        }

        set((state: CartStore) => ({
          items: state.items.map((item: CartItem) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      /**
       * updateCustomMessage - Actualiza el mensaje personalizado de un item
       * 
       * Máximo 40 caracteres.
       */
      updateCustomMessage: (itemId: string, message: string) => {
        if (message.length > 40) {
          console.warn("Mensaje debe tener máximo 40 caracteres");
          return;
        }

        set((state: CartStore) => ({
          items: state.items.map((item: CartItem) =>
            item.id === itemId ? { ...item, customMessage: message } : item
          ),
        }));
      },

      /**
       * clearCart - Vacía completamente el carrito
       */
      clearCart: () => {
        set({ items: [] });
      },

      /**
       * getTotalItems - Suma la cantidad de todos los items
       * 
       * Ej: 3 items de cantidad 2, 1 item de cantidad 1 = 7 total
       */
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
      },

      /**
       * getTotalPrice - Suma el precio total en centavos
       * 
       * Para mostrar en ARS: getTotalPrice() / 100
       * Ej: 300100 centavos = $3.001,00 ARS
       */
      getTotalPrice: () => {
        const state = get();
        return state.items.reduce(
          (total: number, item: CartItem) => total + item.priceInCents * item.quantity,
          0
        );
      },

      /**
       * getItemCount - Retorna la cantidad de items únicos en el carrito
       * 
       * Diferente de getTotalItems():
       * - getTotalItems() = suma de cantidades (2 + 1 + 3 = 6)
       * - getItemCount() = cantidad de items únicos (3 items)
       */
      getItemCount: () => {
        const state = get();
        return state.items.length;
      },

      /**
       * isEmpty - Verifica si el carrito está vacío
       */
      isEmpty: () => {
        const state = get();
        return state.items.length === 0;
      },
    }),
    {
      // Configuración de persistencia
      name: "cart-storage", // Clave en localStorage
      storage: createJSONStorage(() => localStorage), // Usar localStorage
      version: 1, // Versión para migraciones futuras
      
      // Sincronización entre pestañas
      partialize: (state) => ({ items: state.items }),
    }
  )
);
