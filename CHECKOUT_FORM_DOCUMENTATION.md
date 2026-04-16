# 🛍️ CheckoutForm Component - Documentación

**Ubicación:** `components/features/CheckoutForm.tsx`  
**Página de uso:** `app/checkout/page.tsx`  
**Estatus:** ✅ Production-ready  
**Líneas de código:** 450+

---

## 📋 Resumen

CheckoutForm es un componente React elegante que implementa un flujo de **Guest Checkout** (sin registro obligatorio) con:

- ✅ **Validación en tiempo real** de campos
- ✅ **Máscara de teléfono Argentina** (+54 9)
- ✅ **Calendario interactivo** con deshabilitación inteligente de fechas
- ✅ **Validación de 48 horas mínimo** de lead time
- ✅ **Integración con Server Action** checkoutOrder
- ✅ **Redirección segura a Mercado Pago**
- ✅ **Diseño Lujo Silencioso** con Tailwind CSS

---

## 🎨 Características de UX

### Fricción Cero (Guest Checkout)

**No requiere:**
- Registro de usuario
- Login previo
- Verificación de email al momento

**Solo requiere:**
- Nombre completo
- Email
- Teléfono
- Fecha y hora de retiro

### Validación en Tiempo Real

```typescript
// Mientras escribes:
// ✅ El input se limpia de errores
// ❌ Se muestran errores bajo el campo cuando haces blur
// 🎯 Máscara de teléfono se aplica automáticamente
```

### Máscara de Teléfono Argentina

```
Input: "5493816123456"
Output: "+54 9 3816 123456"

Input: "93816123456"  
Output: "+54 9 3816 123456"

Soporta:
- +54 9 formato internacional
- 02962 formato local Río Tercero
- 9XXXXXXXXX formato solo números
```

### Calendario Inteligente

```
Deshabilitadas:
- Próximas 48 horas (regla de negocio)
- Fechas sin cupo disponible (pickup_slots.current_orders >= max_capacity)

Habilitadas:
- Fechas desde dentro de 48 horas
- Fechas con cupo disponible
- Hasta 30 días en el futuro
```

---

## 🏗️ Estructura del Componente

```typescript
export function CheckoutForm({ cartItems, onSuccess }: CheckoutFormProps)
```

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `cartItems` | `CartItem[]` | ✅ | Items del carrito a procesar |
| `onSuccess` | `(orderId: string) => void` | ❌ | Callback después de éxito |

### State Management

```typescript
// Form Data
formData: {
  fullName: string
  email: string
  phone: string
}

// Pickup Selection
selectedDate: Date | null
selectedTime: string (HH:mm)

// Validation
errors: Record<string, string>
touched: Record<string, boolean>

// UI State
isLoading: boolean
showCalendar: boolean
success: string | null

// Data
pickupSlots: PickupSlot[]
```

---

## 📱 Flujo de Interacción

```
1. Usuario entra a /checkout
   ↓
2. Ve CheckoutForm con 3 secciones:
   - Información Personal
   - Horario de Retiro
   - Resumen del Pedido
   ↓
3. Llena nombre, email, teléfono
   - Validación en tiempo real
   - Máscara de teléfono automática
   ↓
4. Selecciona fecha en calendario
   - Ve fechas deshabilitadas (sin cupo)
   - Ve fechas de hace < 48h deshabilitadas
   - Calendario se cierra al seleccionar
   ↓
5. Selecciona hora (grid de 9 horarios)
   - 10:00, 11:00, ..., 19:00
   ↓
6. Ve resumen: articulos + total + horario
   ↓
7. Click "Continuar al Pago"
   - Validación completa del form
   - Call checkoutOrder Server Action
   - Muestra "Redirigiendo a Mercado Pago..."
   ↓
8. Redirect a Mercado Pago initPoint
   - Cliente paga con Mercado Pago
   - Webhook confirma orden automáticamente
```

---

## 🎯 Validaciones Implementadas

### Campo: Nombre Completo

```typescript
✓ Requerido
✓ Mínimo 3 caracteres
✓ Se trimea (sin espacios al inicio/final)
✗ No permite campos vacíos
```

### Campo: Email

```typescript
✓ Requerido
✓ Formato válido (regex RFC5322 simplificado)
✓ Validación en tiempo real
✗ No permite emails inválidos
```

