/**
 * formatPrice - Convierte centavos a pesos argentinos formateados
 * @param cents - Precio en centavos
 * @returns String con formato de moneda ARS
 *
 * Ejemplo:
 * formatPrice(150050) → "$1.500,50"
 */
export function formatPrice(cents: number): string {
  const pesos = cents / 100;

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}

/**
 * centsToPesos - Convierte centavos a pesos (número)
 * @param cents - Precio en centavos
 * @returns Número de pesos
 */
export function centsToPesos(cents: number): number {
  return cents / 100;
}

/**
 * pesosToCents - Convierte pesos a centavos
 * @param pesos - Precio en pesos
 * @returns Número de centavos
 */
export function pesosToCents(pesos: number): number {
  return Math.round(pesos * 100);
}
