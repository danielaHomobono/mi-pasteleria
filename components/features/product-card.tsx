import Image from "next/image";
import type { ProductWithVariants } from "@/lib/actions/products";
import { formatPrice } from "@/lib/utils/price";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductCardProps {
  product: ProductWithVariants;
  priority?: boolean;
}

/**
 * ProductCard - Tarjeta individual de producto
 * Muestra nombre, descripción, imagen y precio inicial (más bajo)
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const hasImage = !!product.image_url;
  const hasDescription = !!product.description;
  const hasVariants = product.product_variants.length > 0;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105">
      {/* Imagen del producto */}
      {hasImage && (
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <Image
            src={product.image_url!}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        </div>
      )}

      {/* Contenido de la tarjeta */}
      <CardHeader className={`pb-3 ${!hasImage ? "pt-4" : ""}`}>
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-base md:text-lg">
            {product.name}
          </CardTitle>
          {hasDescription && (
            <CardDescription className="line-clamp-2 text-xs md:text-sm">
              {product.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      {/* Precio y variantes */}
      <CardContent className="space-y-4">
        {/* Precio inicial */}
        {hasVariants && (
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-muted-foreground">Desde</span>
            <span className="text-xl font-bold text-primary md:text-2xl">
              {formatPrice(product.minPrice)}
            </span>
          </div>
        )}

        {/* Resumen de variantes */}
        {hasVariants && (
          <div className="space-y-1 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {product.product_variants.length}{" "}
              {product.product_variants.length === 1 ? "variante" : "variantes"}
            </p>
            <div className="flex flex-wrap gap-1">
              {product.product_variants.slice(0, 3).map((variant) => (
                <span
                  key={variant.id}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {variant.variant_name}
                </span>
              ))}
              {product.product_variants.length > 3 && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  +{product.product_variants.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Categoría (si existe) */}
        {product.category && (
          <div className="pt-2">
            <span className="inline-block rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent-foreground">
              {product.category}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
