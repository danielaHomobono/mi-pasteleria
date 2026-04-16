'use server';

import { createClient } from '@/lib/supabase/server';
import { validateLeadTime, formatPickupDateTime } from '@/lib/utils/leadTime';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import type { CartItem } from '@/lib/store/useCart';

/**
 * Datos del formulario de checkout requeridos
 */
export interface CheckoutFormData {
  shippingName: string;
  shippingPhone: string;
  shippingEmail: string;
  pickupDate: string; // ISO string
  pickupTime: string; // HH:mm
  paymentMethod: 'mercadopago' | 'transfer' | 'cash';
}

/**
 * Respuesta de la acción checkoutOrder
 */
export interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  initPoint?: string; // URL para pagar en Mercado Pago
  error?: string;
}

/**
 * Inicializa el cliente de Mercado Pago
 * @returns Cliente configurado
 */
function getMercadoPagoClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado en variables de entorno');
  }

  return new MercadoPagoConfig({ accessToken });
}

/**
 * Valida los datos del formulario de checkout
 * @throws Error si los datos no son válidos
 */
function validateCheckoutData(data: CheckoutFormData): void {
  if (!data.shippingName?.trim()) {
    throw new Error('El nombre es requerido');
  }

  if (!data.shippingPhone?.trim()) {
    throw new Error('El teléfono es requerido');
  }

  if (!data.shippingEmail?.trim()) {
    throw new Error('El email es requerido');
  }

  // Validar formato de email básico
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.shippingEmail)) {
    throw new Error('Email inválido');
  }

  if (!data.pickupDate) {
    throw new Error('Fecha de retiro requerida');
  }

  if (!data.pickupTime) {
    throw new Error('Hora de retiro requerida');
  }

  // Validar formato HH:mm
  if (!/^\d{2}:\d{2}$/.test(data.pickupTime)) {
    throw new Error('Formato de hora inválido (HH:mm)');
  }

  if (!['mercadopago', 'transfer', 'cash'].includes(data.paymentMethod)) {
    throw new Error('Método de pago inválido');
  }
}

/**
 * Crea una preferencia de pago en Mercado Pago
 * @param items - Items del carrito
 * @param totalInCents - Total a cobrar en centavos
 * @param orderId - ID de la orden
 * @param email - Email del cliente
 * @returns URL de pago (init_point)
 */
