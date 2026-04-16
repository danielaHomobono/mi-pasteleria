# 🎂 CakeCustomizer - Documentación Completa

## Resumen Ejecutivo

`CakeCustomizer` es un componente React **Client Component** de lujo que permite a los usuarios personalizar y comprar tortas artesanales. Implementa:

- ✅ **Estética Lujo Silencioso**: Minimalista, tipografía Serif, tonos arena/crema
- ✅ **Galería Macro**: Imagen principal + miniaturas (preparado para múltiples imágenes)
- ✅ **Selector de Variantes**: Botones elegantes para Grande/Mediana/Pequeña/Porción
- ✅ **Guía Dinámica de Porciones**: Muestra `servings_suggested` según variante
- ✅ **Precio en Tiempo Real**: Actualiza al cambiar variante o cantidad
- ✅ **Personalización**: Input para mensaje en la torta (máx 40 caracteres)
- ✅ **Integración Zustand**: Agrega productos al carrito
- ✅ **Animaciones Framer Motion**: Transiciones suaves y elegantes

---

## 📁 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `components/features/cake-customizer.tsx` | Componente principal (Client) |
| `lib/store/useCart.ts` | Store Zustand para gestión del carrito |
| `lib/utils/price.ts` | Utilidades de precios en ARS |
| `app/products/[id]/page.tsx` | Página de detalles del producto (Server) |
| `components/features/product-card.tsx` | Tarjeta que linkea a CakeCustomizer |

---

## 🎨 Diseño: Lujo Silencioso

### Características Visuales

```
┌─────────────────────────────────────────┐
│  Tipografía: Serif (clase 'font-serif')│
│  Colores: Arena, crema, neutros        │
│  Layout: 2 columnas (grid lg:grid-cols-2)
│  Padding: Espacioso y limpio           │
│  Bordes: Suave (rounded-lg)            │
│  Sombras: Mínimas, sutiles             │
└─────────────────────────────────────────┘
```

### Paleta de Colores
- **Primario**: Mantenido del tema global
- **Fondo**: background (blanco/negro según tema)
- **Acentos**: amber para guía de porciones
- **Bordes**: border/50 (muy sutiles)

### Tipografía
```
Título: font-serif text-3xl md:text-4xl font-light
Etiquetas: font-serif uppercase tracking-wider
Precios: font-serif (sin variación excesiva)
Botones: font-serif text-base
```

---

## 🧩 Estructura de Componentes

### Componente Principal: `CakeCustomizer`

```tsx
<CakeCustomizer product={product} />
```

**Props:**
```typescript
interface CakeCustomizerProps {
  product: ProductWithVariants;
}
```

**Estado Interno:**
```typescript
- selectedVariantId: string
- quantity: number (1-10)
- customMessage: string (0-40 caracteres)
- isAddingToCart: boolean
```

---

### Sub-componentes

#### 1. **GallerySection**
Galería de imágenes del producto.

**Características:**
- Imagen principal (aspect-square)
- Miniaturas para seleccionar (preparado para múltiples imágenes)
- Fallback si no hay imagen
- Animaciones de transición con Framer Motion

```tsx
<GallerySection product={product} />
```

---

#### 2. **VariantSelector**
Selector de variantes con botones elegantes.

**Características:**
- Grid responsivo (2 columnas en móvil, 4 en desktop)
- Botones ordenados: Porción → Pequeña → Mediana → Grande
- Precio de cada variante mostrado
- Estados: selected (bg-primary) vs normal
- Animaciones hover/tap con Framer Motion

```tsx
<VariantSelector
  variants={sortedVariants}
  selectedVariantId={selectedVariantId}
  onVariantChange={setSelectedVariantId}
/>
```

---

#### 3. **PricingSection**
Muestra precio unitario y total.

**Características:**
- Formateado en ARS (pesos argentinos)
- Precio unitario siempre visible
- Subtotal aparece solo si cantidad > 1
- Animaciones de cambio con `layout` prop

```tsx
<PricingSection
  variant={selectedVariant}
  quantity={quantity}
/>
```

---

#### 4. **QuantitySelector**
Selector de cantidad (1-10).

**Características:**
- Botones +/- elegantes
- Display del número centrado
- Disabled cuando alcanza límites
- Animaciones smooth

```tsx
<QuantitySelector
  quantity={quantity}
  onQuantityChange={handleQuantityChange}
/>
```

---

#### 5. **MessageCustomizer**
Input para mensaje personalizado.

**Características:**
- Máximo 40 caracteres
- Contador de caracteres restantes
- Alerta visual cuando < 5 caracteres
- Tipografía Serif

