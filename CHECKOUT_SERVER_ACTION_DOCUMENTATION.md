# 🛒 Server Action: checkoutOrder

## Resumen

La Server Action `checkoutOrder` es el corazón del flujo de pago en Mi Pastelería. Se encarga de:

1. ✅ Validar datos del formulario
2. ✅ Validar lead time de 48 horas
3. ✅ Validar disponibilidad de cupos
4. ✅ Crear orden en base de datos
5. ✅ Crear items de la orden
6. ✅ Generar link de pago en Mercado Pago
7. ✅ Actualizar pickup slots

---

## Ubicación

```
lib/actions/orders.ts
```

## Importación

```typescript
import { checkoutOrder } from '@/lib/actions/orders';
```

---

## Firma de Función

```typescript
export async function checkoutOrder(
  formData: CheckoutFormData,
  cartItems: CartItem[]
): Promise<CheckoutResponse>
```

---

## Tipos

### CheckoutFormData

```typescript
interface CheckoutFormData {
  shippingName: string;      // Nombre del cliente
  shippingPhone: string;     // Teléfono Argentina
  shippingEmail: string;     // Email válido
  pickupDate: string;        // ISO string YYYY-MM-DD
  pickupTime: string;        // HH:mm (ej: "14:30")
  paymentMethod: 'mercadopago' | 'transfer' | 'cash';
}
```

### CartItem

```typescript
interface CartItem {
  id: string;              // ID único (auto-generado)
  productId: string;
  productName: string;     // "Torta Selva Negra"
  variantId: string;
  variantName: string;     // "Grande", "Mediana", etc
  priceInCents: number;    // 250000 = $2.500,00
  quantity: number;        // 1-10
  customMessage?: string;  // Mensaje personalizado (max 40 chars)
  createdAt: string;       // ISO timestamp
}
```

### CheckoutResponse

```typescript
interface CheckoutResponse {
  success: boolean;
  orderId?: string;        // UUID de la orden creada
  initPoint?: string;      // URL de pago Mercado Pago (si payment_method = 'mercadopago')
  error?: string;          // Mensaje de error si success = false
}
```

---

## Uso

### Básico

```typescript
'use client';

import { checkoutOrder } from '@/lib/actions/orders';
import { useCart } from '@/lib/store/useCart';

export function CheckoutForm() {
  const { items, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (formData: CheckoutFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await checkoutOrder(formData, items);

      if (!response.success) {
        setError(response.error || 'Error desconocido');
        return;
      }

      // ✅ Orden creada exitosamente
      const orderId = response.orderId;

      if (formData.paymentMethod === 'mercadopago' && response.initPoint) {
        // Redirigir a Mercado Pago
        window.location.href = response.initPoint;
      } else {
        // Redirigir a página de confirmación
        window.location.href = `/order/${orderId}/confirmation`;
      }

      // Limpiar carrito
      clearCart();
    } catch (err) {
      setError('Error inesperado en checkout');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleCheckout({
        shippingName: e.currentTarget.name.value,
        shippingPhone: e.currentTarget.phone.value,
        shippingEmail: e.currentTarget.email.value,
        pickupDate: e.currentTarget.date.value,
        pickupTime: e.currentTarget.time.value,
        paymentMethod: e.currentTarget.method.value as any,
      });
    }}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Validaciones

### 1. Datos del Formulario

```
✅ Nombre: requerido, no vacío
✅ Teléfono: requerido
✅ Email: requerido, formato válido
✅ Fecha: requerido, formato YYYY-MM-DD
✅ Hora: requerido, formato HH:mm
✅ Método de pago: uno de mercadopago, transfer, cash
```

Ejemplo de error:
```json
{
  "success": false,
  "error": "Email inválido"
}
```

### 2. Lead Time (48 Horas)

**Regla maestra:** No se permiten pedidos con menos de 48 horas de antelación.

```
Ahora: 16/04/2026 10:00
Fecha mínima permitida: 18/04/2026 10:00
```

Ejemplo de error:
```json
{
  "success": false,
  "error": "Lead time mínimo de 48 horas requerido. Fecha mínima permitida: 2026-04-18T10:00:00.000Z"
}
```

### 3. Carrito

```
✅ No vacío
✅ Items válidos
✅ Total > 0
```

Ejemplo de error:
```json
{
  "success": false,
  "error": "El carrito está vacío"
}
```

### 4. Disponibilidad de Cupos

Se valida contra la tabla `pickup_slots`:

```
✅ Fecha no bloqueada
✅ Cupo disponible (current_orders < max_capacity)
```

Ejemplo de error:
```json
{
  "success": false,
  "error": "No hay cupo disponible para la fecha 18/04/2026"
}
```

---

## Flujo de Ejecución

```
1. validateCheckoutData(formData)
   └─ Si falla: retorna error

2. validateLeadTime(pickupDateTime)
   └─ Si falla: retorna error
   └─ Valida 48 horas desde ahora

3. Calcular totalInCents
   └─ suma de (priceInCents × quantity)
   └─ Si <= 0: retorna error

4. Conectar Supabase
   const supabase = await createClient();

5. Buscar pickup_slot existente
   └─ SELECT * FROM pickup_slots WHERE date = ?
   └─ Si error: retorna error
   └─ Si bloqueado o sin cupo: retorna error

