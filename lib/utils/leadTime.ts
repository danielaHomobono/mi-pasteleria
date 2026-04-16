'use server';

/**
 * Validación de Lead Time (Tiempo de Producción)
 *
 * Regla maestra: No se permiten pedidos con menos de 48 horas de antelación
 * respecto a la fecha y hora de retiro.
 *
 * Zona horaria: America/Argentina/Cordoba (UTC-3)
 */

/**
 * Calcula la fecha/hora mínima permitida para retiro
 * @returns ISO string de la fecha mínima permitida (ahora + 48 horas)
 */
export function getMinimumPickupDateTime(): Date {
  const now = new Date();
  // Sumar 48 horas (172800000 milisegundos)
  return new Date(now.getTime() + 48 * 60 * 60 * 1000);
}

/**
 * Valida que la fecha/hora de retiro cumpla con el lead time de 48 horas
 * @param pickupDate - Fecha de retiro (ISO string o Date)
 * @throws Error si la fecha está dentro de las próximas 48 horas
 * @returns true si es válida
 */
export function validateLeadTime(pickupDate: string | Date): boolean {
  const pickup = typeof pickupDate === 'string' ? new Date(pickupDate) : pickupDate;
  const minimum = getMinimumPickupDateTime();

  if (pickup < minimum) {
    throw new Error(
      `Lead time mínimo de 48 horas requerido. Fecha mínima permitida: ${minimum.toISOString()}`
    );
  }

  return true;
}

/**
 * Convierte una fecha y hora local a ISO string considerando zona horaria Argentina
 * @param date - Date object
 * @param time - String en formato HH:mm (ej: "14:30")
 * @returns ISO string
 */
export function localToISO(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);

  // Crear una fecha local en Argentina
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  );

  // Convertir a ISO string
  return localDate.toISOString();
}

/**
 * Formatea fecha/hora para mostrar al usuario (zona Argentina)
 * @param dateString - ISO string
 * @returns String legible en formato "16/04/2026 14:30"
 */
export function formatPickupDateTime(dateString: string): string {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Cordoba',
  }).format(date);
}

/**
 * Obtiene el día de la semana en español
 * @param dateString - ISO string
 * @returns Nombre del día (ej: "Jueves")
 */
export function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    timeZone: 'America/Argentina/Cordoba',
  }).format(date);
}

/**
 * Calcula cuántas horas faltan para la fecha de retiro
 * @param pickupDate - ISO string de fecha de retiro
 * @returns Número de horas restantes
 */
export function getHoursUntilPickup(pickupDate: string): number {
  const now = new Date();
  const pickup = new Date(pickupDate);
  const diffMs = pickup.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}