```tsx
<MessageCustomizer
  message={customMessage}
  onMessageChange={handleMessageChange}
/>
```

---

#### 6. **InfoRow**
Fila de información auxiliar.

**Características:**
- Label en muted-foreground
- Value en foreground con font-medium
- Responsive font sizes

```tsx
<InfoRow label="Lead time" value="Mínimo 48 horas" />
```

---

## 🔄 Flujo de Datos

```
CakeCustomizer (Client Component, "use client")
├── useState: selectedVariantId, quantity, customMessage, isAddingToCart
├── useCart: { addItem } de Zustand
│
├── GallerySection
│   └── Image del producto
│
├── VariantSelector
│   └── onClick → setSelectedVariantId
│
├── PricingSection (AnimatePresence)
│   └── Muestra precio dinámico
│
├── QuantitySelector
│   └── onClick → handleQuantityChange
│
├── MessageCustomizer
│   └── onChange → handleMessageChange
│
└── Button "Agregar al carrito"
    └── onClick → handleAddToCart
        └── addItem(CartItem) → Zustand
```

---

## 💾 Integración con Zustand (useCart)

### Agregar al Carrito

```typescript
const handleAddToCart = async () => {
  addItem({
    productId: product.id,
    productName: product.name,
    variantId: selectedVariant.id,
    variantName: selectedVariant.variant_name,
    priceInCents: selectedVariant.price_in_cents,
    quantity,
    customMessage: customMessage || undefined,
  });
};
```

### CartItem Estructura
```typescript
interface CartItem {
  id: string;                  // Auto-generado
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  priceInCents: number;
  quantity: number;
  customMessage?: string;
}
```

---

## 💰 Formato de Precios

### Conversión Automática

```typescript
// Base de datos
price_in_cents = 150050  // $1.500,50 ARS

// Componente
formatPrice(price_in_cents)  // → "$1.500,50"
```

### Cálculo de Total
```typescript
totalPrice = priceInCents * quantity
// Ej: 150050 * 2 = 300100 cents ($3.001,00)
```

---

## 🎬 Animaciones con Framer Motion

### Transiciones Implementadas

| Elemento | Animación | Trigger |
|----------|-----------|---------|
| Sección completa | fade + slide-in | mount |
| Galería | fade + slide-left | mount |
| Detalles | fade + slide-right | mount |
| Guía porciones | fade + slide | cambio variante |
| Precio | fade + layout shift | cambio variante/cantidad |
| Botones | scale (1.05/0.95) | hover/tap |
| Variantes | scale hover | hover |

### Ejemplo: Transición de Guía de Porciones

```tsx
<AnimatePresence mode="wait">
  {selectedVariant && selectedVariant.servings_suggested && (
    <motion.div
      key={selectedVariant.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Contenido */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 📱 Responsive Design

### Breakpoints

```
📱 Mobile (< 640px)
  - 1 columna
  - Botones variantes: 2 cols
  - Texto reducido
  - Padding menos

📱 Tablet (640px - 1024px)
  - 2 columnas
  - Botones variantes: 4 cols
  - Texto medio

🖥️  Desktop (> 1024px)
  - 2 columnas
  - Espacios amplios
  - Texto grande
```

### Clases Responsive
```
text-3xl md:text-4xl
text-xs md:text-sm md:text-base
grid grid-cols-2 md:grid-cols-4
w-full lg:grid-cols-2
```

---

## 🔒 Validaciones

### En el Componente

1. **Variante Seleccionada**: Requerida para agregar al carrito
2. **Cantidad**: Debe estar entre 1 y 10
3. **Mensaje**: Máximo 40 caracteres
4. **Stock**: Validable desde la variante (extensible)

### En el Store (Zustand)
1. **Deduplicación**: Si mismo producto/variante/mensaje, incrementa cantidad
2. **ID Único**: `${productId}-${variantId}-${timestamp}`

---

## 🔌 Página de Detalles (`/products/[id]`)

### Estructura RSC

```tsx
ProductDetailsPage (Server Component)
├── Fetch producto
├── Render navegación
├── Suspense boundary
└── CakeCustomizer (Client)
    └── Dentro de Suspense fallback
```

### Fallback de Carga
```tsx
ProductDetailsLoadingFallback
├── Skeleton de galería
├── Skeleton de detalles
└── Skeleton de variantes
```

---

## 🚀 Cómo Usar

### En una Página

```tsx
import { CakeCustomizer } from "@/components/features/cake-customizer";

