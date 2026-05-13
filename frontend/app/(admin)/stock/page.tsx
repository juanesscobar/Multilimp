'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import Header from '@/components/admin/Header'

interface EntradaForm {
  producto_id: number | ''
  cantidad: number
  descripcion: string
}

export default function StockPage() {
  const [alertas, setAlertas] = useState<AlertaStock[]>([])
  const [movimientos, setMovimientos] = useState<PaginatedMovimientos | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showEntradaModal, setShowEntradaModal] = useState(false)
  const [entradaForm, setEntradaForm] = useState<EntradaForm>({
    producto_id: '',
    cantidad: 1,
    descripcion: '',
  })
  const [entradaLoading, setEntradaLoading] = useState(false)
  const [entradaError, setEntradaError] = useState('')
  const [entradaSuccess, setEntradaSuccess] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [filtroProductoId, setFiltroProductoId] = useState<number | undefined>(undefined)

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

  useEffect(() => {
    fetchData()
  }, [page, filtroProductoId])

  useEffect(() => {
    api.productos.list({ limit: 100, activo: true }).then(r => setProductos(r.items)).catch(() => {})
  }, [])

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

  const openModal = () => {
    setEntradaError('')
    setEntradaSuccess(false)
    setEntradaForm({ producto_id: '', cantidad: 1, descripcion: '' })
    setShowEntradaModal(true)
  }

  return (
    <div className="pt-14 min-h-screen bg-surface-bg">
      <Header title="Stock" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-brand-800" />
            <h2 className="font-syne font-semibold text-brand-800 text-xl">Gestión de Stock</h2>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-brand-400 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Registrar Entrada
          </button>
        </div>

        {entradaSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium">
            Entrada registrada correctamente.
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
                      onClick={() => {
                        setFiltroProductoId(alerta.producto_id)
                        setPage(1)
                      }}
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
                        <td className="px-5 py-3 text-text-primary font-medium">
                          {mov.producto_nombre}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              'text-xs font-medium px-2.5 py-1 rounded-md border',
                              tipoMovimientoClass(mov.tipo),
                            )}
                          >
                            {tipoMovimientoLabel(mov.tipo)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              'font-semibold',
                              mov.cantidad > 0 ? 'text-green-600' : 'text-red-600',
                            )}
                          >
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
                    Página {movimientos.page} de {movimientos.pages} —{' '}
                    {movimientos.total} movimientos
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
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <select
                    value={entradaForm.producto_id}
                    onChange={e =>
                      setEntradaForm(f => ({
                        ...f,
                        producto_id: e.target.value ? Number(e.target.value) : '',
                      }))
                    }
                    className="w-full pl-9 pr-3 py-2.5 border border-surface-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Seleccioná un producto</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}{p.sku ? ` (${p.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={entradaForm.cantidad}
                  onChange={e =>
                    setEntradaForm(f => ({ ...f, cantidad: Math.max(1, Number(e.target.value)) }))
                  }
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
                {entradaLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpCircle className="w-4 h-4" />
                )}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
