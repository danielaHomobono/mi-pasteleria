import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CakeCustomizer } from "@/components/features/cake-customizer";
import { getProductsWithVariants } from "@/lib/actions/products";

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

/**
 * ProductDetailsPage - Página de detalles del producto
 * Muestra el CakeCustomizer para personalización
 */
export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { id } = await params;
  const products = await getProductsWithVariants();
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navegación (Reutilizable) */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <a href="/" className="font-semibold hover:opacity-75 transition-opacity">
            Mi Pastelería
          </a>
          <a
            href="/cart"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Carrito
          </a>
        </div>
      </nav>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-6xl px-5 py-12">
          <Suspense fallback={<ProductDetailsLoadingFallback />}>
            <CakeCustomizer product={product} />
          </Suspense>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-t-foreground/10 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mi Pastelería. Todos los derechos
              reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Tortas artesanales de Río Tercero, Córdoba
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/**
 * Fallback de carga
 */
function ProductDetailsLoadingFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 animate-pulse">
      {/* Galería */}
      <div className="space-y-4">
        <div className="aspect-square rounded-lg bg-muted" />
      </div>

      {/* Detalles */}
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>

        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>

        <div className="h-12 bg-muted rounded" />
      </div>
    </div>
  );
}
