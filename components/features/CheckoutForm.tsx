'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Loader2, AlertCircle, CheckCircle2, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { checkoutOrder } from '@/lib/actions/orders';
import type { CartItem } from '@/lib/store/useCart';
import {
  validateLeadTime,
  getMinimumPickupDateTime,
  formatPickupDateTime,
} from '@/lib/utils/leadTime';

interface CheckoutFormProps {
  cartItems: CartItem[];
  onSuccess?: (orderId: string) => void;
}

interface PickupSlot {
  id: string;
  date: string;
  current_orders: number;
  max_capacity: number;
}

/**
 * CheckoutForm - Formulario de checkout elegante con Guest Checkout
 *
 * Características:
 * - Guest checkout (sin registro obligatorio)
 * - Validación en tiempo real de campos
 * - Máscara de teléfono Argentina (+54 9)
 * - Calendario con deshabilitación de fechas sin cupo
 * - Validación de 48 horas mínimo
 * - Integración con Server Action checkoutOrder
 * - Redirección a Mercado Pago
 */
export function CheckoutForm({ cartItems, onSuccess }: CheckoutFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickupSlots, setPickupSlots] = useState<PickupSlot[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<string | null>(null);

  // Load pickup slots on mount
  useEffect(() => {
    const loadPickupSlots = async () => {
      try {
        const response = await fetch('/api/pickup-slots');
        if (response.ok) {
          const data = await response.json();
          setPickupSlots(data);
        }
      } catch (error) {
        console.error('Error loading pickup slots:', error);
      }
    };

    loadPickupSlots();
  }, []);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Argentina format: +54 9 __ ____-____ or 02962-xxxxxx or xxxxxxxxxx
    const phoneRegex = /^(\+?54\s?9\s?|\+?54\s?|0)?[0-9]{2,4}[-\s]?[0-9]{3,4}[-\s]?[0-9]{3,4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido (ej: +54 9 3816 123456)';
    }

    // Date
    if (!selectedDate) {
      newErrors.date = 'Debes seleccionar una fecha de retiro';
    } else {
      try {
        validateLeadTime(selectedDate.toISOString());
      } catch (error) {
        newErrors.date = error instanceof Error ? error.message : 'Fecha inválida';
      }
    }

    // Time
    if (!selectedTime) {
      newErrors.time = 'Debes seleccionar un horario';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      if (name === 'phone') {
        // Apply phone mask for Argentina
        const cleaned = value.replace(/\D/g, '');
        let masked = '';

        if (cleaned.startsWith('54')) {
          // +54 format
          masked = '+54 9 ' + cleaned.slice(2);
        } else if (cleaned.startsWith('9')) {
          // 9 format (without 54)
          masked = '+54 9 ' + cleaned;
        } else {
          masked = cleaned;
        }

        // Limit length
        masked = masked.slice(0, 20);
        setFormData((prev) => ({ ...prev, [name]: masked }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }

      // Clear error on change
      if (touched[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    },
    [touched]
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const isDateDisabled = (date: Date): boolean => {
    // Check if less than 48 hours away
    const minimumDate = getMinimumPickupDateTime();
    if (isBefore(date, minimumDate)) {
      return true;
    }

    // Check if slot is available
    const dateStr = format(date, 'yyyy-MM-dd');
    const slot = pickupSlots.find((s) => s.date === dateStr);

    // If no slot exists or is full, disable
    return !slot || slot.current_orders >= slot.max_capacity;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);

    // Clear date error
    setErrors((prev) => ({ ...prev, date: '' }));

    // Scroll to time selection
    setTimeout(() => {
      document.getElementById('time-selector')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccess(null);
    setErrors({});

    try {
      // Format pickup datetime
      if (!selectedDate || !selectedTime) {
        throw new Error('Fecha y horario inválidos');
      }

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const pickupDateTime = new Date(selectedDate);
      pickupDateTime.setHours(hours, minutes, 0, 0);

      // Call checkoutOrder Server Action
      const result = await checkoutOrder(
        {
          shippingName: formData.fullName.trim(),
          shippingEmail: formData.email.trim(),
          shippingPhone: formData.phone.trim(),
          pickupDate: format(selectedDate, 'yyyy-MM-dd'),
          pickupTime: selectedTime,
          paymentMethod: 'mercadopago',
        },
        cartItems
      );

      if (!result.success) {
        setErrors({ submit: result.error || 'Error procesando el pedido' });
        return;
      }

      // Success - redirect to Mercado Pago
      if (result.initPoint) {
        setSuccess('Redirigiendo a Mercado Pago...');

        // Store order ID for confirmation page
        sessionStorage.setItem('lastOrderId', result.orderId || '');

        // Redirect after short delay for UX
        setTimeout(() => {
          const url = result.initPoint;
          if (url) {
            window.location.href = url;
          }
        }, 800);

        onSuccess?.(result.orderId || '');
      } else {
        setErrors({ submit: 'No se pudo generar el enlace de pago' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setErrors({ submit: errorMsg });
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0);
  const totalAmountARS = (totalAmount / 100).toFixed(2);

  const minimumDate = getMinimumPickupDateTime();
  const nextThirtyDays = addDays(minimumDate, 30);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-neutral-200 bg-white shadow-sm">
        <CardHeader className="border-b border-neutral-100 pb-6">
          <CardTitle className="text-2xl font-light text-neutral-900">Confirmar Pedido</CardTitle>
          <CardDescription className="text-neutral-600 mt-1">
            Completa tus datos y selecciona un horario de retiro
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          {/* Error Alert */}
          {errors.submit && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section: Personal Information */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Información Personal
              </h3>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm text-neutral-700">
                  Nombre Completo
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="María García López"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  className={`border-neutral-200 ${
                    errors.fullName && touched.fullName ? 'border-red-300 focus:ring-red-500' : ''
                  }`}
                />
                {errors.fullName && touched.fullName && (
                  <p className="text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-neutral-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="maria@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  className={`border-neutral-200 ${
                    errors.email && touched.email ? 'border-red-300 focus:ring-red-500' : ''
                  }`}
                />
                {errors.email && touched.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm text-neutral-700">
                  Teléfono
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+54 9 3816 123456"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    className={`pl-10 border-neutral-200 ${
                      errors.phone && touched.phone ? 'border-red-300 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {errors.phone && touched.phone && (
                  <p className="text-xs text-red-600">{errors.phone}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">Formato: +54 9 XXXX XXXXXX</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200" />

            {/* Section: Pickup Selection */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Horario de Retiro
              </h3>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="text-sm text-neutral-700">Fecha de Retiro</Label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-neutral-200 rounded-lg text-left flex items-center justify-between transition-colors ${
                      selectedDate
                        ? 'bg-neutral-50 border-neutral-300'
                        : 'bg-white hover:border-neutral-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className={selectedDate ? 'text-neutral-900' : 'text-neutral-500'}>
                      {selectedDate
                        ? formatPickupDateTime(selectedDate.toISOString()).split(' ')[0]
                        : 'Selecciona una fecha'}
                    </span>
                    <Calendar className="h-4 w-4 text-neutral-400" />
                  </button>

                  {/* Calendar Dropdown */}
                  {showCalendar && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
                      <div className="space-y-3">
                        {/* Month/Year Header */}
                        <div className="text-center">
                          <p className="text-sm font-medium text-neutral-900">
                            {format(minimumDate, 'MMMM yyyy', { locale: es })}
                          </p>
                        </div>

                        {/* Day Grid */}
                        <div className="grid grid-cols-7 gap-2">
                          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-neutral-500">
                              {day}
                            </div>
                          ))}

                          {/* Generate calendar days */}
                          {Array.from({ length: 30 }).map((_, i) => {
                            const date = addDays(minimumDate, i);
                            const isDisabled = isDateDisabled(date);
                            const isSelected =
                              selectedDate &&
                              format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => !isDisabled && handleDateSelect(date)}
                                disabled={isDisabled}
                                className={`
                                  py-2 px-1 rounded text-sm font-medium transition-colors
                                  ${
                                    isSelected
                                      ? 'bg-neutral-900 text-white'
                                      : isDisabled
                                        ? 'text-neutral-300 cursor-not-allowed'
                                        : 'text-neutral-700 hover:bg-neutral-100'
                                  }
                                `}
                              >
                                {format(date, 'd')}
                              </button>
                            );
                          })}
                        </div>

                        {/* Info Text */}
                        <p className="text-xs text-neutral-500 text-center">
                          Mínimo 48 horas de antelación
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {errors.date && (
                  <p className="text-xs text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div id="time-selector" className="space-y-2">
                  <Label className="text-sm text-neutral-700">Horario de Retiro</Label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      '10:00',
                      '11:00',
                      '12:00',
                      '14:00',
                      '15:00',
                      '16:00',
                      '17:00',
                      '18:00',
                      '19:00',
                    ].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          setSelectedTime(time);
                          setErrors((prev) => ({ ...prev, time: '' }));
                        }}
                        disabled={isLoading}
                        className={`
                          py-2 px-3 rounded-lg text-sm font-medium transition-colors
                          border border-neutral-200
                          ${
                            selectedTime === time
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-700 hover:border-neutral-300'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  {errors.time && (
                    <p className="text-xs text-red-600">{errors.time}</p>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200" />

            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Resumen del Pedido
              </h3>

              <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">{cartItems.length} artículo(s)</span>
                  <span className="font-medium text-neutral-900">${totalAmountARS}</span>
                </div>

                {selectedDate && selectedTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Retiro</span>
                    <span className="font-medium text-neutral-900">
                      {formatPickupDateTime(selectedDate.toISOString())} a las {selectedTime}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !cartItems.length}
              size="lg"
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>Continuar al Pago ({totalAmountARS} ARS)</> 
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center text-neutral-500">
              Al continuar, aceptas nuestras{' '}
              <a href="/terms" className="underline hover:text-neutral-700">
                condiciones de compra
              </a>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Decorative footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500">
          ✦ Tortas artesanales hechas con amor ✦
        </p>
      </div>
    </div>
  );
}
