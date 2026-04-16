# 📋 Webhook Mercado Pago - Checklist de Configuración

**Documento:** Pasos exactos para configurar webhook en producción  
**Última actualización:** 16 de Abril de 2026

---

## ✅ Parte 1: Código (YA COMPLETADO)

- [x] `app/api/webhooks/mercadopago/route.ts` creado (765 líneas)
- [x] Verificación de firma x-signature implementada
- [x] Idempotencia implementada
- [x] Fetch a Mercado Pago API implementado
- [x] Lógica de negocio (orders + pickup_slots) implementada
- [x] Error handling exhaustivo
- [x] Logging con timestamps y emojis
- [x] TypeScript strict mode validado ✅ (0 errores)
- [x] Documentación completa

---

## 🔧 Parte 2: Variables de Entorno

### Paso 1: Obtener WEBHOOK_SECRET desde Mercado Pago

1. Ir a: https://www.mercadopago.com.ar/developers/dashboard
2. Login con tu cuenta
3. Selecciona tu aplicación
4. Menu izquierdo: **Developers** → **Webhooks**
5. Ver pantalla de notificaciones:
   ```
   ┌─────────────────────────────────┐
   │ Notificaciones de Webhooks      │
   │                                 │
   │ URL:                            │
   │ https://tudominio.com/api/webhooks/mercadopago
   │                                 │
   │ Eventos:                        │
   │ ☑ payment.created              │
   │ ☑ payment.updated              │
   │ ☑ payment.success              │
   │                                 │
   │ Webhook secret: [COPIAR ESTO]  │ ← ⭐ AQUÍ
   └─────────────────────────────────┘
   ```

6. Copiar el webhook secret (string de ~40 caracteres)

### Paso 2: Configurar en .env.local (desarrollo)

```bash
# .env.local

# Ya debe estar configurado de sesiones anteriores:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...

# AGREGAR ESTOS:
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret_aqui
```

### Paso 3: Configurar en variables de entorno de Vercel (producción)

Si está hosteado en Vercel:

1. Ir a: https://vercel.com/dashboard
2. Selecciona el proyecto `mi-pasteleria`
3. Settings → **Environment Variables**
4. Agregar 2 nuevas variables:

```
Nombre: MERCADOPAGO_WEBHOOK_SECRET
Valor: [tu_webhook_secret_de_Mercado Pago]
Environments: Production, Preview, Development

Nombre: MERCADOPAGO_ACCESS_TOKEN
Valor: [tu_access_token_de_Mercado Pago]
Environments: Production, Preview, Development
```

5. Click "Save"
6. Redeploy: Click "Redeploy" en la pantalla de deployments

---

## 🔗 Parte 3: Registrar URL en Mercado Pago

### Desarrollo (Local con ngrok)

```bash
# Terminal 1: Inicia tu app
npm run dev
# Debería mostrar: ▲ Next.js X.X.X

# Terminal 2: Expone localhost con ngrok
ngrok http 3000

# Output:
# Forwarding: https://abc123-def456.ngrok.io → http://localhost:3000

# Copia: https://abc123-def456.ngrok.io
```

### Producción (URL final)

Tu URL es: **https://tudominio.com** (sin trailing slash)

---

### Registrar en Mercado Pago Dashboard

1. Ir a: https://www.mercadopago.com.ar/developers/dashboard
2. Developers → **Webhooks**
3. Sección "Notificaciones"
4. Campo "URL":
   ```
   [Pega tu URL aquí]
   
   Desarrollo:  https://abc123-def456.ngrok.io/api/webhooks/mercadopago
   Producción:  https://midominio.com/api/webhooks/mercadopago
   ```

5. Eventos a notificar:
   ```
   ☑ payment.created      (cuando se crea el pago)
   ☑ payment.updated      (cuando cambia de estado)
   ☑ payment.success      (cuando se aprueba)
   ```

6. Click **Guardar** o **Update**

---

## 🧪 Parte 4: Testing en Sandbox (Antes de Producción)

### Setup Sandbox

1. Ir a: https://www.mercadopago.com.ar/developers/sandbox
2. Tienes 2 ambientes:
   - **SANDBOX:** Para testing (no real money)
   - **PRODUCTION:** Para real (dinero real)

3. Usar tarjeta de prueba:
   ```
   Número: 4111 1111 1111 1111
   Vencimiento: 12/25 (futuro)
   CVV: 123
   Titular: TEST TEST
   ```

