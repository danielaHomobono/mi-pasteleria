# ⚡ Guía Rápida - Webhook Mercado Pago

**Para:** Desarrolladores que quieren entender el webhook en 5 minutos  
**Tiempo estimado:** 5 minutos  
**Nivel:** Intermediate

---

## 🎯 En Una Oración

Cuando un cliente paga en Mercado Pago, nosotros recibimos un webhook que confirma automáticamente su orden.

---

## 📍 Ubicación del Código

```
app/api/webhooks/mercadopago/route.ts
├── POST /api/webhooks/mercadopago
│   └── Recibe notificaciones de Mercado Pago
│       1. Verifica firma (seguridad)
│       2. Busca en payment_notifications (idempotencia)
│       3. Fetch datos reales de MP (confiabilidad)
│       4. Actualiza orders (confirmed) + pickup_slots
│       5. Responde 200 OK en < 22s
│
└── GET /api/webhooks/mercadopago
    └── Health check
```

---

## 🔄 Flujo Visual (3 pasos principales)

```
┌─────────────────────┐
│ Cliente paga en MP  │
└──────────┬──────────┘
           ↓
┌──────────────────────────────────┐
│ MP envía POST webhook            │
│ /api/webhooks/mercadopago        │
│ Headers: x-signature: ...        │
└──────────┬───────────────────────┘
           ↓
┌──────────────────────────────────┐
│ Tu servidor procesa:             │
│ 1. Verifica firma ✅             │
│ 2. Valida idempotencia ✅        │
│ 3. Actualiza BD ✅              │
│ 4. Responde 200 OK ✅           │
└──────────┬───────────────────────┘
           ↓
┌─────────────────────┐
│ Orden confirmada    │
│ Cliente recibe      │
│ email de conf.      │
└─────────────────────┘
```

---

## 🔑 5 Características Principales

### 1. Idempotencia
```typescript
// Si webhook llega 2 veces:
// Primera: Procesa ✅
// Segunda: "Ya procesado" → devuelve 200 OK ✅
// Resultado: Orden NO se duplica ✅
```

### 2. Verificación de Firma
```typescript
// Mercado Pago envía: x-signature: ts=...,v1=...
// Nosotros verificamos con crypto.timingSafeEqual()
// Si firma inválida: rechaza 401 ❌
```

### 3. Fetch Real del Status
```typescript
// No confía en el webhook
// Consulta: GET /v1/payments/{paymentId}
// Verifica status REAL en Mercado Pago ✅
```

### 4. Lógica de Negocio
```typescript
// Si pagó ✅:
//   orders.status = 'confirmed'
//   pickup_slots.current_orders += 1
//
// Si rechazó ❌:
//   orders.status = 'cancelled'
```

### 5. Respuesta < 22 segundos
```typescript
// SLA de Mercado Pago: < 22 segundos
// Implementado:
//   - Siempre devolver 200 OK
//   - Tracking de tiempo
//   - Email async (no bloquea)
```

---

## 📊 Estados del Pago

```
Pago en Mercado Pago          →  Tu servidor hace         →  Estado orden
─────────────────────────────────────────────────────────────────────────
approved / authorized         →  Update confirmed         →  ✅ confirmed
rejected / cancelled          →  Update cancelled         →  ❌ cancelled  
pending / in_process / etc    →  No cambios              →  ⏳ pending
```

---

## 🛡️ Seguridad en 30 Segundos

**Pregunta:** ¿Cómo sé que es un webhook legítimo de Mercado Pago?

**Respuesta:** Verificamos la firma x-signature:

```typescript
// Mercado Pago manda:
x-signature: ts=1626120000,v1=abcdef123456...

// Nosotros reconstruimos:
hash = SHA256(ts + WEBHOOK_SECRET + request_id)

// Y comparamos (timing-safe):
crypto.timingSafeEqual(hash_recibido, hash_recalculado)

// Si no match → rechazar 401 ❌
```

