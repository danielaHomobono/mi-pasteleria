import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * ProductCardSkeleton - Skeleton loading para ProductCard
 * Se muestra mientras se cargan los productos
 */
export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Skeleton de imagen */}
      <div className="aspect-square w-full bg-muted animate-pulse" />

      {/* Skeleton de contenido */}
      <CardHeader className="pb-3 pt-4 space-y-2">
        <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Skeleton de precio */}
        <div className="flex items-baseline gap-1">
          <div className="h-4 bg-muted rounded animate-pulse w-12" />
          <div className="h-6 bg-muted rounded animate-pulse w-24" />
        </div>

        {/* Skeleton de variantes */}
        <div className="space-y-2 border-t pt-3">
          <div className="h-4 bg-muted rounded animate-pulse w-20" />
          <div className="flex flex-wrap gap-1">
            <div className="h-6 bg-muted rounded-full animate-pulse w-20" />
            <div className="h-6 bg-muted rounded-full animate-pulse w-24" />
            <div className="h-6 bg-muted rounded-full animate-pulse w-16" />
          </div>
        </div>

        {/* Skeleton de categoría */}
        <div className="pt-2">
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