### Campo: Teléfono

```typescript
✓ Requerido
✓ Acepta múltiples formatos Argentina:
  - +54 9 3816 123456 (internacional)
  - 02962 123456 (local Río Tercero)
  - 9 3816 123456 (sin código de país)
✓ Máscara automática: +54 9 XXXX XXXXXX
✗ No permite formatos inválidos
```

### Campo: Fecha de Retiro

```typescript
✓ Requerido
✓ No permite < 48 horas (validateLeadTime)
✓ No permite fechas sin cupo (pickup_slots)
✓ Solo próximos 30 días
✗ No permite fechas inválidas
```

### Campo: Hora de Retiro

```typescript
✓ Requerido
✓ Solo horarios predefinidos: 10:00-19:00
✗ No permite horarios arbitrarios
```

---

## 🎨 Estilos - Lujo Silencioso

### Colores

```
Texto principal: neutral-900 (casi negro)
Texto secundario: neutral-600 (gris medio)
Bordes: neutral-200 (gris claro)
Fondo principal: white
Fondo secundario: neutral-50, neutral-100
Acento: neutral-900 (botón, selecciones)
Error: red-600, red-300
Éxito: green-600, green-50
```

### Tipografía

```
Títulos: font-light (300) - elegante, minimalista
Subtítulos: tracking-wide (espaciado)
Etiquetas: font-semibold (600) - claridad
Cuerpo: font-normal (400) - legibilidad
```

### Espaciado y Márgenes

```
Sección a sección: gap-8 (32px)
Campo a campo: gap-6 (24px)
Dentro del campo: gap-2 (8px)
Padding interno: p-4, p-6, p-8
```

### Componentes

```
Card: border-neutral-200, shadow-sm
Input: border-neutral-200, rounded-lg
Button: bg-neutral-900, hover:bg-neutral-800
Alert: variants (default, destructive)
Calendar: grid-cols-7, background neutral-50
```

---

## 🔗 Integración con Backend

### Server Action: checkoutOrder

```typescript
await checkoutOrder(
  {
    shippingName: string
    shippingEmail: string
    shippingPhone: string
    pickupDate: string (yyyy-MM-dd)
    pickupTime: string (HH:mm)
    paymentMethod: 'mercadopago'
  },
  cartItems: CartItem[]
)
```

**Response:**
```typescript
{
  success: boolean
  orderId?: string
  initPoint?: string  // URL para Mercado Pago
  error?: string
}
```

### API: /api/pickup-slots

```typescript
// GET
Response:
[
  {
    id: string (UUID)
    date: string (yyyy-MM-dd)
    current_orders: number
    max_capacity: number
  },
  ...
]
```

---

## 📊 Estados del Componente

### Inicial
```
- Form vacío
- Calendario cerrado
- Sin errores
- Sin selecciones
```

### Cargando datos
```
- Fetch de /api/pickup-slots
- pickupSlots se popula
- Calendario se habilita
```

### Validación
```
- Usuario hace blur en campo
- Se añade a `touched`
- Se valida y se muestran errores
- Errores desaparecen al cambiar valor
```

### Enviando
```
- User hace click Submit
- validateForm() completo
- isLoading = true
- Call checkoutOrder()
- Mostrar "Procesando..."
```

### Éxito
```
- showSuccess = "Redirigiendo a Mercado Pago..."
- Store orderId en sessionStorage
- setTimeout de 800ms para UX
- window.location.href = initPoint
```

### Error
```
- Mostrar Alert con error
- isLoading = false
- User puede reintentar
- Error se guarda en errors.submit
```

---

## 🧪 Testing

### Test Manual

1. **Validación de nombre**
   ```
   Escribir: "ab" → Error "mínimo 3 caracteres"
   Escribir: "Ana García" → ✅
   ```

2. **Validación de email**
   ```
   Escribir: "invalido" → Error
   Escribir: "ana@example.com" → ✅
   ```

3. **Máscara de teléfono**
   ```
   Escribir: "5493816123456" → "+54 9 3816 123456"
   Escribir: "93816123456" → "+54 9 3816 123456"
   ```

