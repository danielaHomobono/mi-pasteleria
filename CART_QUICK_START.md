# 🛒 Quick Start - Carrito de Compras

## Uso Rápido en Componentes

### 1. Agregar item al carrito (desde CakeCustomizer)

```tsx
"use client";

import { useCart } from "@/lib/store/useCart";

export function AddToCartButton() {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      productId: "prod-1",
      productName: "Torta Selva Negra",
      variantId: "var-1",
      variantName: "Grande",
      priceInCents: 250000,
      quantity: 2,
      customMessage: "¡Feliz Cumpleaños!",
    });
    // ✅ Automáticamente:
    // - Se guarda en localStorage
    // - Se sincroniza con otras pestañas
    // - CartSidebar se actualiza
  };

  return <button onClick={handleAddToCart}>Agregar al carrito</button>;
}
```

---

### 2. Mostrar el carrito (en navbar o sidebar)

```tsx
"use client";

import { useCart } from "@/lib/store/useCart";
import { ShoppingCart } from "lucide-react";

export function CartIcon() {
  const { getTotalItems } = useCart();
  const itemCount = getTotalItems();

  return (
    <div className="relative">
      <ShoppingCart size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {itemCount}
        </span>
      )}
    </div>
  );
}
```

---

### 3. Mostrar lista de items del carrito

```tsx
"use client";

import { useCartWithHydration } from "@/lib/hooks/useCartHooks";

export function CartList() {
  const { items, isLoading } = useCartWithHydration();

  if (isLoading) return <div>Cargando carrito...</div>;

  if (items.length === 0) return <div>Carrito vacío 😢</div>;

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border p-4 rounded">
          <p className="font-bold">{item.productName} ({item.variantName})</p>
          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
          {item.customMessage && (
            <p className="text-sm italic">"{item.customMessage}"</p>
          )}
          <p className="text-lg font-bold">
            ${(item.priceInCents * item.quantity / 100).toLocaleString("es-AR")}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

### 4. Mostrar total del carrito

```tsx
"use client";

import { useCartStats } from "@/lib/hooks/useCartHooks";
import { formatCartPrice } from "@/lib/hooks/useCartHooks";

