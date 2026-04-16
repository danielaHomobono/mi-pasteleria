import { useEffect, useState } from "react";
import { useCart } from "@/lib/store/useCart";
import type { CartItem } from "@/lib/store/useCart";

/**
 * useCartWithHydration - Hook que asegura que el store esté hidratado
 * 
 * Resuelve el problema de SSR en Next.js donde el componente se renderiza
 * antes de que localStorage esté disponible.
 * 
 * Uso:
 * const { items, addItem, isLoading } = useCartWithHydration();
 */
export function useCartWithHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const cart = useCart();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    ...cart,
    isLoading: !isHydrated,
  };
}

/**
 * useCartStats - Hook que retorna estadísticas del carrito
 * 
 * Proporciona métodos para cálculos comunes.
 * 
 * Uso:
 * const { totalPrice, totalItems, isEmpty } = useCartStats();
 */
export function useCartStats() {
  const { items, getTotalPrice, getTotalItems, isEmpty } = useCart();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    items: isHydrated ? items : [],
    totalItems: isHydrated ? getTotalItems() : 0,
    totalPrice: isHydrated ? getTotalPrice() : 0,
    isEmpty: isHydrated ? isEmpty() : true,
    isLoading: !isHydrated,
  };
}

/**
 * useCartItem - Hook para operaciones en un item específico
 * 
 * Facilita el manejo de un item individual del carrito.
 * 
 * Uso:
 * const { item, updateQuantity, removeItem } = useCartItem(itemId);
 */
export function useCartItem(itemId: string) {
  const { items, removeItem, updateQuantity, updateCustomMessage } = useCart();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const item = items.find((i) => i.id === itemId);

  return {
    item: isHydrated ? item : undefined,
    removeItem: () => removeItem(itemId),
    updateQuantity: (quantity: number) => updateQuantity(itemId, quantity),
    updateCustomMessage: (message: string) => updateCustomMessage(itemId, message),
    isLoading: !isHydrated,
  };
}

/**
 * formatCartPrice - Formatea el precio del carrito en ARS
 * 
 * @param centavos - Precio en centavos
 * @returns String con formato "$1.500,50"
 */
export function formatCartPrice(centavos: number): string {
  const pesos = centavos / 100;

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}
