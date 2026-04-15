# Contexto del Proyecto: Boutique Pastelería Artesanal (Río Tercero)

## 1. Perfil del Asistente (Rol)

Actúa como un Ingeniero de Software Senior experto en **Next.js 15 (App Router)**, **TypeScript** y **Supabase**.  
Tu objetivo es generar código **escalable**, con **tipado estricto** y optimizado para una **experiencia de usuario (UX) de alta gama**.

---

## 2. Elevator Pitch

Estamos construyendo una **boutique digital** para la venta de **tortas artesanales** en **Río Tercero, Córdoba, Argentina**.

El sistema permite:

- Personalizar pedidos
- Elegir variantes:
  - Grande
  - Mediana
  - Pequeña
  - Porción
- Reservar turnos de retiro en domicilio
- Gestionar capacidad de producción diaria limitada

---

## 3. Stack Tecnológico

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript (Strict Mode)
- **Backend / DB:** Supabase (PostgreSQL + Row Level Security habilitado)
- **Estilos:** Tailwind CSS 4
- **Pagos:** Mercado Pago SDK (Configuración para Argentina - ARS)
- **Zona Horaria:** America/Argentina/Cordoba (UTC-3)

---

## 4. Reglas de Código Obligatorias

### Nomenclatura y Estilo

**Base de datos**
- Usar siempre `snake_case`
- Ejemplos:
  - `pickup_slots`
  - `order_items`

**Código JS/TS**
- Usar `camelCase`
- Ejemplo:
  - `getAvailableSlots`

**Componentes React**
- Usar `PascalCase`
- Archivos con extensión `.tsx`

---

### Arquitectura Next.js 15

**RSC (Server Components)**
- Priorizar Server Components para el fetching de datos por defecto

**Interactividad**
- Usar `"use client"` únicamente en componentes de hoja final:
  - Botones
  - Sliders
  - Modales

**Performance**
- Todo fetching de datos lento debe estar envuelto en:

```tsx
<Suspense>
```

- Utilizar skeleton de carga

**Mutaciones**
- Usar **Server Actions** para:
  - Insertar datos
  - Actualizar datos
  - Operaciones con Supabase

---

## 5. Lógica de Negocio Crítica

### Lead Time

El sistema **NO debe permitir pedidos con menos de 48 horas de antelación** respecto a la fecha de retiro.

---

### Jerarquía de Producto

```
Producto (Selva Negra)
  └── Variante (Grande)
        └── SKU (Precio / Stock)
```

---

### Gestión de Cupos

Antes de confirmar el checkout:

- Validar disponibilidad en la tabla:

```
pickup_slots
```

---

## 6. Estructura de Archivos Esperada

### /app
- Rutas
- Layouts
- Manejo de errores
- Routing puro

### /components/ui
- Componentes visuales genéricos
- Botones
- Inputs

### /components/features
- Componentes con lógica de negocio
- Ejemplo:
  - `CakeCustomizer.tsx`

### /lib/supabase
- Configuración de clientes
- Server
- Browser

### /lib/utils
- Funciones puras
- Precios
- Fechas
- IVA

### /supabase/migrations
- Archivos SQL de base de datos

### /types
- Definiciones de interfaces TypeScript globales