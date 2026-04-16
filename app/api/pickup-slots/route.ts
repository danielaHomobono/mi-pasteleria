import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/pickup-slots
 * 
 * Obtiene todos los slots de retiro disponibles para los próximos 30 días
 * 
 * Response:
 * ```json
 * [
 *   {
 *     "id": "uuid",
 *     "date": "2026-04-18",
 *     "current_orders": 5,
 *     "max_capacity": 10
 *   },
 *   ...
 * ]
 * ```
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Obtener slots de los próximos 30 días
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data, error } = await supabase
      .from('pickup_slots')
      .select('id, date, current_orders, max_capacity')
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching pickup slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pickup slots' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/pickup-slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
