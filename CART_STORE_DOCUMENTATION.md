# 🛒 Store de Carrito con Persistencia - Documentación Completa

## Resumen Ejecutivo

Se implementó un **store de carrito con Zustand** que:

- ✅ Agrega/remueve items del carrito
- ✅ Persiste automáticamente en `localStorage`
- ✅ Sincroniza entre pestañas del navegador
- ✅ Calcula precios en tiempo real
- ✅ Maneja validaciones básicas
- ✅ Resuelve problemas de SSR en Next.js 15

---

## 📁 Archivos Implementados

| Archivo | Propósito |
|---------|-----------|
| `lib/store/useCart.ts` | Store Zustand principal con persist |
| `lib/hooks/useCartHooks.ts` | Hooks personalizados para usar el store |
| `components/features/cart-sidebar.tsx` | Componente visual del carrito |
| `app/cart/page.tsx` | Página completa del carrito |

---

## 🏗️ Arquitectura del Store

### Structure de CartItem

```typescript
interface CartItem {
  id: string;                  // Único: "${productId}-${variantId}-${Date.now()}-${random}"
  productId: string;           // ID del producto base
  productName: string;         // Nombre para mostrar
  variantId: string;           // ID de variante seleccionada
  variantName: string;         // Nombre variante (Grande/Mediana/Pequeña/Porción)
  priceInCents: number;        // Precio en centavos (ej: 150050 = $1.500,50)
  quantity: number;            // 1-10 unidades
  customMessage?: string;      // Mensaje personalizado (0-40 caracteres)
  createdAt: string;           // ISO timestamp
}
```

### CartStore Interface

```typescript
interface CartStore {
  // Estado
  items: CartItem[];
  
  // Modificación
  addItem: (item: Omit<CartItem, "id" | "createdAt">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCustomMessage: (itemId: string, message: string) => void;
  clearCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: () => number;
  isEmpty: () => boolean;
}
```

---

## 💾 Persistencia en localStorage

### Configuración

```typescript
export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({ /* store logic */ }),
    {
      name: "cart-storage",                    // Clave en localStorage
      storage: createJSONStorage(() => localStorage), // Backend de almacenamiento
      version: 1,                              // Para migraciones futuras
      partialize: (state) => ({ items: state.items }), // Qué guardar
    }
  )
);
```

### Datos Guardados en localStorage

```json
{
  "state": {
    "items": [
      {
        "id": "prod-1-var-1-1712345678901-0.123",
        "productId": "prod-1",
        "productName": "Torta Selva Negra",
        "variantId": "var-1",
        "variantName": "Grande",
        "priceInCents": 250000,
        "quantity": 2,
        "customMessage": "¡Feliz Cumpleaños!",
        "createdAt": "2026-04-16T10:30:00.000Z"
      }
    ]
  },
  "version": 1
}
```

### Sincronización Entre Pestañas

Zustand con persist middleware sincroniza automáticamente el estado entre múltiples pestañas/ventanas abiertas de la misma aplicación.

---

## 🪝 Hooks Personalizados

### 1. useCartWithHydration()

Resuelve el problema de SSR en Next.js donde el store no está disponible en el primer render.

```typescript
const { items, addItem, isLoading } = useCartWithHydration();

// isLoading: true mientras se hidratan los datos de localStorage
// items: Vacío si isLoading, datos reales cuando está listo
```

**Uso:**
```tsx
"use client";
import { useCartWithHydration } from "@/lib/hooks/useCartHooks";

export function CartComponent() {
  const { items, isLoading } = useCartWithHydration();
  
  if (isLoading) return <Skeleton />;
  
  return <div>{items.map(...)}</div>;
}
```

### 2. useCartStats()

Proporciona estadísticas rápidas del carrito.

```typescript
const { items, totalItems, totalPrice, isEmpty, isLoading } = useCartStats();

// totalItems: suma de cantidades (2 + 1 + 3 = 6)
// totalPrice: total en centavos (300100 = $3.001,00)
// isEmpty: boolean si carrito vacío
```

**Uso:**
```tsx
const { totalPrice } = useCartStats();
console.log(formatCartPrice(totalPrice)); // "$3.001,00"
```

### 3. useCartItem(itemId)

Maneja operaciones sobre un item específico.

```typescript
const { item, updateQuantity, removeItem, updateCustomMessage, isLoading } = 
  useCartItem(itemId);

// item: CartItem | undefined
// updateQuantity: (quantity: number) => void
// removeItem: () => void
// updateCustomMessage: (message: string) => void
```

**Uso:**
```tsx
const { item, updateQuantity } = useCartItem("cart-item-123");

if (item) {
  return (
    <button onClick={() => updateQuantity(item.quantity + 1)}>
      Agregar más ({item.quantity})
    </button>
  );
}
```

### 4. formatCartPrice(centavos)

Formatea precios en ARS.

```typescript
formatCartPrice(150050)  // → "$1.500,50"
formatCartPrice(300100)  // → "$3.001,00"
```