6. Insertar en tabla 'orders'
   └─ INSERT INTO orders (...)
   └─ Si error: retorna error
   └─ Retorna orderId

7. Insertar en tabla 'order_items' (x cantidad de items)
   └─ INSERT INTO order_items (order_id, ...)
   └─ Si error: DELETE order y retorna error

8. Actualizar pickup_slot
   └─ UPDATE pickup_slots SET current_orders = current_orders + 1
   └─ Si error: retorna error

9. Si payment_method = 'mercadopago':
   └─ Crear preferencia en Mercado Pago
   └─ Si error: retorna error
   └─ Retorna initPoint

10. Retorna success: true, orderId, initPoint (opcional)
```

---

## Respuestas Exitosas

### Mercado Pago

```json
{
  "success": true,
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789"
}
```

**Cliente debe:** Redirigir a `initPoint` para pagar

### Transferencia o Efectivo

```json
{
  "success": true,
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Cliente debe:** Ir a `/order/{orderId}/confirmation` para ver detalles

---

## Variables de Entorno Requeridas

```bash
# Supabase (ya configuradas)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_...

# App URL (para webhooks y back_urls)
NEXT_PUBLIC_APP_URL=https://localhost:3000  # o tu dominio en producción
```

---

## Tablas de Base de Datos Utilizadas

### orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_email TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### order_items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  custom_message TEXT
)
```

### pickup_slots

```sql
CREATE TABLE pickup_slots (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  max_capacity INTEGER,
  current_orders INTEGER,
  is_blocked BOOLEAN
)
```

---

## Integración con Mercado Pago

### init_point

El `init_point` es la URL de checkout de Mercado Pago.

**Ejemplo:**
```
https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789
```

### Preferencia creada con:

```json
{
  "items": [
    {
      "id": "prod-1-var-1-...",
      "title": "Torta Selva Negra - Grande",
      "description": "Mensaje: ¡Feliz Cumpleaños!",
      "unit_price": 2500,
      "quantity": 1
    }
  ],
  "payer": {
    "email": "cliente@example.com"
  },
  "external_reference": "550e8400-e29b-41d4-a716-446655440000",
  "back_urls": {
    "success": "https://localhost:3000/order/.../confirmation",
    "failure": "https://localhost:3000/order/.../error",
    "pending": "https://localhost:3000/order/.../pending"
  },
  "auto_return": "approved",
  "notification_url": "https://localhost:3000/api/webhooks/mercadopago"
}
```

---

## Errores Comunes

### "Lead time mínimo de 48 horas requerido"

**Causa:** Usuario intentó seleccionar una fecha/hora dentro de las próximas 48 horas.

**Solución:** Mostrar en frontend qué fechas están disponibles (>= 48 horas desde ahora).

### "No hay cupo disponible para la fecha..."

**Causa:** Ya hay demasiadas órdenes para esa fecha.

**Solución:** Mostrar otras fechas disponibles.

### "Error al generar link de pago"

**Causa:** 
- Token Mercado Pago inválido
- Préstamo de Mercado Pago denegado
- Red error

**Solución:** 
- Verificar `MERCADOPAGO_ACCESS_TOKEN` en .env
- Verificar credenciales en [panel Mercado Pago](https://www.mercadopago.com.ar/)
- Revisar logs de error en consola del servidor

---

## Utilidades Relacionadas

### lib/utils/leadTime.ts

```typescript
validateLeadTime(pickupDate)       // Valida 48 horas
getMinimumPickupDateTime()         // Retorna fecha mínima permitida
formatPickupDateTime(dateString)   // Formatea para mostrar
getDayOfWeek(dateString)           // "Jueves"
getHoursUntilPickup(pickupDate)    // Número de horas restantes
```

### lib/actions/orders.ts

```typescript
getOrderSummary(orderId)           // Obtiene datos de orden con items
```

---

## Testing

### Test Exitoso (Mercado Pago)

```typescript
const response = await checkoutOrder(
  {
    shippingName: 'Juan Pérez',
    shippingPhone: '+54 9 3572 123456',
    shippingEmail: 'juan@example.com',
    pickupDate: '2026-04-18',  // 48+ horas desde ahora
    pickupTime: '14:30',
    paymentMethod: 'mercadopago',
  },
  cartItems
);

console.log(response);
// {
//   success: true,
//   orderId: '550e8400-...',
//   initPoint: 'https://www.mercadopago.com.ar/checkout/v1/redirect?...'
// }
```

### Test Fallido (Lead Time)

```typescript
const response = await checkoutOrder(
  {
    shippingName: 'Juan',
    shippingPhone: '+54...',
    shippingEmail: 'juan@example.com',
    pickupDate: '2026-04-16',  // HOY - INVÁLIDO
    pickupTime: '14:30',
    paymentMethod: 'mercadopago',
  },
  cartItems
);

console.log(response);
// {
//   success: false,
//   error: 'Lead time mínimo de 48 horas...'
// }
```

---

## Próximas Mejoras

- [ ] Webhook handler para procesar pagos Mercado Pago
- [ ] Email confirmation
- [ ] SMS notifications
- [ ] Cupones y descuentos
- [ ] Validación de stock
- [ ] Historial de órdenes para usuarios
- [ ] Admin dashboard para ver órdenes

---

*Documentación actualizada: 16 de Abril de 2026*