### Test 1: Pago Aprobado

```bash
# En terminal 1: npm run dev
# En terminal 2: ngrok http 3000

# En navegador:
# 1. Ir a http://localhost:3000/cart
# 2. Agregar un cake al carrito
# 3. Click "Proceder al pago"
# 4. Click "Pagar con Mercado Pago"
# 5. Click "Ir a Mercado Pago"
#
# En Mercado Pago Sandbox:
# 6. Seleccionar "Tarjeta de crédito"
# 7. Pega datos de tarjeta de prueba arriba
# 8. Click "Pagar"
#
# En tu app (webhook):
# 9. Ver en logs: ✅ Webhook procesado exitosamente
# 10. Verificar en BD:
```

```sql
-- En Supabase SQL Editor

-- Ver orden confirmada
SELECT * FROM orders 
WHERE id = 'order-uuid-que-viste' 
LIMIT 1;
-- Debe mostrar: status='confirmed', payment_status='paid'

-- Ver notificación de webhook
SELECT * FROM payment_notifications 
WHERE mercadopago_payment_id ILIKE '%123456%'
ORDER BY created_at DESC 
LIMIT 1;
-- Debe mostrar: processed=true, processed_at=ahora
```

### Test 2: Webhook Idempotencia

```bash
# Desde terminal 1 (Node.js):
node

// Simular 2 webhooks idénticos
const fetch = (...) => {
  // Mock request
}

const url = 'http://localhost:3000/api/webhooks/mercadopago?data.id=123&type=payment&id=456';

const req1 = await fetch(url, { method: 'POST' });
const req2 = await fetch(url, { method: 'POST' });

console.log(req1.status); // 200
console.log(req2.status); // 200

// Verificar en BD que se procesa solo 1 vez:
SELECT COUNT(*) as webhook_count 
FROM payment_notifications 
WHERE processed = true;
// Debería ser: 1 (no 2)
```

### Test 3: Firma Inválida

```bash
# En navegador console:
const invalidReq = await fetch(
  'http://localhost:3000/api/webhooks/mercadopago?data.id=999&type=payment&id=999',
  {
    method: 'POST',
    headers: {
      'x-signature': 'ts=123,v1=INVALID_SIGNATURE_FAKE'
    }
  }
);

console.log(invalidReq.status); // 401
console.log(await invalidReq.json()); 
// { status: 'unauthorized', message: 'Invalid webhook signature' }
```

### Test 4: Timing Performance

```bash
# Buscar en logs:
grep "processingTimeMs" logs.txt

# Debería mostrar:
⏱️ processingTimeMs: 1200
⏱️ processingTimeMs: 850
⏱️ processingTimeMs: 2100

# Todos < 22000 ms ✅
```

---

## 🚀 Parte 5: Desplegar a Producción

### Pre-Deployment Checklist

- [ ] Variables de entorno configuradas en Vercel
- [ ] Tests pasados en Sandbox
- [ ] Logs verificados sin errores
- [ ] URL de webhook registrada en Mercado Pago (producción)

### Deployment Steps

1. **Commit y push** (ya realizado):
   ```bash
   git log --oneline -3
   # ca217c8 docs: resumen de implementación del webhook
   # 7b88d23 docs: documentación completa del webhook
   # 8550020 feat: webhook handler Mercado Pago
   ```

2. **Trigger deploy en Vercel** (automático si push a main):
   ```
   Vercel detecta push → Build → Deploy
   Ver en: https://vercel.com/dashboard/...
   ```

3. **Verificar deployment**:
   ```bash
   curl https://tudominio.com/api/webhooks/mercadopago
   # Respuesta: { status: 'ok', service: 'Mercado Pago Webhook Handler' }
   ```

4. **Verificar logs en Vercel**:
   ```
   Vercel Dashboard → Deployments → Latest → Logs → Runtime Logs
   ```

5. **Test webhook en Mercado Pago Sandbox**:
   ```
   Developers → Webhooks → [tu webhook] → Test/Send
   Ver en logs si llega y procesa
   ```

---

## 📊 Parte 6: Monitoreo en Producción

### Setup Vercel Logs

1. Ir a: https://vercel.com/docs/monitoring/real-time-data
2. Vercel Dashboard → Deployments → Runtime Logs
3. Buscar:
   ```
   "webhook" OR "Mercado Pago"
   ```

### Setup Alert en Mercado Pago

