'use client'
import { useEffect, useRef, useState } from 'react'
import { api, ConfigAdmin } from '@/lib/api'
import Header from '@/components/admin/Header'
import {
  Settings, Phone, CreditCard, Building2,
  Copy, Check, ExternalLink, Loader2, Save, MessageCircle
} from 'lucide-react'

const CATALOG_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-brand-400" />
        <h2 className="font-syne font-semibold text-brand-800 text-base">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  )
}

const INPUT = 'w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

export default function ConfiguracionPage() {
  const [form, setForm] = useState<ConfigAdmin>({
    nombre_negocio: '',
    whatsapp_negocio: '',
    alias_pago: '',
    datos_transferencia: '',
    nombre_banco: '',
    nro_cuenta: '',
    titular_cuenta: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const catalogUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    api.configuracion.get()
      .then(setForm)
      .catch(() => setError('No se pudo cargar la configuración'))
      .finally(() => setLoading(false))
  }, [])

  function set(key: keyof ConfigAdmin, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await api.configuracion.update(form)
      setForm(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(catalogUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareWhatsApp() {
    const msg = encodeURIComponent(`¡Mirá nuestro catálogo! ${catalogUrl}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  if (loading) {
    return (
      <>
        <Header title="Configuración" />
        <div className="p-6 max-w-2xl mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-surface-border p-6 animate-pulse">
              <div className="h-4 w-32 bg-gray-100 rounded mb-5" />
              <div className="space-y-3">
                <div className="h-10 bg-gray-100 rounded-lg" />
                <div className="h-10 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Configuración del Negocio" />
      <div className="p-6 max-w-2xl mx-auto space-y-5">

        {/* Datos del negocio */}
        <Section title="Datos del negocio" icon={Settings}>
          <Field label="Nombre del negocio">
            <input
              type="text"
              value={form.nombre_negocio}
              onChange={e => set('nombre_negocio', e.target.value)}
              placeholder="Ej: Distribuidora Limpieza S.A."
              className={INPUT}
            />
          </Field>
          <Field
            label="Número de WhatsApp"
            hint="Formato internacional sin + ni espacios. Ej: 595981000000"
          >
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={form.whatsapp_negocio}
                onChange={e => set('whatsapp_negocio', e.target.value)}
                placeholder="595981000000"
                className={`${INPUT} pl-9`}
              />
            </div>
          </Field>
        </Section>

        {/* Métodos de pago */}
        <Section title="Métodos de pago" icon={CreditCard}>
          <Field
            label="Alias / Billetera electrónica"
            hint="Número o alias para pagos por Tigo Money, Personal Pay, etc."
          >
            <input
              type="text"
              value={form.alias_pago}
              onChange={e => set('alias_pago', e.target.value)}
              placeholder="Ej: 0981-000000 o alias.pago"
              className={INPUT}
            />
          </Field>

          <div className="border-t border-surface-border pt-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
              Datos de transferencia bancaria
            </p>
            <div className="space-y-3">
              <Field label="Banco">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={form.nombre_banco}
                    onChange={e => set('nombre_banco', e.target.value)}
                    placeholder="Ej: Banco Continental"
                    className={`${INPUT} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Número de cuenta">
                <input
                  type="text"
                  value={form.nro_cuenta}
                  onChange={e => set('nro_cuenta', e.target.value)}
                  placeholder="Ej: 0001-01-000000-0"
                  className={INPUT}
                />
              </Field>
              <Field label="Titular de la cuenta">
                <input
                  type="text"
                  value={form.titular_cuenta}
                  onChange={e => set('titular_cuenta', e.target.value)}
                  placeholder="Nombre completo o razón social"
                  className={INPUT}
                />
              </Field>
              <Field
                label="Instrucciones adicionales (opcional)"
                hint="Texto libre que se muestra al cliente al elegir transferencia."
              >
                <textarea
                  rows={3}
                  value={form.datos_transferencia}
                  onChange={e => set('datos_transferencia', e.target.value)}
                  placeholder="Ej: Enviar comprobante al WhatsApp del negocio"
                  className={`${INPUT} resize-none`}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Link del catálogo */}
        <Section title="Catálogo público" icon={ExternalLink}>
          <p className="text-sm text-text-secondary -mt-2">
            Compartí este link con tus clientes para que puedan ver los productos y hacer pedidos.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-brand-50 border border-surface-border rounded-lg px-3 py-2.5 text-sm text-brand-800 font-medium overflow-hidden">
              <span className="truncate">{catalogUrl || 'http://localhost:3000'}</span>
            </div>
            <button
              onClick={copyUrl}
              title="Copiar link"
              className="flex items-center gap-1.5 border border-surface-border bg-white rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir catálogo"
              className="flex items-center gap-1.5 border border-surface-border bg-white rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir
            </a>
          </div>
          <button
            onClick={shareWhatsApp}
            className="flex items-center gap-2 w-full justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Compartir por WhatsApp
          </button>
        </Section>

        {/* Error / success */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Configuración guardada correctamente.
          </div>
        )}

        {/* Guardar */}
        <div className="flex justify-end pb-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-400 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </>
  )
}