async function createMercadoPagoPreference(
  items: CartItem[],
  totalInCents: number,
  orderId: string,
  email: string
): Promise<string> {
  const client = getMercadoPagoClient();
  const preference = new Preference(client);

  const mpItems = items.map((item, index) => ({
    id: `${item.id}-${index}`,
    title: `${item.productName} - ${item.variantName}`,
    description: item.customMessage ? `Mensaje: "${item.customMessage}"` : "Torta personalizada",
    unit_price: item.priceInCents / 100, // Convertir a pesos
    quantity: item.quantity,
  }));

  try {
    const result = await preference.create({
      body: {
        items: mpItems,
        payer: {
          email,
        },
        external_reference: orderId, // Para reconciliación en webhooks
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/order/${orderId}/confirmation`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/order/${orderId}/error`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/order/${orderId}/pending`,
        },
        auto_return: 'approved' as const,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      },
    });

    if (!result.init_point) {
      throw new Error('No se generó init_point en Mercado Pago');
    }

    return result.init_point;
  } catch (error) {
    console.error('Error creando preferencia Mercado Pago:', error);
    throw new Error('Error al generar link de pago');
  }
}

/**
 * Server Action: Crear orden y generar link de pago
 *
 * Flujo:
 * 1. Validar datos del formulario
 * 2. Validar lead time (48 horas)
 * 3. Validar disponibilidad de cupo (pickup_slots)
 * 4. Insertar orden en DB
 * 5. Insertar order_items en DB
 * 6. Generar preferencia Mercado Pago
 * 7. Retornar init_point (si pago es Mercado Pago)
 *
 * @param formData - Datos del formulario de checkout
 * @param cartItems - Items del carrito
 * @returns CheckoutResponse con orderId e initPoint
 */
export async function checkoutOrder(
  formData: CheckoutFormData,
  cartItems: CartItem[]
): Promise<CheckoutResponse> {
  try {
    // 1. Validar datos del formulario
    validateCheckoutData(formData);

    if (!cartItems || cartItems.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // 2. Validar lead time (48 horas)
    const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}:00`);
    validateLeadTime(pickupDateTime);

    // Calcular total
    const totalInCents = cartItems.reduce(
      (sum, item) => sum + item.priceInCents * item.quantity,
      0
    );

    if (totalInCents <= 0) {
      throw new Error('Monto total inválido');
    }

    // 3. Validar disponibilidad de cupo en pickup_slots
    const supabase = await createClient();

    // Buscar o crear slot para esa fecha
    const slotDate = formData.pickupDate; // Formato YYYY-MM-DD

    const { data: existingSlot, error: slotError } = await supabase
      .from('pickup_slots')
      .select('*')
      .eq('date', slotDate)
      .single();

    if (slotError && slotError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(`Error verificando disponibilidad: ${slotError.message}`);
    }

    if (
      existingSlot?.is_blocked ||
      (existingSlot?.current_orders ?? 0) >= (existingSlot?.max_capacity ?? 0)
    ) {
      throw new Error(
        `No hay cupo disponible para la fecha ${formatPickupDateTime(formData.pickupDate)}`
      );
    }

    // 4. Insertar orden en tabla 'orders'
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          shipping_name: formData.shippingName,
          shipping_phone: formData.shippingPhone,
          shipping_email: formData.shippingEmail,
          pickup_date: formData.pickupDate,
          pickup_time: formData.pickupTime,
          total_amount_cents: totalInCents,
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'mercadopago' ? 'pending' : 'confirmed',
          status: 'pending',
          // user_id será NULL si no hay usuario autenticado (guest checkout)
          user_id: null,
        },
      ])
      .select('id')
      .single();

    if (orderError || !orderData) {
      console.error('Error creando orden:', orderError);
      throw new Error('Error al crear la orden');
    }

    const orderId = orderData.id;

    // 5. Insertar order_items
    const orderItems = cartItems.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price_cents: item.priceInCents,
      custom_message: item.customMessage || null,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creando order_items:', itemsError);
      // Eliminar la orden si fallan los items
      await supabase.from('orders').delete().eq('id', orderId);
      throw new Error('Error al guardar items de la orden');
    }

    // 6. Actualizar pickup_slots (incrementar current_orders)
    if (existingSlot) {
      const { error: updateError } = await supabase
        .from('pickup_slots')
        .update({
          current_orders: (existingSlot.current_orders || 0) + 1,
        })
        .eq('date', slotDate);

      if (updateError) {
        console.error('Error actualizando pickup_slot:', updateError);
        throw new Error('Error al actualizar disponibilidad');
      }
    }

    // 7. Generar preferencia Mercado Pago si es el método de pago
    let initPoint: string | undefined;

    if (formData.paymentMethod === 'mercadopago') {
      initPoint = await createMercadoPagoPreference(
        cartItems,
        totalInCents,
        orderId,
        formData.shippingEmail
      );

      // Guardar el init_point en la orden (tabla de payments o en la orden misma)
      // Por ahora, lo retornamos al cliente
    }

    return {
      success: true,
      orderId,
      initPoint, // Solo tiene valor si payment_method es 'mercadopago'
    };
  } catch (error) {
    console.error('Error en checkoutOrder:', error);

    const message = error instanceof Error ? error.message : 'Error desconocido en checkout';

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Obtiene el resumen de una orden
 * Útil para mostrar estado en páginas de confirmación
 */
export async function getOrderSummary(orderId: string) {
  try {
    const supabase = await createClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          variant_id,
          quantity,
          price_cents,
          custom_message
        )
      `
      )
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Orden no encontrada');
    }

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Error obteniendo orden:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
