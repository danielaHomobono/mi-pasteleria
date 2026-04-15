# Arquitectura del Sistema: Pastelería Boutique 2026

## 1. Visión Estratégica

El sistema debe ser **Serverless** y **Headless** para garantizar:

- Costo cero en la etapa de lanzamiento
- Escalabilidad elástica en fechas de alta demanda
- Arquitectura preparada para crecimiento futuro

Ejemplos de alta demanda:

- Día de la Madre
- Navidad
- Año Nuevo
- Eventos locales

---

## 2. Stack Tecnológico (The Golden Stack)

### Frontend

**Next.js 15 (App Router)**

Motivos:

- Optimización extrema de Core Web Vitals
- SEO local para Río Tercero
- Server Components por defecto
- Performance superior

---

### Backend

**Supabase**

Elegido por:

- Row Level Security (RLS) nativo
- PostgreSQL administrado
- Storage para imágenes
- Autenticación integrada
- Serverless por defecto

---

### Base de Datos

**PostgreSQL**

Motivos:

- Estructura estrictamente tipada
- Relaciones complejas
- Integridad de datos
- Escalabilidad a futuro

---

## 3. Modelo de Dominio (Jerarquía de Producto)

Para permitir filtros por tamaño y porción, no usamos productos planos.

Implementamos la siguiente jerarquía:

```
Product
  └── Variant
        └── SKU
```

---

### Product

Definición base:

- Nombre
- Descripción
- Ingredientes
- Categoría

Ejemplo:

- Torta Selva Negra

---

### Variant

Combinación física del producto

Ejemplo:

- Grande - 24 porciones
- Mediana - 16 porciones
- Porción individual

---

### SKU

Entidad transaccional final:

- Precio en centavos (INTEGER)
- Stock disponible
- Identificador único

---

## 4. Flujo de Retiro y Capacidad

La producción es **artesanal y limitada**.

El sistema debe:

### Validar Lead Time

- Mínimo 48 horas de anticipación
- Validación frontend y backend

---

### Validar Cupos

Consultar la tabla:

```
pickup_slots
```

Antes de confirmar:

- Crear Order
- Procesar pago
- Confirmar pedido

---

## 5. Seguridad

Delegamos la seguridad al motor de base de datos mediante:

**Row Level Security (RLS)**

Garantías:

- Ningún usuario puede ver pedidos ajenos
- Seguridad a nivel de fila
- Protección desde la base de datos

Ejemplo:

```
auth.uid() = user_id
```

Esto asegura:

- Privacidad
- Integridad
- Seguridad por defecto

---

## Principios Arquitectónicos

- Serverless First
- Seguridad por defecto
- Escalabilidad horizontal
- Performance optimizada
- Arquitectura mantenible