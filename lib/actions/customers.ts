'use server';

import { createClient } from '@/lib/supabase/server';
import { hash } from 'bcryptjs';

/**
 * Crea una cuenta de usuario a partir de datos de un pedido
 * Permite al cliente registrarse sin mencionar la palabra "registro"
 *
 * @param email - Email del cliente (de la orden)
 * @param password - Contraseña a guardar
 * @returns { success, userId, error? }
 */
export async function createGuestAccount(email: string, password: string) {
  try {
    // Validaciones básicas
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const supabase = await createClient();

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user in auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      },
    });

    if (authError || !data.user) {
      throw new Error(authError?.message || 'No se pudo crear la cuenta');
    }

    return {
      success: true,
      userId: data.user.id,
    };
  } catch (error) {
    console.error('Error creating guest account:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Recupera datos de un cliente de una orden anterior
 * Para usar en siguientes compras (Acceso Rápido)
 *
 * @param email - Email del cliente
 * @returns { success, customer?, error? }
 */
export async function getCustomerFromEmail(email: string) {
  try {
    if (!email) {
      throw new Error('Email requerido');
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      };
    }

    return {
      success: true,
      customer: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    };
  } catch (error) {
    console.error('Error getting customer:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