**Dónde está el WEBHOOK_SECRET:**
```bash
# Copiar de Mercado Pago Dashboard
Developers → Webhooks → [tu webhook] → Webhook secret
```

---

## 🧪 Testing en 2 Minutos

### Setup

```bash
# Terminal 1: Tu app
npm run dev

# Terminal 2: Expone localhost
ngrok http 3000
# Output: https://abc123.ngrok.io
```

### Registrar en Mercado Pago

1. Dashboard → Developers → Webhooks
2. URL: `https://abc123.ngrok.io/api/webhooks/mercadopago`
3. Guardar

### Test Pago

1. http://localhost:3000/cart
2. Agregar cake
3. Pagar con Mercado Pago
4. Usar tarjeta de prueba: `4111 1111 1111 1111`
5. Ver en logs: `✅ Webhook procesado`

### Verificar en BD

```sql
SELECT * FROM orders 
WHERE status = 'confirmed' 
ORDER BY created_at DESC 
LIMIT 1;
-- Debe mostrar tu orden recién confirmada
```

---

## 🐛 Si Algo Falla

### Webhook no llega

```bash
# Verificar que endpoint responde
curl https://tudominio.com/api/webhooks/mercadopago
# Debe devolver 200 OK con { status: 'ok' }
```

### Firma inválida (401)

```bash
# Verificar WEBHOOK_SECRET correcto
# Copiar de nuevo de Mercado Pago Dashboard
# Actualizar en .env.local
# Reiniciar app: npm run dev
```

### Orden no encontrada

```sql
-- Verificar que orden existe
SELECT id FROM orders WHERE id = 'order-id-aqui';

-- Si no existe, revisar:
-- 1. external_reference en checkoutOrder es correcto?
-- 2. Se guardó en BD antes de crear preference?
```

### Timing lento (> 15 segundos)

- Mercado Pago API lenta → no puedes controlar
- BD lenta → agregar índices
- Logging lento → reducir logs en producción

---

## 📁 Archivos Relacionados

```
app/api/webhooks/mercadopago/route.ts
└── POST handler principal (765 líneas)

lib/actions/orders.ts
└── checkoutOrder() - Crea órdenes

types/database.ts
└── Tipos para: orders, order_items, payment_notifications

supabase/migrations/
├── 20260416_create_orders_table.sql
├── 20260416_create_order_items_table.sql
└── 20260416_create_payment_notifications_table.sql

WEBHOOK_MERCADOPAGO_DOCUMENTATION.md
└── Documentación detallada (1000+ líneas)

WEBHOOK_CONFIGURATION_CHECKLIST.md
└── Pasos para producción
```

---

## 🚀 Ciclo Completo de Un Pago

```
1. Cliente entra a /cart
   └─ Ve torta personalizada

2. Cliente hace click "Proceder al pago"
   └─ checkoutOrder() Server Action
   └─ Crea orden en orders table
   └─ Crea order_items
   └─ Genera init_point en Mercado Pago

3. Cliente paga en Mercado Pago
   └─ Ingresa tarjeta
   └─ Click "Pagar"

4. Mercado Pago procesa
   └─ Valida tarjeta
   └─ Aprueba o rechaza

5. Mercado Pago envía webhook
   └─ POST /api/webhooks/mercadopago?data.id=123...
   └─ Headers: x-signature: ...

6. Tu servidor recibe webhook
   └─ Verifica firma ✅
   └─ Busca en payment_notifications (idempotencia)
   └─ Fetch datos de Mercado Pago
   └─ Actualiza orders.status = 'confirmed'
   └─ Incrementa pickup_slots.current_orders
   └─ Responde 200 OK

7. Cliente ve confirmación
   └─ Email con detalles
   └─ Puede rastrear orden
```

---

## 💭 Preguntas Frecuentes

