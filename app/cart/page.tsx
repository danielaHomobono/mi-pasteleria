"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCartStats } from "@/lib/hooks/useCartHooks";
import { CartSidebar } from "@/components/features/cart-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag } from "lucide-react";

/**
 * CartPage - Página completa del carrito de compras
 * 
 * Muestra:
 * - Resumen del carrito
 * - Información de envío y lead time
 * - Opciones de pago
 * - Botones de acción
 */
export default function CartPage() {
  const { totalItems, totalPrice, isEmpty, isLoading } = useCartStats();

  if (isLoading) {
    return <CartPageSkeleton />;
  }

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/10 py-4">
        <div className="max-w-6xl mx-auto px-5 flex items-center gap-4">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </motion.button>
          </Link>
          <h1 className="font-serif text-2xl">Carrito de Compras</h1>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-5 py-12">
        {isEmpty ? (
          <EmptyCartState />
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contenido principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información de envío */}
              <ShippingInfoCard />

              {/* Lead time */}
              <LeadTimeCard />

              {/* Métodos de pago */}
              <PaymentMethodsCard />
            </div>

            {/* Sidebar del carrito */}
            <CartSidebar />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border/10 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-5">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Mi Pastelería. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * EmptyCartState - Estado del carrito vacío
 */
function EmptyCartState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-6">
        <ShoppingBag size={64} className="text-muted-foreground/30" />
      </div>
      <h2 className="font-serif text-2xl mb-2">Tu carrito está vacío</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Descubrí nuestras tortas artesanales y personaliza la perfecta para ti.
      </p>
      <Link href="/">
        <Button className="font-serif">
          Volver al Catálogo
        </Button>
      </Link>
    </motion.div>
  );
}

/**
 * ShippingInfoCard - Tarjeta de información de envío
 */
function ShippingInfoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Información de Envío</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Nombre Completo
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                className="w-full mt-2 px-3 py-2 border border-border/50 rounded-lg font-serif text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Teléfono
              </label>
              <input
                type="tel"
                placeholder="+54 9 123 456 7890"
                className="w-full mt-2 px-3 py-2 border border-border/50 rounded-lg font-serif text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full mt-2 px-3 py-2 border border-border/50 rounded-lg font-serif text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * LeadTimeCard - Información sobre el lead time
 */
function LeadTimeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-amber-200/50 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Badge className="bg-amber-600">Importante</Badge>
            Tiempo de Producción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-serif font-light text-amber-900 dark:text-amber-100">
              ⏱️ <span className="font-semibold">Lead time mínimo: 48 horas</span>
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
              Todas nuestras tortas se preparan de forma artesanal. Para garantizar
              frescura y calidad, requerimos un mínimo de 48 horas desde la confirmación
              del pedido hasta el retiro.
            </p>
          </div>

          <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Selecciona fecha y hora de retiro
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="date"
                className="px-3 py-2 border border-border/50 rounded-lg font-serif text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="time"
                className="px-3 py-2 border border-border/50 rounded-lg font-serif text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * PaymentMethodsCard - Métodos de pago disponibles
 */
function PaymentMethodsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-primary rounded-lg cursor-pointer hover:bg-accent/5 transition-colors">
              <input
                type="radio"
                name="payment"
                defaultChecked
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Mercado Pago</p>
                <p className="text-sm text-muted-foreground">Tarjetas, billeteras digitales</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-border/50 rounded-lg cursor-pointer hover:bg-accent/5 transition-colors">
              <input type="radio" name="payment" className="w-4 h-4" />
              <div>
                <p className="font-medium">Transferencia Bancaria</p>
                <p className="text-sm text-muted-foreground">Realiza una transferencia</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-border/50 rounded-lg cursor-pointer hover:bg-accent/5 transition-colors">
              <input type="radio" name="payment" className="w-4 h-4" />
              <div>
                <p className="font-medium">Efectivo en Retiro</p>
                <p className="text-sm text-muted-foreground">Paga al retirar tu pedido</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * CartPageSkeleton - Skeleton de carga de la página
 */
function CartPageSkeleton() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="border-b border-border/10 py-4">
        <div className="max-w-6xl mx-auto px-5 h-8 bg-muted rounded w-32 animate-pulse" />
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-5 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </main>
  );
}