export async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  
  return (
    <Suspense fallback={<Loading />}>
      <CakeCustomizer product={product} />
    </Suspense>
  );
}
```

### Props Requeridas

```typescript
// ProductWithVariants (completo desde getProductsWithVariants)
product: {
  id: string;
  name: string;
  description?: string;
  category?: string;
  image_url?: string;
  product_variants: [
    {
      id: string;
      variant_name: string;
      price_in_cents: number;
      stock_quantity?: number;
      servings_suggested?: string;
    }
  ];
  minPrice: number;
}
```

---

## 🎯 Reglas de Negocio Implementadas

### ✅ Lead Time (48 horas)
- **Ubicación**: InfoRow estática "Lead time: Mínimo 48 horas"
- **Implementación en checkout**: Pendiente (validar en Server Action)

### ✅ Jerarquía Product-Variant-SKU
```
Product (CakeCustomizer recibe)
└─ ProductVariants (selector en UI)
   └─ price_in_cents (mostrado dinámicamente)
```

### ✅ Precios en ARS
```
Centavos → formatPrice() → "$1.500,50 ARS"
```

### ✅ Moneda Única
```
- Argentina/Cordoba UTC-3
- Siempre pesos argentinos
- Intl API locale es-AR
```

---

## 📊 Estados y Transiciones

```
Estado Inicial
├─ Primera variante seleccionada
├─ Cantidad = 1
├─ Mensaje vacío
└─ Botón habilitado

Usuario Cambia Variante
├─ Precio actualiza (AnimatePresence)
├─ Guía porciones actualiza
└─ Cantidad se resetea a 1 (opcional)

Usuario Incrementa Cantidad
└─ Precio total actualiza

Usuario Escribe Mensaje
├─ Validación: máx 40 chars
└─ Contador actualiza color (red si < 5)

Usuario Clickea "Agregar"
├─ isAddingToCart = true
├─ addItem() a Zustand
├─ Reset form
└─ isAddingToCart = false
```

---

## 🔮 Próximas Mejoras

1. **Toast de Confirmación**: Mostrar notificación al agregar
2. **Stock Real-time**: Desabilitar si stock_quantity = 0
3. **Múltiples Imágenes**: Usar array de image_url
4. **Reseñas**: Mostrar reviews del producto
5. **Relacionados**: Sugerir productos similares
6. **Cupones**: Aplicar descuentos
7. **Wishlist**: Guardar en favoritos
8. **Share Social**: Compartir producto

---

## 📝 Notas Técnicas

- **"use client"**: Necesario por useState y useCart
- **Framer Motion**: v13.0+ compatible
- **Zustand**: Store global, no requiere Context
- **Image**: next/image con sizes responsive
- **Animaciones**: AnimatePresence para montar/desmontar
- **Tipado**: Completo con TypeScript strict mode
- **A11y**: Semántica HTML correcta, roles implícitos

---

## 🎓 Ejemplos de Props

### Producto Simple (1 variante)

```typescript
{
  id: "torta-1",
  name: "Torta Selva Negra",
  description: "Chocolate, crema, cereza",
  category: "Clásicas",
  image_url: "https://...",
  product_variants: [
    {
      id: "var-1",
      variant_name: "Grande",
      price_in_cents: 250000,
      servings_suggested: "12-15 porciones",
      stock_quantity: 5
    }
  ],
  minPrice: 250000
}
```

### Producto Completo (4 variantes)

```typescript
{
  id: "torta-2",
  name: "Frugal de Fresa",
  description: "Fresas frescas y yogurt",
  category: "Frutas",
  image_url: "https://...",
  product_variants: [
    {
      id: "v1", variant_name: "Porción",
      price_in_cents: 45000,
      servings_suggested: "1 porción",
      stock_quantity: 20
    },
    {
      id: "v2", variant_name: "Pequeña",
      price_in_cents: 120000,
      servings_suggested: "4-6 porciones",
      stock_quantity: 8
    },
    {
      id: "v3", variant_name: "Mediana",
      price_in_cents: 180000,
      servings_suggested: "8-10 porciones",
      stock_quantity: 5
    },
    {
      id: "v4", variant_name: "Grande",
      price_in_cents: 280000,
      servings_suggested: "12-15 porciones",
      stock_quantity: 3
    }
  ],
  minPrice: 45000
}
```

---

## ✨ Conclusión

`CakeCustomizer` es un componente **production-ready** que ofrece una experiencia de compra premium con:

- 🎨 Diseño elegante y minimalista
- 🔄 Interactividad fluida
- 💾 Integración con carrito
- 📱 Totalmente responsive
- ♿ Accesible
- 🚀 Performance optimizado

Listo para ser usado en la boutique pastelería artesanal.