### P: ¿Qué pasa si el servidor está caído?

**R:** Mercado Pago reintenta automáticamente:
- Intento 1: inmediatamente
- Intento 2: +5 min
- Intento 3: +15 min
- Intento 4: +30 min
- Intento 5: +1 hora

Cuando vuelva el servidor, los webhooks se procesarán.

---

### P: ¿Puedo procesar el webhook sin verificar firma?

**R:** **NO.** Es un riesgo de seguridad masivo. Alguien podría:
- Crear órdenes falsas
- Confirmar pagos sin dinero
- Acceder a datos de clientes

**Siempre** verifica la firma con `crypto.timingSafeEqual()`.

---

### P: ¿Por qué `maybeSingle()` y no `single()`?

**R:** `maybeSingle()` devuelve null si no existe (sin error)  
`single()` lanza error si no existe (crashes)

```typescript
// ✅ Usamos maybeSingle()
const { data: existing } = await supabase
  .from('payment_notifications')
  .select(...)
  .maybeSingle(); // null si no existe, no error

if (existing?.processed) { ... }
```

---

### P: ¿Debo borrar webhooks viejos?

**R:** No. Se guardan en `payment_notifications` indefinidamente.

Para limpiar después de meses:

```sql
DELETE FROM payment_notifications 
WHERE processed = true 
AND processed_at < NOW() - INTERVAL '3 months';
```

---

### P: ¿Funciona con Mercado Pago Plus?

**R:** Sí. El webhook es estándar en todos los productos de MP:
- Checkout Pro ✅
- Checkout Bricks ✅
- Integración Custom ✅
- Mobile SDK ✅

---

## 📖 Documentación Completa

- **WEBHOOK_MERCADOPAGO_DOCUMENTATION.md** - 1000+ líneas, todo detalle
- **WEBHOOK_CONFIGURATION_CHECKLIST.md** - Pasos para producción
- **WEBHOOK_IMPLEMENTATION_SUMMARY.md** - Resumen de sesión

---

## ✅ Para Verificar que Funciona

```bash
# 1. Código compilado sin errores
npm run build
# ✅ No debe haber errores

# 2. Endpoint responde
curl http://localhost:3000/api/webhooks/mercadopago
# ✅ { status: 'ok', service: '...' }

# 3. Test webhook en Mercado Pago Sandbox
# Dashboard → Webhooks → [tu webhook] → Test/Send
# ✅ Ver que llega y se procesa

# 4. Verificar en BD
SELECT * FROM payment_notifications WHERE processed = true;
# ✅ Debe haber registros

# 5. Ver logs en Vercel
vercel logs --filter="webhook"
# ✅ Debe mostrar "✅ Webhook procesado exitosamente"
```

---

## 🎓 Conceptos Clave

| Término | Significa |
|---------|-----------|
| **Webhook** | Tu servidor recibe notificación de cambio en MP |
| **Idempotencia** | Proceso es safe de hacer 2 veces |
| **HMAC-SHA256** | Algoritmo de firma (checksum seguro) |
| **Timing-safe** | Comparación que evita timing attacks |
| **External reference** | ID de la orden (link orders ↔ MP payments) |
| **SLA** | Service Level Agreement (promesa: < 22s) |

---

## 📞 Próximos Pasos

1. **Ahora:** Llenar variables de entorno
   ```bash
   MERCADOPAGO_WEBHOOK_SECRET=...
   ```

2. **Hoy:** Testear en Sandbox
   - Registrar URL en Mercado Pago
   - Simular pago
   - Verificar que confirma

3. **Mañana:** Desplegar a producción
   - Agregar env vars en Vercel
   - Registrar URL de producción en MP
   - Test en Sandbox + Producción

4. **Próxima sesión:** Confirmation page + Email notifications

---

**Versión:** 1.0.0  
**Última actualización:** 16 de Abril de 2026  
**Status:** ✅ Ready to use
