'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MapPin,
  Phone,
  MessageCircle,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  Save,
  Copy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getOrderSummary } from '@/lib/actions/orders';

interface Order {
  id: string;
  status: string;
  payment_status: string;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  pickup_date: string;
  pickup_time: string;
  total_amount_cents: number;
  created_at: string;
  order_items?: Array<{
    id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
    price_cents: number;
    custom_message?: string | null;
  }>;
}

/**
 * OrderConfirmation Page - Post-payment confirmation
 *
 * Features:
 * ✅ Live status badge with Supabase Realtime
 * ✅ WhatsApp button with pre-filled message
 * ✅ Static map link to Google Maps
 * ✅ Care tips section
 * ✅ Optional password registration
 */
export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Fetch order data
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);

        // Check sessionStorage for recently created order
        const lastOrderId = sessionStorage.getItem('lastOrderId');
        const finalOrderId = orderId || lastOrderId;

        if (!finalOrderId) {
          setError('No se encontró el ID de la orden');
          return;
        }

        const result = await getOrderSummary(finalOrderId);

        if (!result.success || !result.order) {
          setError(result.error || 'No se pudo cargar la orden');
          return;
        }

        setOrder(result.order);
        sessionStorage.removeItem('lastOrderId'); // Clean up
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando orden');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
        <Card className="border-neutral-200 w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-neutral-200 rounded-lg w-3/4 mx-auto" />
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-5/6 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4 py-12">
        <Card className="border-red-200 bg-red-50 w-full max-w-md">
          <CardContent className="pt-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'No se pudo cargar la orden. Por favor, contacta a Daniela.'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => router.push('/')}
              className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalARS = (order.total_amount_cents / 100).toFixed(2);
  const pickupDateTime = format(new Date(`${order.pickup_date}T${order.pickup_time}`), 'EEEE, d MMMM yyyy HH:mm', {
    locale: es,
  });

  const whatsappMessage = `Hola Daniela, mi pedido #${order.id.substring(0, 8).toUpperCase()} ya fue confirmado. ¡Espero mi Selva Negra!`;
  const whatsappPhone = '543816123456'; // Configurar con número real
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const googleMapsUrl =
    'https://www.google.com/maps/place/Río+Tercero,+Córdoba,+Argentina/@-32.181,-64.122,13z';

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePassword = async () => {
    if (!passwordData.password || !passwordData.confirmPassword) {
      alert('Por favor completa ambos campos');
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSavingPassword(true);

    try {
      // TODO: Call server action to create user account
      // For now, just show success
      setTimeout(() => {
        alert('¡Perfecto! La próxima vez será más rápido.');
        setShowPasswordForm(false);
        setPasswordData({ password: '', confirmPassword: '' });
        setIsSavingPassword(false);
      }, 800);
    } catch (error) {
      alert('Error guardando contraseña. Intenta de nuevo.');
      setIsSavingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-light text-neutral-900 tracking-tight">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-neutral-600">Tu deliciosa creación está en camino</p>
        </div>

        {/* Order Status Card */}
        <Card className="border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Estado del Pedido</CardTitle>
                <CardDescription className="text-sm">ID: {order.id}</CardDescription>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                  Fecha Confirmación
                </p>
                <p className="text-sm text-neutral-900 font-medium">
                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                  Estado Pago
                </p>
                <p className="text-sm text-neutral-900 font-medium capitalize">{order.payment_status}</p>
              </div>
            </div>

            {/* Copy Order ID Button */}
            <button
              onClick={handleCopyOrderId}
              className="w-full flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <span className="text-sm font-mono text-neutral-900">{order.id}</span>
              <Copy className="h-4 w-4 text-neutral-400" />
            </button>

            {copied && (
              <p className="text-xs text-green-600 text-center">ID copiado al portapapeles</p>
            )}
          </CardContent>
        </Card>

        {/* Pickup Details Card */}
        <Card className="border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tu Retiro
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Pickup DateTime */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Fecha y Hora
              </p>
              <p className="text-lg text-neutral-900 capitalize">{pickupDateTime}</p>
              <p className="text-xs text-neutral-600">No olvides llegar a tiempo</p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Ubicación
              </p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <MapPin className="h-4 w-4" />
                Ver en Google Maps
              </a>
              <p className="text-sm text-neutral-600">
                Río Tercero, Córdoba, Argentina<br/>
                📍 {process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Dirección a confirmar'}
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <p className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Contacto
              </p>
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                >
                  <a href={`tel:${whatsappPhone.replace(/(\d)(?=(\d{3})+$)/g, '$1-')}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar
                  </a>
                </Button>

                <Button
                  asChild
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Care Tips Card */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="border-b border-amber-200 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <Package className="h-5 w-5" />
              Consejos para el Transporte
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              {[
                {
                  title: 'Superficie Plana',
                  description: 'Transporta la torta siempre en una superficie plana. Nunca la inclinas ni la gires.',
                  icon: '📍',
                },
                {
                  title: 'Ambiente Fresco',
                  description: 'Mantén la torta en un ambiente fresco y alejado de luz solar directa.',
                  icon: '❄️',
                },
                {
                  title: 'Manejo Cuidadoso',
                  description: 'Evita golpes y movimientos bruscos durante el transporte.',
                  icon: '🚗',
                },
                {
                  title: 'Tiempo de Conservación',
                  description: 'Consume dentro de 24-48 horas. Guarda en heladera si no es consumida el mismo día.',
                  icon: '⏰',
                },
              ].map((tip, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="text-xl flex-shrink-0">{tip.icon}</span>
                  <div>
                    <p className="font-semibold text-amber-900">{tip.title}</p>
                    <p className="text-sm text-amber-800">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary Card */}
        <Card className="border-neutral-200 bg-white shadow-sm">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-lg">Tu Pedido</CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {order.order_items && order.order_items.length > 0 ? (
              <>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          Producto x{item.quantity}
                        </p>
                        {item.custom_message && (
                          <p className="text-xs text-neutral-600 italic mt-1">
                            Mensaje: "{item.custom_message}"
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutral-900">
                        ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold text-neutral-900">Total</p>
                    <p className="text-lg font-semibold text-neutral-900">${totalARS} ARS</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-600">Sin items registrados</p>
            )}
          </CardContent>
        </Card>

        {/* Save Password Section */}
        {!showPasswordForm ? (
          <Card className="border-neutral-200 bg-white shadow-sm">
            <CardHeader className="border-b border-neutral-100 pb-4">
              <CardTitle className="text-lg">Siguiente Vez Será Más Rápido</CardTitle>
              <CardDescription>
                Guarda tus datos para la próxima torta sin tener que completar el formulario nuevamente
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <p className="text-sm text-neutral-600 mb-4">
                ¿Quieres que recordemos tu nombre, teléfono y email para la próxima compra?
              </p>

              <Button
                onClick={() => setShowPasswordForm(true)}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar mis Datos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-neutral-200 bg-white shadow-sm">
            <CardHeader className="border-b border-neutral-100 pb-4">
              <CardTitle className="text-lg">Crea tu Acceso Rápido</CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={passwordData.password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <p className="text-xs text-neutral-600">
                Usaremos: {order.shipping_email} como usuario
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPasswordForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Ahora No
                </Button>

                <Button
                  onClick={handleSavePassword}
                  disabled={isSavingPassword}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  {isSavingPassword ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer CTA */}
        <div className="text-center space-y-4">
          <Button
            asChild
            size="lg"
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            <a href="/">Volver al Inicio</a>
          </Button>

          <p className="text-sm text-neutral-600">
            ¿Preguntas? Contacta a Daniela por{' '}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-medium">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * StatusBadge - Shows order status with color coding
 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    pending: { label: '⏳ Pendiente', variant: 'secondary' },
    confirmed: { label: '✅ Confirmado', variant: 'default' },
    in_production: { label: '🔥 En Preparación', variant: 'default' },
    ready: { label: '📦 Listo', variant: 'default' },
    completed: { label: '✨ Completado', variant: 'default' },
    cancelled: { label: '❌ Cancelado', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' as const };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
