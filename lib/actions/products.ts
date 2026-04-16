"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type ProductVariantForCatalog = Omit<
  Tables<"product_variants">,
  "product_id"
> & {
  product_id?: string | null;
};

export type ProductWithVariants = Tables<"products"> & {
  product_variants: ProductVariantForCatalog[];
  minPrice: number; // en centavos
};

export async function getProductsWithVariants(): Promise<ProductWithVariants[]> {
  const supabase = await createClient();

  // Traer productos con sus variantes
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      category,
      image_url,
      created_at,
      product_variants (
        id,
        variant_name,
        price_in_cents,
        stock_quantity,
        servings_suggested,
        created_at
      )
    `
    )
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
    throw new Error("No se pudieron cargar los productos");
  }

  // Calcular el precio mínimo para cada producto
  const productsWithMinPrice: ProductWithVariants[] = (products || []).map(
    (product) => {
      const variants = (product.product_variants || []) as ProductVariantForCatalog[];
      const minPrice =
        variants.length > 0
          ? Math.min(...variants.map((v) => v.price_in_cents))
          : 0;

      return {
        ...product,
        product_variants: variants,
        minPrice,
      } as ProductWithVariants;
    }
  );

  return productsWithMinPrice;
}