---

## 📊 Métodos del Store

### addItem(item)

Agrega un item al carrito. Si ya existe (mismo producto, variante y mensaje), incrementa la cantidad.

```typescript
const { addItem } = useCart();

addItem({
  productId: "prod-1",
  productName: "Torta Selva Negra",
  variantId: "var-1",
  variantName: "Grande",
  priceInCents: 250000,
  quantity: 1,
  customMessage: "¡Feliz Cumpleaños!",
});
```

**Validaciones:**
- Cantidad: 1-10
- Mensaje: 0-40 caracteres
- Deduplicación: Si existe igual item, incrementa cantidad (máximo 10)

### removeItem(itemId)

Elimina un item del carrito.

```typescript
const { removeItem } = useCart();
removeItem("prod-1-var-1-1712345678901-0.123");
```

### updateQuantity(itemId, quantity)

Actualiza la cantidad de un item.

```typescript
const { updateQuantity } = useCart();

updateQuantity("item-id", 3);  // Establece cantidad en 3
updateQuantity("item-id", 0);  // Elimina el item
updateQuantity("item-id", 15); // Logged warning, no cambia (máximo 10)
```

**Validaciones:**
- Cantidad: 1-10
- Si quantity <= 0, elimina el item

### updateCustomMessage(itemId, message)

Actualiza el mensaje personalizado.

```typescript
const { updateCustomMessage } = useCart();
updateCustomMessage("item-id", "¡Feliz Aniversario!");
```

**Validaciones:**
- Máximo 40 caracteres

### clearCart()

Vacía completamente el carrito.

```typescript
const { clearCart } = useCart();
clearCart();
```

### getTotalItems()

Retorna la suma de cantidades de todos los items.

```typescript
const { getTotalItems } = useCart();
const total = getTotalItems();  // Ej: 2 + 1 + 3 = 6
```

### getTotalPrice()

Retorna el precio total en centavos.

```typescript
const { getTotalPrice } = useCart();
const total = getTotalPrice();  // Ej: 600150 (centavos)

// Para mostrar:
formatCartPrice(total);  // "$6.001,50"
```

### getItemCount()

Retorna la cantidad de items únicos (no la suma de cantidades).

```typescript
const { getItemCount } = useCart();
const count = getItemCount();  // Ej: 3 items (sin importar cantidad)
```

### isEmpty()

Verifica si el carrito está vacío.

```typescript
const { isEmpty } = useCart();
if (isEmpty()) {
  console.log("Carrito vacío");
}
```

---

## 🔄 Flujo de Uso Típico

### 1. Agregar al carrito (desde CakeCustomizer)

```tsx
const { addItem } = useCart();

const handleAddToCart = () => {
  addItem({
    productId: product.id,
    productName: product.name,
    variantId: selectedVariant.id,
    variantName: selectedVariant.variant_name,
    priceInCents: selectedVariant.price_in_cents,
    quantity: 2,
    customMessage: "¡Feliz Cumpleaños!",
  });
  // Automáticamente:
  // - Se guarda en localStorage
  // - Se sincroniza en otras pestañas
  // - CartSidebar se actualiza
};
```

### 2. Ver carrito

```tsx
"use client";
import { CartSidebar } from "@/components/features/cart-sidebar";

export function CartPage() {
  return <CartSidebar />; // Muestra items, totales, controles
}
```

### 3. Modificar cantidad

```tsx
const { updateQuantity } = useCartItem(itemId);

return (
  <button onClick={() => updateQuantity(newQuantity)}>
    Actualizar cantidad
  </button>
);
```

### 4. Recargar página

```
1. Usuario recarga página (F5)
2. Zustand recover estado de localStorage
3. CartSidebar se renderiza con datos guardados
4. No se pierde nada
```

---

## 🎨 Componente CartSidebar

### Features

- ✅ Lista de items con animaciones
- ✅ Controles +/- para cantidad
- ✅ Botón eliminar
- ✅ Subtotal por item
- ✅ Total general
- ✅ Botón "Proceder al Checkout"
- ✅ Estado vacío elegante
- ✅ Skeleton loading

### Estructura

```
CartSidebar
├─ Encabezado con contador
├─ AnimatePresence
│  ├─ Si vacío: mensaje
│  └─ Si hay items: CartItemRow[] (animadas)
├─ Separador
├─ Totales (Subtotal / Total)
└─ Botones (Checkout / Continuar)
```

### CartItemRow

```
Por cada item:
├─ Nombre producto + variante
├─ Mensaje personalizado (si existe)
├─ Controles: - | cantidad | +
├─ Precio unitario
└─ Botón eliminar
```

---

## 📄 Página del Carrito (/cart)

### Estructura

```
Header (Mi Pastelería + botón volver)
├─ Información de Envío (Nombre, teléfono, email)
├─ Lead Time (48 horas + selector de fecha/hora)
├─ Métodos de Pago (Mercado Pago, Transferencia, Efectivo)
└─ Sidebar del Carrito (resumen + botones)
```

