'use client'

import { useEffect, useState } from 'react'
import { api, Categoria } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, Save, Loader2, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/admin/Header'

interface ProductoForm {
  nombre: string
  descripcion: string
  sku: string
  categoria_id: number | ''
  precio_venta: number | ''
  precio_costo: number | ''
  stock_actual: number
  stock_minimo: number
  unidad_medida: string
  stop_venta: boolean
}

const UNIDADES = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'litro', label: 'Litro' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'caja', label: 'Caja' },
]

const INITIAL_FORM: ProductoForm = {
  nombre: '',
  descripcion: '',
  sku: '',
  categoria_id: '',
  precio_venta: '',
  precio_costo: '',
  stock_actual: 0,
  stock_minimo: 5,
  unidad_medida: 'unidad',
  stop_venta: false,
}

export default function NuevoProductoPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<ProductoForm>(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProductoForm, string>>>({})

  useEffect(() => {
    api.categorias.list(true).then(setCategorias).catch(() => {})
  }, [])

  const setField = <K extends keyof ProductoForm>(key: K, value: ProductoForm[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors(e => ({ ...e, [key]: undefined }))
    }
  }

  const validate = (): boolean => {
    const errors: Partial<Record<keyof ProductoForm, string>> = {}
    if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido.'
    if (!form.categoria_id) errors.categoria_id = 'Seleccioná una categoría.'
    if (form.precio_venta === '' || Number(form.precio_venta) <= 0)
      errors.precio_venta = 'El precio de venta debe ser mayor a 0.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      await api.productos.create({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        sku: form.sku.trim() || undefined,
        categoria_id: form.categoria_id as number,
        precio_venta: Number(form.precio_venta),
        precio_costo: form.precio_costo !== '' ? Number(form.precio_costo) : undefined,
        stock_actual: form.stock_actual,
        stock_minimo: form.stock_minimo,
        unidad_medida: form.unidad_medida,
        stop_venta: form.stop_venta,
      })
      setSuccess(true)
      router.push('/productos')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar el producto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-14 min-h-screen bg-surface-bg">
      <Header title="Nuevo Producto" />

      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.push('/productos')}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Productos
          </button>
          <span className="text-text-muted">/</span>
          <span className="text-sm font-medium text-text-primary">Nuevo Producto</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">

            <div className="bg-white rounded-xl border border-surface-border p-6">
              <div className="flex items-center gap-2 mb-5">
                <Package className="w-4 h-4 text-brand-400" />
                <h2 className="font-syne font-semibold text-brand-800 text-base">
                  Información básica
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setField('nombre', e.target.value)}
                    placeholder="Ej: Detergente líquido concentrado"
                    className={cn(
                      'w-full px-3 py-2.5 border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
                      fieldErrors.nombre ? 'border-red-400' : 'border-surface-border',
                    )}
                  />
                  {fieldErrors.nombre && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={form.descripcion}
                    onChange={e => setField('descripcion', e.target.value)}
                    placeholder="Descripción del producto..."
                    className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={e => setField('sku', e.target.value)}
                      placeholder="Ej: DET-001"
                      className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.categoria_id}
                      onChange={e => setField('categoria_id', e.target.value ? Number(e.target.value) : '')}
                      className={cn(
                        'w-full px-3 py-2.5 border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white appearance-none',
                        fieldErrors.categoria_id ? 'border-red-400' : 'border-surface-border',
                      )}
                    >
                      <option value="">Seleccioná una categoría</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.categoria_id && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.categoria_id}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Unidad de medida
                  </label>
                  <select
                    value={form.unidad_medida}
                    onChange={e => setField('unidad_medida', e.target.value)}
                    className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white appearance-none"
                  >
                    {UNIDADES.map(u => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-surface-border p-6">
              <h2 className="font-syne font-semibold text-brand-800 text-base mb-5">Precios</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Precio de Venta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.precio_venta}
                    onChange={e =>
                      setField('precio_venta', e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="0"
                    className={cn(
                      'w-full px-3 py-2.5 border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
                      fieldErrors.precio_venta ? 'border-red-400' : 'border-surface-border',
                    )}
                  />
                  {fieldErrors.precio_venta && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.precio_venta}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Precio de Costo{' '}
                    <span className="text-text-muted font-normal">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.precio_costo}
                    onChange={e =>
                      setField('precio_costo', e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  />
                </div>
              </div>

              <p className="text-xs text-text-muted mt-3">
                Los precios se expresan en Guaraníes (Gs.)
              </p>
            </div>

            <div className="bg-white rounded-xl border border-surface-border p-6">
              <h2 className="font-syne font-semibold text-brand-800 text-base mb-5">Stock</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock_actual}
                    onChange={e => setField('stock_actual', Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock_minimo}
                    onChange={e => setField('stock_minimo', Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Cantidad mínima antes de recibir alerta
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-surface-border p-6">
              <h2 className="font-syne font-semibold text-brand-800 text-base mb-5">
                Configuración
              </h2>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.stop_venta}
                    onChange={e => setField('stop_venta', e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors',
                      form.stop_venta ? 'bg-red-500' : 'bg-gray-200 group-hover:bg-gray-300',
                    )}
                  />
                  <div
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      form.stop_venta ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Pausar venta (Stop de venta)
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Cuando está activo, el producto NO aparecerá en el catálogo público.
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
                Producto guardado correctamente. Redirigiendo...
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pb-2">
              <button
                type="button"
                onClick={() => router.push('/productos')}
                className="px-5 py-2.5 border border-brand-400 text-brand-800 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-brand-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar Producto
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