1. Dashboard → Webhooks
2. Ver tabla de notificaciones
3. Si hay 🔴 **RED** (falló):
   - Click para ver error
   - Click "Retry" para reintentar
   - Investigar en logs

### Métricas a Monitorear

```bash
# Diariamente (o vía cron):

# 1. Webhooks recibidos
SELECT DATE(created_at), COUNT(*) 
FROM payment_notifications 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY DATE(created_at);

# 2. Órdenes confirmadas por webhook
SELECT COUNT(*) 
FROM orders 
WHERE status = 'confirmed' 
AND updated_at > NOW() - INTERVAL '1 day';

# 3. Errores de webhook
SELECT error_message, COUNT(*) 
FROM payment_notifications 
WHERE error_message IS NOT NULL 
AND created_at > NOW() - INTERVAL '1 day'
GROUP BY error_message;

# 4. Webhooks sin procesar (debería ser ~0)
SELECT COUNT(*) 
FROM payment_notifications 
WHERE processed = FALSE;
```

---

## 🆘 Troubleshooting

### Problema: Webhook no llega

**Checklist:**
- [ ] URL registrada en Mercado Pago Dashboard (Developers → Webhooks)
- [ ] URL es accesible (GET devuelve 200 OK)
- [ ] Firewall no bloquea (permitir Mercado Pago IPs)
- [ ] Vercel deploy está activo (no en draft)

**Debug:**
```bash
# Test de conectividad
curl https://tudominio.com/api/webhooks/mercadopago
# Debería responder 200 OK

# Ver logs en Vercel
vercel logs --filter="webhook"
```

---

### Problema: Firma inválida (401)

**Causas posibles:**
1. WEBHOOK_SECRET incorrecto
2. WEBHOOK_SECRET cambió en Mercado Pago
3. Zona horaria diferente (ts parsing)

**Fix:**
```bash
# 1. Copiar WEBHOOK_SECRET nuevamente de Mercado Pago
# 2. Actualizar en Vercel Environment Variables
# 3. Redeploy
vercel redeploy

# 3. Test
# (Enviar webhook de prueba desde Mercado Pago Dashboard)
```

---

### Problema: Orden no encontrada

**Error en logs:**
```
❌ Orden no encontrada: order-123
```

**Causas:**
1. `external_reference` enviado a Mercado Pago es incorrecto
2. Orden fue eliminada después de crear preference
3. IDs no coinciden (case sensitivity)

**Debug:**
```sql
-- Ver si orden existe
SELECT id FROM orders WHERE id = 'order-123';

-- Ver qué external_reference tenemos
SELECT id, external_reference FROM orders ORDER BY created_at DESC LIMIT 5;

-- Si no existe, crear manualmente para testing
INSERT INTO orders (...) VALUES (...);
```

---

### Problema: Timing SLA Violation

**Log:**
```
⚠️ TIMING SLA VIOLATION: 25000ms (límite: 22000ms)
```

**Causas:**
1. Mercado Pago API lenta
2. Base de datos lenta
3. Red lenta

**Fix:**
1. Agregar índices en BD (ver migrations)
2. Reducir logging (en producción)
3. Usar CDN + caching

---

## 📞 Soporte

Si algo falla en producción:

1. **Ver logs en Vercel:** https://vercel.com/dashboard
2. **Ver webhooks en Mercado Pago:** https://www.mercadopago.com.ar/developers/dashboard
3. **Buscar en documentación:** WEBHOOK_MERCADOPAGO_DOCUMENTATION.md
4. **Contactar soporte Mercado Pago:** https://www.mercadopago.com.ar/ayuda

---

## ✅ Checklist Final

Antes de considerar "listo para producción":

- [ ] .env.local tiene WEBHOOK_SECRET
- [ ] Vercel tiene WEBHOOK_SECRET en env vars
- [ ] URL registrada en Mercado Pago (SANDBOX + PRODUCTION)
- [ ] Test pago aprobado en Sandbox
- [ ] Test idempotencia (2 webhooks iguales)
- [ ] Test signature verification
- [ ] Logs visibles en Vercel
- [ ] BD tiene órdenes confirmadas
- [ ] Timing < 22 segundos
- [ ] Email de confirmación se envía (o skipea silenciosamente)

---

**Estado:** 🟢 Listo para configuración  
**Próximo paso:** Llenar variables de entorno y registrar URL en Mercado Pago