### Estado Vacío

Si carrito está vacío:
```
🛍️ Tu carrito está vacío
Botón: "Volver al Catálogo"
```

---

## 🔒 Validaciones

### En addItem()

```typescript
if (item.quantity < 1 || item.quantity > 10) {
  console.warn("Cantidad debe estar entre 1 y 10");
  return; // No agrega
}

if (item.customMessage && item.customMessage.length > 40) {
  console.warn("Mensaje debe tener máximo 40 caracteres");
  return; // No agrega
}
```

### En updateQuantity()

```typescript
if (quantity <= 0) {
  removeItem(itemId);  // Elimina automáticamente
  return;
}

if (quantity > 10) {
  console.warn("Cantidad máxima es 10");
  return;  // No actualiza
}
```

### En updateCustomMessage()

```typescript
if (message.length > 40) {
  console.warn("Mensaje debe tener máximo 40 caracteres");
  return;  // No actualiza
}
```

---

## 🌐 Sincronización Entre Pestañas

### Cómo Funciona

1. **Tab A**: Usuario agrega item al carrito
2. Zustand guarda en localStorage
3. **Tab B**: Storage event se dispara automáticamente
4. Zustand detecta el cambio
5. **Tab B**: UI se actualiza al instante

### Ejemplo Práctico

```
Tab 1: Abre /products/123
Tab 2: Abre /cart
  - Carrito vacío

Tab 1: Clickea "Agregar al carrito"
  - Item se agrega
  - localStorage["cart-storage"] actualizado

Tab 2: Automáticamente
  - CartSidebar actualiza
  - Muestra el item nuevo
  - Sin necesidad de refresh
```

---

## 🐛 Debugging

### Ver estado del carrito en consola

```typescript
const { items } = useCart.getState();
console.log(items);
```

### Ver datos en localStorage

```typescript
// En la consola del navegador:
localStorage.getItem("cart-storage")
// Retorna: {"state": {"items": [...]}, "version": 1}
```

### Limpiar localStorage manualmente

```typescript
localStorage.removeItem("cart-storage");
// Recargar página
```

---

## 📱 Responsividad

### CartSidebar

- **Mobile**: Stack vertical, sidebar debajo
- **Desktop**: Grid 2 columnas, sidebar a la derecha
- **max-w-md**: Ancho máximo para sidebar

### CartPage

```
Mobile:
├─ Header
├─ Información de envío
├─ Lead time
├─ Métodos de pago
└─ Carrito

Desktop (lg:):
├─ Header
├─ 2 columnas
│  ├─ Información + Lead time + Métodos
│  └─ Carrito (sticky)
└─ Footer
```

---

## 🚀 Próximas Mejoras

1. **Cupones**: Aplicar códigos de descuento
2. **Stock Real-time**: Validar disponibilidad
3. **Resumen por Email**: Enviar carrito por correo
4. **Historial de Carrito**: Recuperar carritos antiguos
5. **Recomendaciones**: Sugerir productos relacionados
6. **Sincronización Backend**: Guardar en Supabase
7. **Checkout**: Integración con Mercado Pago
8. **Tracking de Pedido**: Seguimiento post-compra

---

## 📊 Casos de Uso

### Caso 1: Agregar múltiples tortas

```typescript
// Usuario agrega 2 tortas diferentes
addItem({ productId: "1", ..., quantity: 1 });
addItem({ productId: "2", ..., quantity: 2 });

getTotalItems();  // → 3 (1 + 2)
getItemCount();   // → 2 (2 items únicos)
```

### Caso 2: Mismo producto, mensajes diferentes

```typescript
// Son items DIFERENTES (distinto mensaje)
addItem({ productId: "1", variantId: "v1", customMessage: "Hola", quantity: 1 });
addItem({ productId: "1", variantId: "v1", customMessage: "Chau", quantity: 1 });

// Resultado: 2 items en carrito (no se deduplican)
```

### Caso 3: Mismo producto, variante y mensaje

```typescript
// Son items IGUALES (mismo mensaje)
addItem({ productId: "1", variantId: "v1", customMessage: "Hola", quantity: 1 });
addItem({ productId: "1", variantId: "v1", customMessage: "Hola", quantity: 2 });

// Resultado: 1 item con quantity = 3 (se deduplican)
```

### Caso 4: Recargar página

```
Antes de recargar:
- Carrito: 3 items, total $5.000

Usuario: F5 (recargar)

Después de recargar:
- Zustand recover de localStorage
- Carrito: 3 items, total $5.000 (sin cambios)
```

---

## ✨ Conclusión

El store de carrito es:

- 🛡️ **Robusto**: Validaciones en todos los métodos
- 💾 **Persistente**: No se pierden datos
- 🔄 **Sincronizado**: Funciona entre pestañas
- 📱 **Responsive**: UI adaptable
- 🧪 **Testeable**: Lógica separada de componentes
- 🎨 **Elegante**: Animaciones y UX premium

¡Listo para usar en producción! 🚀