4. **Calendario deshabilitado**
   ```
   Hoy: 16/04/2026
   Deshabilitadas:
   - 16/04 (hoy)
   - 17/04 (< 48h)
   Habilitada:
   - 18/04 (= 48h)
   ```

5. **Flujo Completo**
   ```
   Llenar form
   Seleccionar fecha
   Seleccionar hora
   Click Continuar
   Ver "Redirigiendo..."
   Redirect a Mercado Pago
   ```

---

## 🔒 Seguridad

### Client-Side

- Validación de formato (no trusted)
- Máscara de teléfono (UX, no seguridad)
- Validación visual de errores

### Server-Side (en checkoutOrder)

- **Validación estricta** de todos los campos
- **Validación de Lead Time** (48 horas)
- **Validación de pickup_slots** (capacidad)
- **RLS de Supabase** (row-level security)
- **Encriptación de datos** en tránsito (HTTPS)

**Importante:** Never trust client-side validation alone. El servidor SIEMPRE revalida.

---

## 🚀 Optimizaciones

### Performance

- ✅ **Lazy loading:** Calendar solo se carga cuando necesario
- ✅ **Debouncing:** Validación solo en blur, no en cada keystroke
- ✅ **Memoization:** `useCallback` para handlers
- ✅ **Conditional rendering:** Hora solo visible si fecha seleccionada

### UX

- ✅ **Scroll smooth:** Al seleccionar fecha, scroll a hora
- ✅ **Toast feedback:** Errores inmediatos, éxito claro
- ✅ **Disabled state:** Botón deshabilitado mientras carga
- ✅ **Loading state:** Spinner en botón durante envío

---

## 📦 Dependencias

```json
{
  "date-fns": "^2.x",          // Manejo de fechas
  "react": "^18.x",            // Framework
  "lucide-react": "latest",    // Iconos
  "clsx": "^1.x" (en utils)    // Clases CSS
}
```

### Componentes UI Shadcn/UI

```
- @/components/ui/button
- @/components/ui/input
- @/components/ui/label
- @/components/ui/card
- @/components/ui/alert        // Nuevo, creado en esta sesión
```

---

## 📝 Notas de Implementación

### Por qué no usar un componente Calendar de Shadcn/UI

Shadcn/UI tiene componente Calendar pero es más complejo para este use case. Implementé inline porque:

1. Necesitamos validación personalizada (lead time, capacity)
2. Necesitamos habilitar/deshabilitar dinámicamente
3. Necesitamos cerrar automáticamente al seleccionar
4. Mejor control de UX

### Por qué máscara manual de teléfono

Existen librerías como `react-phone-number-input` pero:

1. Añaden 50KB+ de bundle size
2. Son over-engineered para Argentina
3. Es trivial implementar el formato +54 9

### Por qué Server Action no API Route

Server Actions para checkout porque:

1. ✅ Menos código (no necesita fetch)
2. ✅ Más seguro (secrets no expuestos)
3. ✅ Tipo-safe (TypeScript full-stack)
4. ✅ Mejor DX (form integration)

---

## 🎯 Próximos Pasos

1. **Confirmation Page**
   - `/order/[id]/confirmation` mostrando detalles
   - Enlace a rastrear estado

2. **Email Notifications**
   - Confirmación de orden
   - Recordatorio 24h antes de retiro

3. **SMS Notifications** (Twilio)
   - SMS de confirmación
   - SMS 1h antes de retiro

4. **Admin Notifications**
   - Email a pastelería cuando hay orden
   - Dashboard de órdenes

---

## 📞 Troubleshooting

### Problema: "Cannot find module '@/components/ui/alert'"

**Solución:** El archivo `components/ui/alert.tsx` no se detecta inmediatamente después de crearlo. Ejecutar `npm run build` para forzar recompilación.

### Problema: Fechas deshabilitadas no funcionan

**Solución:** Asegurar que `/api/pickup-slots` devuelve datos correctos. Verificar en Console:
```javascript
fetch('/api/pickup-slots').then(r => r.json()).then(console.log)
```

### Problema: Teléfono no se formatea

**Solución:** Revisar que `handleInputChange` se está llamando. Verificar:
```javascript
console.log('handleInputChange called with:', value)
```

---

**Documentación completa para el formulario de checkout de Mi Pastelería**  
**Versión:** 1.0.0  
**Actualizado:** 16 de Abril de 2026
