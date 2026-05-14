'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api, Producto, Categoria } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, Save, Loader2, ImagePlus, X } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/admin/Header'

const UNIDADES = ['unidad', 'litro', 'kg', 'paquete', 'caja', 'metro', 'par']

export default function EditarProductoPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    sku: '',
    categoria_id: 0,
    precio_venta: '',
    precio_costo: '',
    stock_actual: '0',
    stock_minimo: '5',
    unidad_medida: 'unidad',
    stop_venta: false,
    activo: true,
  })

  useEffect(() => {
    Promise.all([
      api.categorias.list(true),
      api.productos.get(id),
    ]).then(([cats, prod]) => {
      setCategorias(cats)
      setCurrentImageUrl(prod.imagen_url ?? '')
      setForm({
        nombre: prod.nombre,
        descripcion: prod.descripcion ?? '',
        sku: prod.sku ?? '',
        categoria_id: prod.categoria_id,
        precio_venta: String(prod.precio_venta),
        precio_costo: prod.precio_costo ? String(prod.precio_costo) : '',
        stock_actual: String(prod.stock_actual),
        stock_minimo: String(prod.stock_minimo),
        unidad_medida: prod.unidad_medida,
        stop_venta: prod.stop_venta,
        activo: prod.activo,
      })
    }).catch(() => setError('No se pudo cargar el producto'))
      .finally(() => setLoading(false))
  }, [id])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeNewImage() {
    setImageFile(null)
    setImagePreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!form.categoria_id) errs.categoria_id = 'Seleccioná una categoría'
    if (!form.precio_venta || Number(form.precio_venta) <= 0) errs.precio_venta = 'El precio debe ser mayor a 0'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setError('')
    try {
      await api.productos.update(id, {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        sku: form.sku || undefined,
        categoria_id: Number(form.categoria_id),
        precio_venta: Number(form.precio_venta),
        precio_costo: form.precio_costo ? Number(form.precio_costo) : undefined,
        stock_minimo: Number(form.stock_minimo),
        unidad_medida: form.unidad_medida,
        stop_venta: form.stop_venta,
        activo: form.activo,
      })
      if (imageFile) {
        await api.productos.uploadImage(id, imageFile)
      }
      router.push('/productos')
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const field = (name: string) => ({
    className: cn(
      'w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400',
      fieldErrors[name] ? 'border-red-400' : 'border-surface-border'
    ),
  })

  const displayImage = imagePreview || currentImageUrl

  return (
    <>
      <Header title="Editar Producto" />
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/productos" className="hover:text-brand-800 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Productos
          </Link>
          <span>/</span>
          <span className="text-text-primary font-medium">Editar Producto</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-surface-border p-6 space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}

            {/* Imagen */}
            <div className="bg-white rounded-xl border border-surface-border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-brand-400" />
                <h2 className="font-syne font-semibold text-brand-800 text-sm uppercase tracking-wide">Imagen del producto</h2>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {displayImage ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-brand-50 border border-surface-border">
                  <img src={displayImage} alt="Vista previa" className="w-full h-full object-contain" />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeNewImage}
                      className="absolute top-2 right-2 bg-white border border-surface-border rounded-lg p-1.5 shadow hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-surface-border rounded-xl p-8 flex flex-col items-center gap-3 text-text-muted hover:border-brand-400 hover:text-brand-400 transition-colors"
                >
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-sm font-medium">Hacer clic para subir imagen</span>
                  <span className="text-xs">PNG, JPG o WEBP — máx. 5 MB</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-brand-400 hover:text-brand-700 font-medium transition-colors"
              >
                {displayImage ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
            </div>

            {/* Información básica */}
            <div className="bg-white rounded-xl border border-surface-border p-5 space-y-4">
              <h2 className="font-syne font-semibold text-brand-800 text-sm uppercase tracking-wide">Información básica</h2>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} {...field('nombre')} />
                {fieldErrors.nombre && <p className="text-red-600 text-xs mt-1">{fieldErrors.nombre}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Descripción</label>
                <textarea rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">SKU</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} {...field('sku')} placeholder="Ej: DET-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Unidad de medida</label>
                  <select value={form.unidad_medida} onChange={e => setForm(f => ({ ...f, unidad_medida: e.target.value }))}
                    className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Categoría *</label>
                <select value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: Number(e.target.value) }))}
                  className={cn('w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400',
                    fieldErrors.categoria_id ? 'border-red-400' : 'border-surface-border')}>
                  <option value={0}>Seleccionar categoría…</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {fieldErrors.categoria_id && <p className="text-red-600 text-xs mt-1">{fieldErrors.categoria_id}</p>}
              </div>
            </div>

            {/* Precios */}
            <div className="bg-white rounded-xl border border-surface-border p-5 space-y-4">
              <h2 className="font-syne font-semibold text-brand-800 text-sm uppercase tracking-wide">Precios</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Precio de Venta (Gs.) *</label>
                  <input type="number" min="0" value={form.precio_venta} onChange={e => setForm(f => ({ ...f, precio_venta: e.target.value }))} {...field('precio_venta')} />
                  {fieldErrors.precio_venta && <p className="text-red-600 text-xs mt-1">{fieldErrors.precio_venta}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Precio de Costo (Gs.)</label>
                  <input type="number" min="0" value={form.precio_costo} onChange={e => setForm(f => ({ ...f, precio_costo: e.target.value }))}
                    className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" placeholder="Opcional" />
                </div>
              </div>
              <p className="text-xs text-text-muted">Los precios se expresan en Guaraníes (Gs.) sin decimales.</p>
            </div>

            {/* Stock */}
            <div className="bg-white rounded-xl border border-surface-border p-5 space-y-4">
              <h2 className="font-syne font-semibold text-brand-800 text-sm uppercase tracking-wide">Stock</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Stock Mínimo</label>
                  <input type="number" min="0" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))}
                    className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  <p className="text-xs text-text-muted mt-1">Alerta cuando el stock baja de este número.</p>
                </div>
              </div>
            </div>

            {/* Configuración */}
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <h2 className="font-syne font-semibold text-brand-800 text-sm uppercase tracking-wide mb-4">Configuración</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Pausar venta (Stop de venta)</p>
                  <p className="text-xs text-text-muted mt-0.5">El producto NO aparecerá en el catálogo público.</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, stop_venta: !f.stop_venta }))}
                  className={cn('relative w-12 h-6 rounded-full transition-colors',
                    form.stop_venta ? 'bg-red-500' : 'bg-green-500')}>
                  <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                    form.stop_venta ? 'translate-x-6' : 'translate-x-0.5')} />
                </button>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 justify-end">
              <Link href="/productos"
                className="border border-brand-400 text-brand-800 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors">
                Cancelar
              </Link>
              <button type="submit" disabled={saving}
                className="bg-brand-400 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-60 flex items-center gap-2 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Guardando…' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
