'use client'
import { useEffect, useRef, useState } from 'react'
import {
  Plus, X, ShoppingCart, Package, Search, Minus,
  Loader2, Check, ChevronDown
} from 'lucide-react'
import { api, Producto, Categoria } from '@/lib/api'
import { formatGs, cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartLine {
  producto: Producto
  cantidad: number
}

type ModalType = null | 'venta' | 'producto'

const UNIDADES = ['unidad', 'litro', 'kg', 'paquete', 'caja', 'metro', 'par']
const METODOS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'alias', label: 'Alias / Billetera' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Overlay({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
      onClick={onClick}
    />
  )
}

function ModalCard({ children, title, onClose }: {
  children: React.ReactNode
  title: string
  onClose: () => void
}) {
  return (
    <>
      <Overlay onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border flex-shrink-0">
          <h2 className="font-syne font-semibold text-brand-800 text-lg">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </>
  )
}

// ─── Modal: Venta Rápida ──────────────────────────────────────────────────────

function VentaRapidaModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [cliente, setCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    if (!search.trim()) { setResultados([]); return }
    setBuscando(true)
    searchRef.current = setTimeout(async () => {
      try {
        const res = await api.productos.list({ search, limit: 6, activo: true })
        setResultados(res.items.filter(p => !p.stop_venta && p.stock_actual > 0))
      } catch { }
      finally { setBuscando(false) }
    }, 300)
  }, [search])

  function agregarProducto(p: Producto) {
    setCart(prev => {
      const ex = prev.find(l => l.producto.id === p.id)
      if (ex) return prev.map(l => l.producto.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l)
      return [...prev, { producto: p, cantidad: 1 }]
    })
    setSearch('')
    setResultados([])
  }

  function cambiarCantidad(id: number, delta: number) {
    setCart(prev => prev
      .map(l => l.producto.id === id ? { ...l, cantidad: l.cantidad + delta } : l)
      .filter(l => l.cantidad > 0)
    )
  }

  const total = cart.reduce((s, l) => s + l.producto.precio_venta * l.cantidad, 0)

  async function handleSubmit() {
    if (!cliente.trim()) { setError('El nombre del cliente es obligatorio'); return }
    if (cart.length === 0) { setError('Agregá al menos un producto'); return }
    setSaving(true)
    setError('')
    try {
      const venta = await api.ventas.create({
        cliente_nombre: cliente,
        cliente_telefono: telefono || undefined,
        metodo_pago: metodoPago,
        descuento: 0,
        origen: 'admin',
        items: cart.map(l => ({ producto_id: l.producto.id, cantidad: l.cantidad })),
      })
      setSuccess(`Venta ${venta.numero_venta} creada — Total: ${formatGs(total)}`)
      setCart([])
      setCliente('')
      setTelefono('')
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la venta')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <ModalCard title="Venta Rápida" onClose={onClose}>
        <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
          <div className="bg-green-100 rounded-full p-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="font-syne font-semibold text-lg text-brand-800">¡Venta registrada!</p>
          <p className="text-sm text-text-secondary">{success}</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setSuccess('')} className="border border-brand-400 text-brand-800 rounded-lg px-4 py-2 text-sm hover:bg-brand-50">
              Nueva venta
            </button>
            <button onClick={onClose} className="bg-brand-400 text-white rounded-lg px-4 py-2 text-sm hover:bg-brand-700">
              Cerrar
            </button>
          </div>
        </div>
      </ModalCard>
    )
  }

  return (
    <ModalCard title="Venta Rápida" onClose={onClose}>
      <div className="p-5 space-y-4">

        {/* Buscador de productos */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto para agregar…"
              className="w-full pl-9 pr-9 py-2.5 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          {resultados.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-xl shadow-lg z-10 overflow-hidden">
              {resultados.map(p => (
                <button
                  key={p.id}
                  onClick={() => agregarProducto(p)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-brand-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.nombre}</p>
                    <p className="text-xs text-text-muted">Stock: {p.stock_actual} {p.unidad_medida}</p>
                  </div>
                  <span className="font-syne font-semibold text-brand-800 text-sm ml-4">
                    {formatGs(p.precio_venta)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Carrito */}
        {cart.length > 0 ? (
          <div className="space-y-2">
            {cart.map(l => (
              <div key={l.producto.id} className="flex items-center gap-3 bg-brand-50 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{l.producto.nombre}</p>
                  <p className="text-xs text-text-muted">{formatGs(l.producto.precio_venta)} c/u</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => cambiarCantidad(l.producto.id, -1)}
                    className="w-6 h-6 rounded-md border border-surface-border bg-white flex items-center justify-center hover:bg-red-50 transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-medium">{l.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(l.producto.id, 1)}
                    disabled={l.cantidad >= l.producto.stock_actual}
                    className="w-6 h-6 rounded-md border border-surface-border bg-white flex items-center justify-center hover:bg-brand-50 transition-colors disabled:opacity-40">
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-syne font-semibold text-brand-800 w-20 text-right">
                    {formatGs(l.producto.precio_venta * l.cantidad)}
                  </span>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-surface-border">
              <span className="text-sm font-medium text-text-secondary">Total</span>
              <span className="font-syne font-semibold text-xl text-brand-800">{formatGs(total)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-text-muted text-sm bg-gray-50 rounded-xl">
            Buscá un producto para agregarlo
          </div>
        )}

        {/* Datos del cliente */}
        <div className="space-y-3 pt-1">
          <input
            type="text"
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            placeholder="Nombre del cliente *"
            className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="Teléfono (opcional)"
            className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <div className="relative">
            <select
              value={metodoPago}
              onChange={e => setMetodoPago(e.target.value)}
              className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 appearance-none pr-8"
            >
              {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || cart.length === 0}
          className="w-full bg-brand-400 text-white rounded-lg py-3 font-medium text-sm hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          {saving ? 'Registrando…' : `Registrar Venta · ${formatGs(total)}`}
        </button>
      </div>
    </ModalCard>
  )
}

// ─── Modal: Producto Rápido ───────────────────────────────────────────────────

function ProductoRapidoModal({ onClose }: { onClose: () => void }) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [form, setForm] = useState({
    nombre: '',
    categoria_id: 0,
    precio_venta: '',
    stock_actual: '0',
    stock_minimo: '5',
    sku: '',
    unidad_medida: 'unidad',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.categorias.list(true).then(setCategorias).catch(() => { })
  }, [])

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.categoria_id) { setError('Seleccioná una categoría'); return }
    if (!form.precio_venta || Number(form.precio_venta) <= 0) { setError('El precio debe ser mayor a 0'); return }
    setSaving(true)
    setError('')
    try {
      const prod = await api.productos.create({
        nombre: form.nombre,
        sku: form.sku || undefined,
        categoria_id: Number(form.categoria_id),
        precio_venta: Number(form.precio_venta),
        stock_actual: Number(form.stock_actual),
        stock_minimo: Number(form.stock_minimo),
        unidad_medida: form.unidad_medida,
      })
      setSuccess(`"${prod.nombre}" creado con stock ${prod.stock_actual}`)
      setForm({ nombre: '', categoria_id: 0, precio_venta: '', stock_actual: '0', stock_minimo: '5', sku: '', unidad_medida: 'unidad' })
    } catch (err: any) {
      setError(err.message ?? 'Error al crear el producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalCard title="Producto Rápido" onClose={onClose}>
      <div className="p-5 space-y-3">

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-sm text-green-700">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success} — podés agregar otro.</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Nombre *</label>
          <input
            type="text"
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Ej: Detergente Multiusos 1L"
            className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Categoría *</label>
            <select
              value={form.categoria_id}
              onChange={e => set('categoria_id', Number(e.target.value))}
              className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value={0}>Seleccionar…</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Unidad</label>
            <select
              value={form.unidad_medida}
              onChange={e => set('unidad_medida', e.target.value)}
              className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Precio de Venta (Gs.) *</label>
          <input
            type="number"
            min="0"
            value={form.precio_venta}
            onChange={e => set('precio_venta', e.target.value)}
            placeholder="0"
            className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Stock inicial</label>
            <input
              type="number"
              min="0"
              value={form.stock_actual}
              onChange={e => set('stock_actual', e.target.value)}
              className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Stock mínimo</label>
            <input
              type="number"
              min="0"
              value={form.stock_minimo}
              onChange={e => set('stock_minimo', e.target.value)}
              className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">SKU (opcional)</label>
          <input
            type="text"
            value={form.sku}
            onChange={e => set('sku', e.target.value)}
            placeholder="Ej: DET-001"
            className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border border-surface-border text-text-secondary rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-brand-400 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            {saving ? 'Guardando…' : 'Guardar Producto'}
          </button>
        </div>
      </div>
    </ModalCard>
  )
}

// ─── FAB principal ────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    type: 'venta' as ModalType,
    icon: ShoppingCart,
    label: 'Venta Rápida',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    type: 'producto' as ModalType,
    icon: Package,
    label: 'Producto Rápido',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
]

export default function QuickActions() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)

  function openModal(type: ModalType) {
    setModal(type)
    setOpen(false)
  }

  function closeModal() {
    setModal(null)
  }

  return (
    <>
      {/* Overlay para cerrar — z-20 (debajo del FAB z-30) */}
      {open && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">

        {/* Sub-actions — aparecen sobre el botón principal */}
        {open && (
          [...ACTIONS].reverse().map((action, i) => (
            <div
              key={action.label}
              className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
            >
              <span className="bg-white text-text-primary text-xs font-medium px-3 py-1.5 rounded-lg shadow-md border border-surface-border whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => openModal(action.type)}
                className={cn(
                  'w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110',
                  action.color
                )}
              >
                <action.icon className="w-5 h-5" />
              </button>
            </div>
          ))
        )}

        {/* Botón principal */}
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'w-14 h-14 rounded-full bg-brand-400 text-white shadow-xl flex items-center justify-center transition-all duration-200 hover:bg-brand-700 hover:scale-110',
            open && 'rotate-45 bg-brand-700'
          )}
          title="Acciones rápidas"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modales */}
      {modal === 'venta' && <VentaRapidaModal onClose={closeModal} />}
      {modal === 'producto' && <ProductoRapidoModal onClose={closeModal} />}
    </>
  )
}