export function CartTotal() {
  const { totalPrice, totalItems, isEmpty, isLoading } = useCartStats();

  if (isLoading) return <div>Cargando...</div>;

  if (isEmpty) return <div>Tu carrito está vacío</div>;

  return (
    <div className="border-t pt-4">
      <div className="flex justify-between mb-2">
        <span>Subtotal ({totalItems} items):</span>
        <span>{formatCartPrice(totalPrice)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold">
        <span>Total:</span>
        <span>{formatCartPrice(totalPrice)}</span>
      </div>
    </div>
  );
}
```

---

### 5. Modificar cantidad de un item

```tsx
"use client";

import { useCartItem } from "@/lib/hooks/useCartHooks";

export function ItemQuantityControl({ itemId }: { itemId: string }) {
  const { item, updateQuantity, isLoading } = useCartItem(itemId);

  if (isLoading) return <div>Cargando...</div>;
  if (!item) return null;

  const handleIncrement = () => {
    if (item.quantity < 10) {
      updateQuantity(item.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.quantity - 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleDecrement} disabled={item.quantity <= 1}>
        -
      </button>
      <span>{item.quantity}</span>
      <button onClick={handleIncrement} disabled={item.quantity >= 10}>
        +
      </button>
    </div>
  );
}
```

---

### 6. Eliminar item del carrito

```tsx
"use client";

import { useCartItem } from "@/lib/hooks/useCartHooks";
import { Trash2 } from "lucide-react";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const { removeItem, isLoading } = useCartItem(itemId);

  if (isLoading) return null;

  return (
    <button
      onClick={removeItem}
      className="text-red-500 hover:text-red-700"
    >
      <Trash2 size={20} />
    </button>
  );
}
```

---

### 7. Vaciar todo el carrito

```tsx
"use client";

import { useCart } from "@/lib/store/useCart";

export function ClearCartButton() {
  const { clearCart, isEmpty } = useCart();

  if (isEmpty()) return null;

  return (
    <button
      onClick={() => {
        if (confirm("¿Estás seguro?")) {
          clearCart();
        }
      }}
      className="text-red-500"
    >
      Vaciar carrito
    </button>
  );
}
```

---

### 8. Actualizar mensaje personalizado

```tsx
"use client";

import { useCartItem } from "@/lib/hooks/useCartHooks";
import { useState } from "react";

export function MessageEditor({ itemId }: { itemId: string }) {
  const { item, updateCustomMessage, isLoading } = useCartItem(itemId);
  const [message, setMessage] = useState(item?.customMessage || "");

  if (isLoading) return null;
  if (!item) return null;

  const handleSave = () => {
    if (message.length <= 40) {
      updateCustomMessage(message);
    }
  };

  return (
    <div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={40}
        placeholder="Agregar mensaje personalizado..."
        className="w-full p-2 border rounded"
      />
      <div className="text-xs text-gray-600 mt-1">
        {message.length}/40 caracteres
      </div>
      <button onClick={handleSave} className="mt-2 px-4 py-1 bg-blue-500 text-white rounded">
        Guardar
      </button>
    </div>
  );
}
```

---

## Propiedades del Store

### Estado

```typescript
const store = useCart();

// Leer estado
store.items              // CartItem[]
store.getTotalItems()    // number (suma de cantidades)
store.getTotalPrice()    // number (en centavos)
store.getItemCount()     // number (items únicos)
store.isEmpty()          // boolean
```

### Métodos de Modificación

```typescript
// Agregar
store.addItem({
  productId: "prod-1",
  productName: "Torta Selva Negra",
  variantId: "var-1",
  variantName: "Grande",
  priceInCents: 250000,
  quantity: 2,
  customMessage: "¡Feliz Cumpleaños!",
});

// Remover
store.removeItem("item-id-123");

// Cambiar cantidad
store.updateQuantity("item-id-123", 5);

// Actualizar mensaje
store.updateCustomMessage("item-id-123", "Nuevo mensaje");

// Vaciar todo
store.clearCart();
```

---

## Formatos de Precio

### En centavos (como se guarda)

```typescript
const priceInCents = 150050;  // = $1.500,50
```

### Convertir a pesos

```typescript
const pesos = priceInCents / 100;  // 1500.50
```

### Formatear para mostrar

```typescript
import { formatCartPrice } from "@/lib/hooks/useCartHooks";

formatCartPrice(150050)   // → "$1.500,50"
formatCartPrice(300100)   // → "$3.001,00"
formatCartPrice(9999)     // → "$99,99"
```

---

## Validaciones Automáticas

```typescript
// ✅ Válido
addItem({ quantity: 1 });   // OK
addItem({ quantity: 10 });  // OK
addItem({ customMessage: "¡Hola!" }); // 5 chars, OK

// ❌ Inválido - No se agrega
addItem({ quantity: 0 });   // Error: debe ser >= 1
addItem({ quantity: 11 });  // Error: máximo 10
addItem({ quantity: -5 });  // Error: debe ser positivo
addItem({ customMessage: "Lorem ipsum dolor sit amet consectetur adipiscing elit" }); // Error: > 40 chars
```

---

## Persistence & localStorage

### Cómo funciona

1. Usuario agrega item → store se actualiza
2. Zustand detecta cambio → guarda en localStorage
3. Página se recarga → Zustand recupera datos
4. CartSidebar se actualiza con datos guardados

### Visualizar datos en localStorage

```javascript
// En la consola del navegador (F12):
localStorage.getItem("cart-storage")

// Resultado:
// {
//   "state": {
//     "items": [
//       {
//         "id": "prod-1-var-1-1712345678901-0.123",
//         "productId": "prod-1",
//         "productName": "Torta Selva Negra",
//         ...
//       }
//     ]
//   },
//   "version": 1
// }
```

### Limpiar localStorage

```javascript
// En la consola:
localStorage.removeItem("cart-storage");
// Luego recargar la página (F5)
```

---

## Debugging

### Ver estado completo del store

```typescript
// En cualquier cliente component
import { useCart } from "@/lib/store/useCart";

export function DebugStore() {
  const store = useCart();
  
  useEffect(() => {
    console.log("Estado actual del carrito:", {
      items: store.items,
      totalItems: store.getTotalItems(),
      totalPrice: store.getTotalPrice(),
      isEmpty: store.isEmpty(),
    });
  }, [store]);

  return null;
}
```

### Ver cambios en tiempo real

```typescript
import { useCart } from "@/lib/store/useCart";
import { useEffect } from "react";

export function CartDebugger() {
  useEffect(() => {
    // Subscribe a cambios del store
    const unsubscribe = useCart.subscribe(
      (state) => state.items,
      (items) => {
        console.log("Carrito actualizado:", items);
      }
    );

    return unsubscribe;
  }, []);

  return null;
}
```

---

## SSR - Evitar Hydration Mismatch

❌ **MAL** - Causa hydration errors:

```tsx
"use client";

import { useCart } from "@/lib/store/useCart";

export function BadComponent() {
  // En el servidor (SSR), localStorage no existe
  // En el cliente, localStorage existe
  // → Mismatch!
  const { items } = useCart();
  
  return <div>{items.length} items</div>;
}
```

✅ **BIEN** - Usa hidratación segura:

```tsx
"use client";

import { useCartWithHydration } from "@/lib/hooks/useCartHooks";

export function GoodComponent() {
  // isLoading es true en el servidor
  // isLoading es false en el cliente
  // → No hay mismatch
  const { items, isLoading } = useCartWithHydration();
  
  if (isLoading) return <Skeleton />;
  
  return <div>{items.length} items</div>;
}
```

---

## Sincronización Entre Pestañas

Zustand automáticamente sincroniza el carrito entre múltiples pestañas/ventanas:

```
Tab 1: Abre https://pasteleria.local/products/1
Tab 2: Abre https://pasteleria.local/cart
  └─ Carrito vacío

Tab 1: Clickea "Agregar al carrito"
  └─ localStorage["cart-storage"] se actualiza

Tab 2: Automáticamente (sin refresh)
  └─ CartSidebar muestra el item nuevo ✨
```

---

## Error Handling

### Catch de errores

```typescript
"use client";

import { useCart } from "@/lib/store/useCart";
import { useState } from "react";

export function SafeAddToCart() {
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  const handleAdd = () => {
    try {
      addItem({
        productId: "prod-1",
        productName: "Torta Selva Negra",
        variantId: "var-1",
        variantName: "Grande",
        priceInCents: 250000,
        quantity: 11, // ❌ Inválido
      });
      setError(null);
    } catch (err) {
      setError("No se pudo agregar al carrito");
    }
  };

  return (
    <div>
      <button onClick={handleAdd}>Agregar</button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

---

## Performance Tips

### 1. Memoizar componentes

```tsx
import { memo } from "react";

const CartItemRow = memo(function CartItemRow({ item }: { item: CartItem }) {
  return <div>...</div>;
});
```

### 2. Usar useCallback para event handlers

```tsx
import { useCallback } from "react";

export function QuantityControl() {
  const { updateQuantity } = useCartItem(itemId);
  
  const handleIncrease = useCallback(() => {
    updateQuantity(quantity + 1);
  }, [quantity, updateQuantity]);

  return <button onClick={handleIncrease}>+</button>;
}
```

### 3. Limitar re-renders con selectores

```tsx
"use client";

import { useCart } from "@/lib/store/useCart";

export function CartCount() {
  // Solo se re-renderiza si getItemCount() cambia
  const count = useCart((state) => state.getItemCount());
  
  return <span>{count} items</span>;
}
```

---

## Próximas Funcionalidades

- 🔄 Editar items desde el sidebar
- 🔄 Resumen antes de checkout
- 🔄 Aplicar cupones descuento
- 🔄 Guardar carrito en backend
- 🔄 Recuperar carrito anterior
- 🔄 Recomendaciones personalizadas

---

*¡Listo para usar! 🚀*
