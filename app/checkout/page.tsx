'use client';

import { CheckoutForm } from '@/components/features/CheckoutForm';
import { useCart } from '@/lib/store/useCart';

/**
 * /app/checkout/page.tsx
 * Página de checkout que integra el formulario elegante
 */
export default function CheckoutPage() {
  const { items: cartItems } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-light text-neutral-900 mb-2">Carrito Vacío</h1>
          <p className="text-neutral-600 mb-6">
            Selecciona algunos dulces deliciosos antes de proceder al checkout
          </p>
          <a
            href="/products"
            className="inline-block px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Ver Productos
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-neutral-900 tracking-tight">
            Completa tu Pedido
          </h1>
          <p className="text-neutral-600 mt-2">
            Elige tu horario de retiro y confirma tu compra
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <CheckoutForm cartItems={cartItems} />
          </div>

          {/* Right: Order Summary Sticky */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <OrderSummary cartItems={cartItems} />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * OrderSummary - Resumen visual del carrito en el checkout
 */
function OrderSummary({ cartItems }: { cartItems: any[] }) {
  const total = cartItems.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0);
  const totalARS = (total / 100).toFixed(2);

  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-4">
        Tu Pedido
      </h3>

      <div className="space-y-3 mb-4 pb-4 border-b border-neutral-200">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <div>
              <p className="text-neutral-900 font-medium">{item.productName}</p>
              <p className="text-xs text-neutral-500">{item.variantName} x {item.quantity}</p>
              {item.customMessage && (
                <p className="text-xs text-neutral-600 italic mt-1">"{item.customMessage}"</p>
              )}
            </div>
            <p className="text-neutral-900 font-medium">
              ${((item.priceInCents * item.quantity) / 100).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-neutral-600">Subtotal</span>
          <span className="text-neutral-900 font-medium">${totalARS}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Envío</span>
          <span className="text-green-600 text-sm">Gratis</span>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-200">
        <div className="flex justify-between">
          <span className="text-neutral-900 font-semibold">Total</span>
          <span className="text-neutral-900 font-semibold text-lg">${totalARS} ARS</span>
        </div>
      </div>

      <p className="text-xs text-neutral-500 text-center mt-4">
        ✦ Pago seguro con Mercado Pago ✦
      </p>
    </div>
  );
}
