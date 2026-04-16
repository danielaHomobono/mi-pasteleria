"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCartWithHydration, formatCartPrice } from "@/lib/hooks/useCartHooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Minus } from "lucide-react";

/**
 * CartSidebar - Sidebar del carrito de compras
 * 
 * Muestra:
 * - Lista de items
 * - Precio unitario y subtotal
 * - Controles de cantidad
 * - Total del carrito
 * - Botón de checkout
 */
export function CartSidebar() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    isEmpty,
    isLoading,
  } = useCartWithHydration();

  if (isLoading) {
    return <CartSidebarSkeleton />;
  }

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <div className="w-full max-w-md">
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span className="font-serif">Tu Carrito</span>
            <span className="text-sm font-normal text-muted-foreground">
              {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Lista de items */}
          <AnimatePresence mode="popLayout">
            {isEmpty() ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center"
              >
                <p className="text-sm text-muted-foreground font-serif">
                  Tu carrito está vacío
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item} onRemove={removeItem} />
                ))}
              </div>
            )}
          </AnimatePresence>

          {!isEmpty() && (
            <>
              {/* Separador */}
              <div className="border-t border-border/50" />

              {/* Total */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCartPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-serif font-light">Total</span>
                  <span className="text-lg font-semibold">
                    {formatCartPrice(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="space-y-2 pt-4">
                <Button className="w-full font-serif" size="lg">
                  Proceder al Checkout
                </Button>
                <Button variant="outline" className="w-full font-serif" size="sm">
                  Continuar Comprando
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * CartItemRow - Fila individual de un item en el carrito
 */
interface CartItemRowProps {
  item: any;
  onRemove: (id: string) => void;
}

function CartItemRow({ item, onRemove }: CartItemRowProps) {
  const { updateQuantity } = useCartWithHydration();
  const subtotal = item.priceInCents * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-border/50 p-3 space-y-2 bg-accent/2"
    >
      {/* Nombre y variante */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
          <p className="text-xs text-muted-foreground">{item.variantName}</p>
          {item.customMessage && (
            <p className="text-xs text-accent-foreground font-serif italic">
              "{item.customMessage}"
            </p>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRemove(item.id)}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>

      {/* Cantidad y precio */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="p-1 rounded hover:bg-accent transition-colors"
            disabled={item.quantity <= 1}
          >
            <Minus size={14} />
          </motion.button>
          <span className="w-6 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="p-1 rounded hover:bg-accent transition-colors"
            disabled={item.quantity >= 10}
          >
            <Plus size={14} />
          </motion.button>
        </div>
        <span className="text-sm font-semibold">
          {formatCartPrice(subtotal)}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * CartSidebarSkeleton - Skeleton de carga del carrito
 */
function CartSidebarSkeleton() {
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
        </CardHeader>

        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * CartMiniIcon - Icono del carrito para la barra de navegación
 * 
 * Muestra badge con cantidad de items
 */
export function CartMiniIcon() {
  const { getTotalItems, isLoading } = useCartWithHydration();
  const totalItems = getTotalItems();

  if (isLoading) {
    return <div className="w-6 h-6 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="relative inline-flex">
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>

      {totalItems > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
        >
          {totalItems > 9 ? "9+" : totalItems}
        </motion.span>
      )}
    </div>
  );
}
