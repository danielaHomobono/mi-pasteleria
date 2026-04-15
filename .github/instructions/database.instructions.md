# Instrucciones de Arquitectura de Datos (PostgreSQL & Supabase)

## Configuración del Archivo

**Ruta obligatoria:**

```
.github/instructions/database.instructions.md
```

**Configuración Copilot:**

```yaml
applyTo: "supabase/migrations/*.sql, lib/supabase/**/*, types/database.ts"
```

---

# 1. Seguridad Obligatoria (Row Level Security - RLS)

## Regla de Oro

Nunca crear una tabla sin habilitar **Row Level Security (RLS)** de inmediato.

## Acción Obligatoria

Incluir siempre:

```sql
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
```

## Políticas Estándar

### Catálogo (Productos / Variantes)

Permitir lectura para usuarios anónimos:

```sql
CREATE POLICY "Public read access"
ON products
FOR SELECT
TO anon
USING (true);
```

---

### Pedidos / Usuarios

Solo el propietario puede acceder:

```sql
auth.uid() = user_id
```

Ejemplo:

```sql
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
USING (auth.uid() = user_id);
```

---

# 2. Gestión de Tiempo y Auditoría

## Timestamps

Usar exclusivamente:

```
TIMESTAMPTZ
```

Esto asegura precisión con **zona horaria UTC**

## Estructura Obligatoria

Toda tabla debe incluir:

```sql
created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
```

---

# 3. Estándares de Nomenclatura

## Tablas

- Usar `snake_case`
- Usar nombres en plural

Ejemplos:

- `products`
- `pickup_slots`
- `order_items`

---

## Columnas

- Usar `snake_case`
- Usar nombres en singular

Ejemplos:

- `price_in_cents`
- `variant_name`
- `product_id`

---

## Claves Foráneas

Deben incluir el nombre de la tabla referenciada

Ejemplos:

- `product_id`
- `user_id`
- `order_id`

---

## Índices

Seguir el patrón:

```
idx_nombre_tabla_nombre_columna
```

Ejemplos:

- `idx_products_category_id`
- `idx_orders_user_id`

---

# 4. Tipos de Datos para E-commerce

## Precios

Guardar montos como **INTEGER en centavos**

Ejemplo:

```
$1500.50 → 150050
```

Ventajas:

- Evita errores de redondeo
- Mayor precisión financiera
- Mejor performance

Ejemplo SQL:

```sql
price_in_cents INTEGER NOT NULL
```

---

## Identificadores

Usar **UUID** como clave primaria por defecto:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

---

## Estados

Usar **ENUM** para listas cerradas

### order_status

```sql
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);
```

---

# 5. Integridad de Negocio (Pastelería)

## Relaciones

Usar `ON DELETE CASCADE` solo cuando la relación depende totalmente del padre

Ejemplo:

```sql
order_items → orders
```

```sql
FOREIGN KEY (order_id)
REFERENCES orders(id)
ON DELETE CASCADE
```

---

## Jerarquía de Producto

El modelo debe soportar:

```
Product
  └── ProductVariant
        └── SKU
```

Ejemplo:

- Product → Selva Negra
- Variant → Grande / Mediana / Porción
- SKU → Precio + Stock

---

## Capacidad de Producción

La tabla `pickup_slots` debe:

- Limitar pedidos diarios
- Validar cupo disponible
- Evitar sobreventa

Ejemplo de restricciones:

```sql
capacity INTEGER NOT NULL,
reserved INTEGER DEFAULT 0,
CHECK (reserved <= capacity)
```

---

# Principios Generales

- Tipado estricto
- Seguridad por defecto
- Escalabilidad
- Integridad de datos
- Performance optimizada

---

# Regla Final

Cada nueva tabla debe cumplir:

- RLS habilitado
- UUID como PK
- timestamps obligatorios
- nomenclatura estándar
- integridad referencial