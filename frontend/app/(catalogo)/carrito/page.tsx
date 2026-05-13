'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  MessageCircle,
  Check,
  Loader2,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { useCart, CartItem } from '@/components/catalogo/CartProvider';
import { formatGs, cn } from '@/lib/utils';

type MetodoPago = 'efectivo' | 'transferencia' | 'alias' | 'otro';
type Step = 'carrito' | 'datos' | 'confirmacion';

interface FormState {
  nombre: string;
  telefono: string;
  metodo_pago: MetodoPago;
  notas: string;
}

interface VentaCreada {
  id: number;
  numero_venta: string;
  whatsapp_link: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const STEPS: { key: Step; label: string }[] = [
  { key: 'carrito', label: 'Carrito' },
  { key: 'datos', label: 'Tus datos' },
  { key: 'confirmacion', label: 'Confirmación' },
];

const STEP_INDEX: Record<Step, number> = {
  carrito: 0,
  datos: 1,
  confirmacion: 2,
};

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    nombre: '',
    telefono: '',
    metodo_pago: 'efectivo',
    notas: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('carrito');
  const [ventaCreada, setVentaCreada] = useState<VentaCreada | null>(null);
  const [aliasPago, setAliasPago] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_URL}/config`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.alias_pago) setAliasPago(data.alias_pago);
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce(
    (acc, item) => acc + item.precio_venta * item.cantidad,
    0
  );
  const total = subtotal;

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const next = item.cantidad + delta;
    if (next < 1) {
      removeItem(item.producto_id);
    } else {
      updateQuantity(item.producto_id, next);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
    if (!form.telefono.trim()) errors.telefono = 'El teléfono es obligatorio.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const ventaRes = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: form.nombre,
          cliente_telefono: form.telefono,
          metodo_pago: form.metodo_pago,
          descuento: 0,
          notas: form.notas || null,
          origen: 'catalogo',
          items: items.map((i) => ({
            producto_id: i.producto_id,
            cantidad: i.cantidad,
          })),
        }),
      });
      if (!ventaRes.ok) {
        const errData = await ventaRes.json().catch(() => ({}));
        throw new Error(errData?.detail ?? 'Error al crear la venta.');
      }
      const venta = await ventaRes.json();

      const comprobanteRes = await fetch(
        `${API_URL}/ventas/${venta.id}/comprobante`
      );
      let whatsapp_link = '';
      if (comprobanteRes.ok) {
        const comprobante = await comprobanteRes.json();
        whatsapp_link = comprobante?.whatsapp_link ?? '';
      }

      setVentaCreada({ id: venta.id, numero_venta: venta.numero_venta, whatsapp_link });
      clearCart();
      setStep('confirmacion');
      if (whatsapp_link) window.open(whatsapp_link, '_blank');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step === 'carrito') {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4 text-center">
        <ShoppingCart className="w-20 h-20 text-brand-200 mb-6" />
        <h2 className="font-syne font-semibold text-2xl text-text-primary mb-2">
          Tu carrito está vacío
        </h2>
        <p className="text-text-secondary mb-6 text-sm">
          Todavía no agregaste ningún producto.
        </p>
        <Link
          href="/"
          className="bg-brand-400 text-white rounded-lg px-6 py-3 font-medium hover:bg-brand-700 transition-colors"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bg">
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand-800 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Seguir comprando
        </Link>

        <div className="flex items-center justify-between mb-6">
          {STEPS.map((s, idx) => {
            const active = STEP_INDEX[step] === idx;
            const done = STEP_INDEX[step] > idx;
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                      active
                        ? 'bg-brand-400 text-white'
                        : done
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-text-muted'
                    )}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      active ? 'text-brand-800' : 'text-text-muted'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-2 mb-4 transition-colors',
                      STEP_INDEX[step] > idx ? 'bg-green-400' : 'bg-surface-border'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {step === 'carrito' && (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.producto_id}
                className="bg-white rounded-xl border border-surface-border p-3 flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-50 flex-shrink-0 flex items-center justify-center">
                  {item.imagen_url ? (
                    <NextImage
                      src={item.imagen_url}
                      alt={item.nombre}
                      width={56}
                      height={56}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <span className="text-brand-400 font-syne font-semibold text-xl">
                      {item.nombre.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-text-primary truncate">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatGs(item.precio_venta)} c/u
                  </p>
                  <p className="font-syne font-semibold text-brand-800 text-sm">
                    {formatGs(item.precio_venta * item.cantidad)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleQuantityChange(item, -1)}
                    className="w-7 h-7 border border-surface-border rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-3 h-3 text-text-secondary" />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-medium text-text-primary">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item, 1)}
                    className="w-7 h-7 border border-surface-border rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-text-secondary" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.producto_id)}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="bg-white rounded-xl border border-surface-border p-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>
                  Subtotal ({items.reduce((a, i) => a + i.cantidad, 0)} items)
                </span>
                <span>{formatGs(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-text-muted">
                <span>Descuento</span>
                <span>{formatGs(0)}</span>
              </div>
              <div className="border-t border-surface-border pt-3 flex items-center justify-between">
                <span className="font-medium text-text-primary">Total</span>
                <span className="font-syne font-semibold text-2xl text-brand-800">
                  {formatGs(total)}
                </span>
              </div>
              <button
                onClick={() => setStep('datos')}
                className="w-full bg-brand-400 text-white rounded-lg py-3 font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 mt-1"
              >
                Continuar con mi pedido
                <span className="text-lg leading-none">→</span>
              </button>
            </div>
          </div>
        )}

        {step === 'datos' && (
          <div className="space-y-4">
            <h2 className="font-syne font-semibold text-xl text-text-primary">
              ¿A quién le enviamos el pedido?
            </h2>

            <div className="bg-white rounded-xl border border-surface-border p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary block">
                  Nombre completo <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, nombre: e.target.value }));
                    if (fieldErrors.nombre)
                      setFieldErrors((fe) => ({ ...fe, nombre: '' }));
                  }}
                  placeholder="Tu nombre"
                  className={cn(
                    'w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors',
                    fieldErrors.nombre
                      ? 'border-status-danger focus:border-status-danger'
                      : 'border-surface-border focus:border-brand-400'
                  )}
                />
                {fieldErrors.nombre && (
                  <p className="text-xs text-status-danger flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.nombre}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary block">
                  Teléfono <span className="text-status-danger">*</span>
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, telefono: e.target.value }));
                    if (fieldErrors.telefono)
                      setFieldErrors((fe) => ({ ...fe, telefono: '' }));
                  }}
                  placeholder="0991 000 000"
                  className={cn(
                    'w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors',
                    fieldErrors.telefono
                      ? 'border-status-danger focus:border-status-danger'
                      : 'border-surface-border focus:border-brand-400'
                  )}
                />
                {fieldErrors.telefono && (
                  <p className="text-xs text-status-danger flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.telefono}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary block">
                  Método de pago
                </label>
                <div className="space-y-2">
                  {(
                    [
                      {
                        value: 'efectivo' as MetodoPago,
                        label: 'Efectivo contra entrega',
                        description: 'Pagás al recibir',
                        Icon: Banknote,
                      },
                      {
                        value: 'transferencia' as MetodoPago,
                        label: 'Transferencia bancaria',
                        description: 'Transferí y enviá comprobante',
                        Icon: CreditCard,
                      },
                      {
                        value: 'alias' as MetodoPago,
                        label: 'Alias / Billetera',
                        description: 'Pagá por billetera virtual',
                        Icon: Smartphone,
                      },
                    ] as const
                  ).map(({ value, label, description, Icon }) => {
                    const active = form.metodo_pago === value;
                    return (
                      <div
                        key={value}
                        onClick={() =>
                          setForm((f) => ({ ...f, metodo_pago: value }))
                        }
                        className={cn(
                          'border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3',
                          active
                            ? 'border-brand-400 bg-brand-50'
                            : 'border-surface-border bg-white hover:border-brand-200'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5 flex-shrink-0',
                            active ? 'text-brand-400' : 'text-text-muted'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              active ? 'text-brand-800' : 'text-text-primary'
                            )}
                          >
                            {label}
                          </p>
                          <p className="text-xs text-text-muted">{description}</p>
                        </div>
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 flex-shrink-0',
                            active
                              ? 'border-brand-400 bg-brand-400'
                              : 'border-surface-border'
                          )}
                        >
                          {active && (
                            <Check className="w-3 h-3 text-white m-px" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {form.metodo_pago === 'alias' && aliasPago && (
                  <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-1">
                    <p className="text-sm font-semibold text-brand-800">
                      Alias de pago: {aliasPago}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Realizá la transferencia y enviá la captura de pantalla junto con tu pedido.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary block">
                  Notas <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.notas}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notas: e.target.value }))
                  }
                  placeholder="Indicaciones especiales, dirección de entrega, etc."
                  className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-status-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-status-danger">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('carrito')}
                disabled={loading}
                className="flex-1 border border-brand-400 text-brand-800 rounded-lg py-3 font-medium hover:bg-brand-50 transition-colors text-sm disabled:opacity-50"
              >
                ← Volver al carrito
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-brand-400 text-white rounded-lg py-3 font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                {loading ? 'Enviando...' : 'Enviar mi pedido →'}
              </button>
            </div>
          </div>
        )}

        {step === 'confirmacion' && ventaCreada && (
          <div className="flex flex-col items-center text-center gap-5 py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="font-syne font-semibold text-2xl text-text-primary">
                ¡Pedido enviado!
              </h2>
              <p className="text-text-secondary text-sm">
                Tu pedido N°{' '}
                <span className="font-semibold text-brand-800">
                  {ventaCreada.numero_venta}
                </span>{' '}
                fue registrado correctamente.
              </p>
              <p className="text-text-muted text-sm">
                Se abrió WhatsApp con el resumen de tu pedido. Si no se abrió
                automáticamente:
              </p>
            </div>
            <button
              onClick={() => window.open(ventaCreada.whatsapp_link, '_blank')}
              className="bg-green-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
            </button>
            <Link
              href="/"
              className="text-sm text-brand-400 hover:text-brand-700 underline underline-offset-2 transition-colors"
            >
              Volver a la tienda
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
