'use client'

import { useEffect, useRef, useState } from 'react'
import { api, AlertaStock, MovimientoStock, PaginatedMovimientos, Producto } from '@/lib/api'
import { formatDate, tipoMovimientoLabel, tipoMovimientoClass, cn } from '@/lib/utils'
import {
  AlertTriangle,
  ArrowUpCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Warehouse,
  SlidersHorizontal,
  Search,
  ChevronDown,
} from 'lucide-react'
import Header from '@/components/admin/Header'

// ── Combobox buscable de productos ──────────────────────────────────────────
interface ProductComboboxProps {
  productos: Producto[]
  value: number | ''
  onChange: (id: number | '') => void
  placeholder?: string
}

function ProductCombobox({ productos, value, onChange, placeholder = 'Buscar producto...' }: ProductComboboxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Producto[] | null>(null)
  const [searching, setSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = productos.find(p => p.id === value)
  const filtered = searchResults ?? (query.trim()
    ? productos.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : productos)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearchResults(null)
        if (!selected) setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected])

  const handleQueryChange = (q: string) => {
    setQuery(q)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setSearchResults(null); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.productos.list({ search: q, limit: 50, activo: true })
        setSearchResults(res.items)
      } catch {
        setSearchResults(null)
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const handleSelect = (p: Producto) => {
    onChange(p.id)
    setQuery('')
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setSearchResults(null)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center w-full border border-surface-border rounded-lg bg-white focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-transparent cursor-text"
        onClick={() => { setOpen(true); }}
      >
        <Search className="w-4 h-4 text-text-muted ml-3 shrink-0" />
        {selected && !open ? (
          <span className="flex-1 px-2 py-2.5 text-sm text-text-primary truncate">
            {selected.nombre}{selected.sku ? ` (${selected.sku})` : ''}
          </span>
        ) : (
          <input
            className="flex-1 px-2 py-2.5 text-sm text-text-primary bg-transparent outline-none placeholder:text-text-muted"
            placeholder={selected ? `${selected.nombre}${selected.sku ? ` (${selected.sku})` : ''}` : placeholder}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => setOpen(true)}
          />
        )}
        {value !== '' ? (
          <button type="button" onClick={handleClear} className="p-2 text-text-muted hover:text-text-primary">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className={cn('w-4 h-4 text-text-muted mr-2.5 transition-transform', open && 'rotate-180')} />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-surface-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {searching ? (
            <p className="px-3 py-2.5 text-sm text-text-muted flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-text-muted">
              {query.trim() ? 'Sin resultados' : 'Escribí para buscar un producto'}
            </p>
          ) : (
            filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm hover:bg-brand-50 transition-colors',
                  p.id === value ? 'bg-brand-50 text-brand-800 font-medium' : 'text-text-primary',
                )}
              >
                <span className="font-medium">{p.nombre}</span>
                {p.sku && <span className="ml-1.5 text-text-muted text-xs">({p.sku})</span>}
                <span className="ml-2 text-text-muted text-xs">Stock: {p.stock_actual}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
interface EntradaForm {
  producto_id: number | ''
  cantidad: number
  descripcion: string
}

interface AjusteForm {
  producto_id: number | ''
  stock_nuevo: number
  descripcion: string
}

export default function StockPage() {
  const [alertas, setAlertas] = useState<AlertaStock[]>([])
  const [movimientos, setMovimientos] = useState<PaginatedMovimientos | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [productos, setProductos] = useState<Producto[]>([])
  const [filtroProductoId, setFiltroProductoId] = useState<number | undefined>(undefined)

  // Entrada modal
  const [showEntradaModal, setShowEntradaModal] = useState(false)
  const [entradaForm, setEntradaForm] = useState<EntradaForm>({ producto_id: '', cantidad: 1, descripcion: '' })
  const [entradaLoading, setEntradaLoading] = useState(false)
  const [entradaError, setEntradaError] = useState('')
  const [entradaSuccess, setEntradaSuccess] = useState(false)

  // Ajuste modal
  const [showAjusteModal, setShowAjusteModal] = useState(false)
  const [ajusteForm, setAjusteForm] = useState<AjusteForm>({ producto_id: '', stock_nuevo: 0, descripcion: '' })
  const [ajusteLoading, setAjusteLoading] = useState(false)
  const [ajusteError, setAjusteError] = useState('')
  const [ajusteSuccess, setAjusteSuccess] = useState(false)

  const selectedAjusteProducto = productos.find(p => p.id === ajusteForm.producto_id)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [alertasData, movimientosData] = await Promise.all([
        api.stock.alertas(),
        api.stock.movimientos({ page, limit: 20, producto_id: filtroProductoId }),
      ])
      setAlertas(alertasData)
      setMovimientos(movimientosData)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, filtroProductoId])

  useEffect(() => {
    api.productos.list({ limit: 100, activo: true }).then(r => setProductos(r.items)).catch(() => {})
  }, [])

  // ── Handlers entrada ──
  const openEntrada = () => {
    setEntradaError('')
    setEntradaSuccess(false)
    setEntradaForm({ producto_id: '', cantidad: 1, descripcion: '' })
    setShowEntradaModal(true)
  }

  const handleEntrada = async () => {
    setEntradaError('')
    if (!entradaForm.producto_id || entradaForm.cantidad < 1) {
      setEntradaError('Seleccioná un producto y una cantidad válida.')
      return
    }
    setEntradaLoading(true)
    try {
      await api.stock.entrada({
        producto_id: entradaForm.producto_id as number,
        cantidad: entradaForm.cantidad,
        descripcion: entradaForm.descripcion || undefined,
      })
      setEntradaSuccess(true)
      setShowEntradaModal(false)
      setEntradaForm({ producto_id: '', cantidad: 1, descripcion: '' })
      await fetchData()
      setTimeout(() => setEntradaSuccess(false), 3000)
    } catch (e: unknown) {
      setEntradaError(e instanceof Error ? e.message : 'Error al registrar entrada.')
    } finally {
      setEntradaLoading(false)
    }
  }

  // ── Handlers ajuste ──
  const openAjuste = () => {
    setAjusteError('')
    setAjusteSuccess(false)
    setAjusteForm({ producto_id: '', stock_nuevo: 0, descripcion: '' })
    setShowAjusteModal(true)
  }

  const handleAjusteProductoChange = (id: number | '') => {
    const prod = productos.find(p => p.id === id)
    setAjusteForm(f => ({
      ...f,
      producto_id: id,
      stock_nuevo: prod ? prod.stock_actual : 0,
    }))
  }

  const handleAjuste = async () => {
    setAjusteError('')
    if (!ajusteForm.producto_id || ajusteForm.stock_nuevo < 0) {
      setAjusteError('Seleccioná un producto y un stock válido (≥ 0).')
      return
    }
    setAjusteLoading(true)
    try {
      await api.stock.ajuste({
        producto_id: ajusteForm.producto_id as number,
        stock_nuevo: ajusteForm.stock_nuevo,
        descripcion: ajusteForm.descripcion || undefined,
      })
      setAjusteSuccess(true)
      setShowAjusteModal(false)
      setAjusteForm({ producto_id: '', stock_nuevo: 0, descripcion: '' })
      await fetchData()
      setTimeout(() => setAjusteSuccess(false), 3000)
    } catch (e: unknown) {
      setAjusteError(e instanceof Error ? e.message : 'Error al ajustar stock.')
    } finally {
      setAjusteLoading(false)
    }
  }

  return (
    <div>
      <Header title="Stock" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-brand-800" />
            <h2 className="font-syne font-semibold text-brand-800 text-xl">Gestión de Stock</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAjuste}
              className="flex items-center gap-2 border border-brand-400 text-brand-800 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors text-sm font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Ajustar Stock
            </button>
            <button
              onClick={openEntrada}
              className="flex items-center gap-2 bg-brand-400 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Registrar Entrada
            </button>
          </div>
        </div>

        {(entradaSuccess || ajusteSuccess) && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium">
            {entradaSuccess ? 'Entrada registrada correctamente.' : 'Stock ajustado correctamente.'}
          </div>
        )}

        {alertas.length > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800 text-base">
                Alertas de Stock Bajo ({alertas.length} {alertas.length === 1 ? 'producto' : 'productos'})
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {alertas.map(alerta => (
                <div
                  key={alerta.producto_id}
                  className="bg-white rounded-lg border border-amber-100 p-3 flex flex-col gap-1.5"
                >
                  <p className="text-text-primary font-medium text-sm leading-tight line-clamp-2">
                    {alerta.nombre}
                  </p>
                  <p className="text-text-secondary text-xs">
                    Stock: <span className="font-semibold text-text-primary">{alerta.stock_actual}</span>{' '}
                    / Mínimo: <span className="font-semibold text-text-primary">{alerta.stock_minimo}</span>
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    {alerta.stock_actual === 0 ? (
                      <span className="text-[11px] font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                        Crítico
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">
                        Bajo
                      </span>
                    )}
                    <button
                      onClick={() => { setFiltroProductoId(alerta.producto_id); setPage(1) }}
                      className="text-[11px] text-brand-400 hover:text-brand-700 font-medium underline-offset-2 hover:underline"
                    >
                      Ver movimientos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-2 text-green-700 text-sm font-medium">
            <span className="text-green-500">✓</span>
            Todo el stock está en niveles normales.
          </div>
        )}

        {filtroProductoId !== undefined && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              Filtrando por:{' '}
              <span className="font-medium text-text-primary">
                {productos.find(p => p.id === filtroProductoId)?.nombre ?? `Producto #${filtroProductoId}`}
              </span>
            </span>
            <button
              onClick={() => { setFiltroProductoId(undefined); setPage(1) }}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5"
            >
              <X className="w-3.5 h-3.5" /> Quitar filtro
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h3 className="font-semibold text-text-primary text-base">Historial de Movimientos</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            </div>
          ) : movimientos && movimientos.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-brand-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-text-secondary font-medium">Producto</th>
                      <th className="text-left px-5 py-3 text-text-secondary font-medium">Tipo</th>
                      <th className="text-left px-5 py-3 text-text-secondary font-medium">Cantidad</th>
                      <th className="text-left px-5 py-3 text-text-secondary font-medium">Anterior → Nuevo</th>
                      <th className="text-left px-5 py-3 text-text-secondary font-medium">Descripción</th>
                      <th className="text-left px-5 py-3 text-text-secondary font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {movimientos.items.map((mov: MovimientoStock) => (
                      <tr key={mov.id} className="hover:bg-surface-bg transition-colors">
                        <td className="px-5 py-3 text-text-primary font-medium">{mov.producto_nombre}</td>
                        <td className="px-5 py-3">
                          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-md border', tipoMovimientoClass(mov.tipo))}>
                            {tipoMovimientoLabel(mov.tipo)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn('font-semibold', mov.cantidad > 0 ? 'text-green-600' : 'text-red-600')}>
                            {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          <span className="text-text-primary font-medium">{mov.stock_anterior}</span>
                          {' → '}
                          <span className="text-text-primary font-medium">{mov.stock_nuevo}</span>
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          {mov.descripcion
                            ? mov.descripcion.length > 40
                              ? mov.descripcion.slice(0, 40) + '…'
                              : mov.descripcion
                            : '—'}
                        </td>
                        <td className="px-5 py-3 text-text-secondary whitespace-nowrap">
                          {formatDate(mov.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {movimientos.pages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border">
                  <p className="text-sm text-text-secondary">
                    Página {movimientos.page} de {movimientos.pages} — {movimientos.total} movimientos
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-1.5 rounded-lg border border-surface-border hover:bg-surface-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button
                      disabled={page === movimientos.pages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-1.5 rounded-lg border border-surface-border hover:bg-surface-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <Warehouse className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No hay movimientos registrados.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Registrar Entrada ── */}
      {showEntradaModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-surface-border w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h3 className="font-syne font-semibold text-brand-800 text-base">
                Registrar Entrada de Stock
              </h3>
              <button
                onClick={() => setShowEntradaModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-bg transition-colors"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Producto <span className="text-red-500">*</span>
                </label>
                <ProductCombobox
                  productos={productos}
                  value={entradaForm.producto_id}
                  onChange={id => setEntradaForm(f => ({ ...f, producto_id: id }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Cantidad a ingresar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={entradaForm.cantidad}
                  onChange={e => setEntradaForm(f => ({ ...f, cantidad: Math.max(1, Number(e.target.value)) }))}
                  className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Descripción <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={entradaForm.descripcion}
                  onChange={e => setEntradaForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Compra a proveedor, lote #123..."
                  className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
                />
              </div>

              {entradaError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {entradaError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
              <button
                onClick={() => setShowEntradaModal(false)}
                className="px-4 py-2 border border-brand-400 text-brand-800 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEntrada}
                disabled={entradaLoading}
                className="flex items-center gap-2 bg-brand-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {entradaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Ajustar Stock ── */}
      {showAjusteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-surface-border w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h3 className="font-syne font-semibold text-brand-800 text-base">
                Ajustar Stock
              </h3>
              <button
                onClick={() => setShowAjusteModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-bg transition-colors"
              >
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Producto <span className="text-red-500">*</span>
                </label>
                <ProductCombobox
                  productos={productos}
                  value={ajusteForm.producto_id}
                  onChange={handleAjusteProductoChange}
                />
              </div>

              {selectedAjusteProducto && (
                <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
                  <Package className="w-4 h-4 text-brand-700 shrink-0" />
                  <div className="text-sm">
                    <span className="text-text-secondary">Stock actual: </span>
                    <span className="font-semibold text-brand-800 text-base">
                      {selectedAjusteProducto.stock_actual}
                    </span>
                    <span className="text-text-muted ml-1">unidades</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Nuevo stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={ajusteForm.stock_nuevo}
                  onChange={e => setAjusteForm(f => ({ ...f, stock_nuevo: Math.max(0, Number(e.target.value)) }))}
                  className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
                {selectedAjusteProducto && ajusteForm.stock_nuevo !== selectedAjusteProducto.stock_actual && (
                  <p className="mt-1.5 text-xs text-text-muted">
                    Diferencia:{' '}
                    <span className={cn(
                      'font-semibold',
                      ajusteForm.stock_nuevo > selectedAjusteProducto.stock_actual ? 'text-green-600' : 'text-red-600',
                    )}>
                      {ajusteForm.stock_nuevo > selectedAjusteProducto.stock_actual ? '+' : ''}
                      {ajusteForm.stock_nuevo - selectedAjusteProducto.stock_actual} unidades
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Motivo del ajuste <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={ajusteForm.descripcion}
                  onChange={e => setAjusteForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Corrección por inventario físico, merma..."
                  className="w-full px-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
                />
              </div>

              {ajusteError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {ajusteError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
              <button
                onClick={() => setShowAjusteModal(false)}
                className="px-4 py-2 border border-brand-400 text-brand-800 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAjuste}
                disabled={ajusteLoading || !ajusteForm.producto_id}
                className="flex items-center gap-2 bg-brand-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {ajusteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SlidersHorizontal className="w-4 h-4" />}
                Aplicar ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
