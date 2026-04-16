import { Suspense } from "react";
import { getProductsWithVariants } from "@/lib/actions/products";
import { ProductCard } from "./product-card";
import { ProductCardSkeleton } from "./product-card-skeleton";

/**
 * ProductCatalog - React Server Component
 * Trae todos los productos con sus variantes y los muestra en Bento Grid
 * Incluye Suspense boundaries para mejor UX
 */
export async function ProductCatalog() {
  const products = await getProductsWithVariants();

  if (products.length === 0) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-lg text-muted-foreground">
          No hay productos disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid auto-rows-max gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <Suspense
            key={product.id}
            fallback={<ProductCardSkeleton />}
          >
            <ProductCard
              product={product}
              priority={index < 4}
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
}
