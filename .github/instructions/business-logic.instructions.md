# Reglas de Lógica de Negocio - Boutique Pastelería

## Configuración Copilot

```yaml
applyTo: "app/api/**/*, components/features/**/*, lib/utils/**/*, types/**/*"
```

---

# 1. Gestión de Lead Time (Tiempo de Producción)

## Regla Maestra

No se permiten pedidos con menos de **48 horas de antelación** respecto a la fecha y hora de retiro.

## Propósito

Garantizar:

- Frescura del producto
- Cumplimiento del cronograma de horneado artesanal
- Capacidad de producción realista

---

## Validación Dual

### Frontend

El componente de calendario debe:

- Deshabilitar visualmente las próximas **48 horas**
- Evitar selección de fechas inválidas

Ejemplo:

- Hoy 10:00 AM  
- Primer turno disponible: Pasado mañana 10:00 AM

---

### Backend

Las **Server Actions** deben rechazar cualquier fecha inválida:

```ts
pickupDate < now() + 48h
```

Ejemplo:

```ts
if (pickupDate < minimumAllowedDate) {
  throw new Error("Lead time mínimo de 48 horas requerido");
}
```

---

## Zona Horaria

Todos los cálculos deben basarse en:

```
America/Argentina/Cordoba (UTC-3)
```

Nunca usar:

- Hora del navegador
- Hora del servidor sin normalizar

---

# 2. Arquitectura de Producto: Jerarquía Product-Variant-SKU

Para mantener el catálogo escalable, seguir estrictamente esta estructura:

```
Product
  └── ProductVariant
        └── SKU
```

---

## Product

Entidad base

Ejemplo:

- "Torta Selva Negra"

Contiene:

- Nombre
- Descripción larga
- Ingredientes base
- Categoría

---

## ProductVariant

Combinación de opciones

Ejemplo:

- "Grande - 24 porciones - Relleno Extra"

Contiene:

- Tamaño
- Porciones
- Opciones base

---

## SKU (Stock Keeping Unit)

Entidad transaccional final

Contiene:

- `price_in_cents`
- `stock_quantity`
- `sku_code`

Ejemplo:

- Selva Negra Grande → SKU único

---

# 3. Lógica de Precios y Moneda

## Unidad Monetaria

Usar siempre:

```
Pesos Argentinos (ARS)
```

---

## Almacenamiento de Precios

Guardar precios como **INTEGER en centavos**

Ejemplo:

```
$1500.50 → 150050
```

Ventajas:

- Evita errores de coma flotante
- Mayor precisión
- Mejor performance

---

## Cálculo Dinámico

Precio Total:

```
Precio Total = Precio Base SKU + Σ(Costo Adicional Customizaciones)
```

Ejemplo:

- Base: $12.000
- Relleno extra: $2.000
- Decoración premium: $1.500

Total:

```
$15.500
```

---

# 4. Gestión de Cupos (Pickup Slots)

## Validación de Disponibilidad

Antes de crear una **Order**:

Consultar la tabla:

```
pickup_slots
```

Confirmar:

- Cupo disponible
- Fecha válida
- Capacidad diaria

---

## Fórmula de Capacidad

:contentReference[oaicite:0]{index=0}

---

## Regla

Si:

```
C_disponible <= 0
```

Entonces:

- Marcar slot como `sold_out`
- Bloquear selección en frontend
- Rechazar en backend

---

# 5. Checkout y Post-Venta

## Idempotencia de Pago

Al recibir webhooks de **Mercado Pago**:

Verificar siempre:

```
external_reference
```

Contra la tabla:

```
payment_notifications
```

Objetivo:

- Evitar pagos duplicados
- Evitar órdenes duplicadas
- Mantener integridad financiera

---

## Confirmación WhatsApp

Tras pago aprobado:

Disparar notificación automática que incluya:

- Confirmación del pedido
- Fecha y hora de retiro
- Ubicación Google Maps
- Consejos de transporte

---

## Ejemplo de Consejos

- Mantener en superficie plana
- Evitar exposición al sol
- Transportar en ambiente frío
- No inclinar la torta

---

# Principios de Negocio

- Producción artesanal primero
- No sobreventa
- Experiencia premium
- Consistencia de precios
- Escalabilidad futura

---

# 6. Reglas de Autenticación y UX

## Priorizar Guest Checkout

No bloquear la compra con formularios de registro obligatorios.

El sistema debe:

- Permitir comprar sin crear cuenta
- Minimizar fricción en el checkout
- Priorizar conversión sobre registro

Motivo:

La mayoría de los clientes de pastelería:

- Compran ocasionalmente
- No desean crear cuenta
- Abandonan si el proceso es largo

---

## Post-Purchase Registration

Ofrecer crear cuenta **solo después del pago exitoso**.

Momento ideal:

- Pantalla de confirmación
- Email post-compra
- WhatsApp de confirmación

Ejemplo UX:

- "¿Querés guardar tus datos para tu próxima compra?"
- "Creá tu cuenta en 1 clic"

Beneficios:

- Mejor conversión
- Experiencia premium
- Menos fricción

---

## Admin Access

Solo correos autorizados pueden acceder a:

```
/admin
```

Ejemplo:

```
tu_mail@gmail.com
```

Implementación:

- Lista blanca de emails
- Validación mediante Supabase Auth
- Protección en middleware

---

## Seguridad

Usar:

- Supabase Auth
- Middleware de Next.js
- Protección de rutas privadas

Rutas protegidas:

- `/admin`
- `/admin/orders`
- `/admin/products`
- `/admin/pickup-slots`

Ejemplo de validación

- Usuario autenticado
- Email autorizado
- Rol administrador

---

## Principios UX

- Guest checkout primero
- Registro opcional
- Admin seguro
- Flujo de compra rápido
- Experiencia premium