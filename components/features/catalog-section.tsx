import { ProductCatalog } from "@/components/features/product-catalog";
import { Suspense } from "react";

/**
 * CatalogSection - Sección de catálogo elegante
 * Wrapper con título y descripción para el ProductCatalog RSC
 */
export function CatalogSection() {
  return (
    <section className="w-full space-y-8 py-12 md:py-16 lg:py-20">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Nuestros Productos
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Descubrí nuestra colección de tortas artesanales, elaboradas con los
          mejores ingredientes. Personalizá tu pedido y elige tu tamaño favorito.
        </p>
      </div>

      {/* Catálogo con Suspense */}
      <Suspense fallback={<CatalogLoadingFallback />}>
        <ProductCatalog />
      </Suspense>
    </section>
  );
}

/**
 * CatalogLoadingFallback - Fallback mientras se carga el catálogo
 */
function CatalogLoadingFallback() {
  return (
    <div className="w-full">
      <div className="grid auto-rows-max gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-6 space-y-4 animate-pulse"
          >
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
            <div className="h-6 bg-muted rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
