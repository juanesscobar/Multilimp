'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, Venta, PaginatedVentas } from '@/lib/api'
import { formatGs, formatDate, estadoBadgeClass, metodoPagoLabel, cn } from '@/lib/utils'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  XCircle,
  Loader2,
  ShoppingBag,
  Eye,
  Calendar,
} from 'lucide-react'
import Header from '@/components/admin/Header'

interface Filters {
  estado: string
  metodo_pago: string
  fecha_desde: string
  fecha_hasta: string
}

const EMPTY_FILTERS: Filters = {
  estado: '',
  metodo_pago: '',
  fecha_desde: '',
  fecha_hasta: '',
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<PaginatedVentas | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [changingEstado, setChangingEstado] = useState(false)

  const fetchVentas = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (filters.estado) params.estado = filters.estado
      if (filters.metodo_pago) params.metodo_pago = filters.metodo_pago
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta
      const data = await api.ventas.list(params as Parameters<typeof api.ventas.list>[0])
      setVentas(data)
    } catch {
      // silencio
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchVentas()
  }, [fetchVentas])

  const hasFilters = Object.values(filters).some(v => v !== '')

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleChangeEstado = async (id: number, estado: string) => {
    if (estado === 'cancelado') {
      if (!window.confirm('¿Está seguro de cancelar esta venta?')) return
    }
    setChangingEstado(true)
    try {
      const updated = await api.ventas.changeEstado(id, estado)
      setSelectedVenta(updated)
      await fetchVentas()
    } catch {
      // silencio
    } finally {
      setChangingEstado(false)
    }
  }

  const openDrawer = (venta: Venta) => setSelectedVenta(venta)
  const closeDrawer = () => setSelectedVenta(null)

  const totalPages = ventas?.pages ?? 1

  return (
    <div>
      <Header title="Ventas" />

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 bg-white border border-surface-border rounded-xl p-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-text-secondary">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
          </div>

          <select
            value={filters.estado}
            onChange={e => handleFilterChange('estado', e.target.value)}
            className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            value={filters.metodo_pago}
            onChange={e => handleFilterChange('metodo_pago', e.target.value)}
            className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="alias">Alias</option>
            <option value="otro">Otro</option>
          </select>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-text-muted" />
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={e => handleFilterChange('fecha_desde', e.target.value)}
              className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Desde"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-text-muted" />
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={e => handleFilterChange('fecha_hasta', e.target.value)}
              className="text-sm border border-surface-border rounded-lg px-3 py-1.5 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Hasta"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-brand-800">N° Venta</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-800">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-800">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-800">Método</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-800">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-800">Origen</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-800">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-800">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-8" /></td>
                  </tr>
                ))
              ) : !ventas || ventas.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-muted">
                      <ShoppingBag className="w-12 h-12 opacity-30" />
                      <p className="font-medium">No hay ventas registradas</p>
                      {hasFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-brand-400 hover:underline"
                        >
                          Limpiar filtros para ver todas las ventas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                ventas.items.map(venta => (
                  <tr
                    key={venta.id}
                    onClick={() => openDrawer(venta)}
                    className="hover:bg-brand-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-brand-800 font-semibold">
                        {venta.numero_venta}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{venta.cliente_nombre}</p>
                        {venta.cliente_telefono && (
                          <p className="text-xs text-text-muted">{venta.cliente_telefono}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-syne font-semibold text-text-primary">
                        {formatGs(venta.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {metodoPagoLabel(venta.metodo_pago)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          estadoBadgeClass(venta.estado),
                        )}
                      >
                        {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {venta.origen === 'admin' ? (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
                          Admin
                        </span>
                      ) : (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-brand-100 text-brand-700">
                          Catálogo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDate(venta.created_at)}
                    </td>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); openDrawer(venta) }}>
                      <button className="p-1.5 rounded-lg hover:bg-brand-100 text-brand-400 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {ventas && ventas.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border bg-white">
              <p className="text-sm text-text-muted">
                Página {ventas.page} de {totalPages} &mdash; {ventas.total} registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-surface-border hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-text-secondary" />
                </button>
                <span className="text-sm font-medium text-text-primary px-2">
                  {page}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-surface-border hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedVenta && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeDrawer}
          />

          <aside className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-white">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Detalle de venta</p>
                <h2 className="font-syne font-semibold text-brand-800 text-lg">
                  {selectedVenta.numero_venta}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section className="bg-surface-bg rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide text-text-muted mb-3">
                  Información del cliente
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-muted text-xs">Nombre</p>
                    <p className="font-medium text-text-primary">{selectedVenta.cliente_nombre}</p>
                  </div>
                  {selectedVenta.cliente_telefono && (
                    <div>
                      <p className="text-text-muted text-xs">Teléfono</p>
                      <p className="font-medium text-text-primary">{selectedVenta.cliente_telefono}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-text-muted text-xs">Método de pago</p>
                    <p className="font-medium text-text-primary">{metodoPagoLabel(selectedVenta.metodo_pago)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs">Fecha</p>
                    <p className="font-medium text-text-primary">{formatDate(selectedVenta.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs">Origen</p>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        selectedVenta.origen === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-brand-100 text-brand-700',
                      )}
                    >
                      {selectedVenta.origen === 'admin' ? 'Admin' : 'Catálogo'}
                    </span>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs">Estado</p>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                        estadoBadgeClass(selectedVenta.estado),
                      )}
                    >
                      {selectedVenta.estado.charAt(0).toUpperCase() + selectedVenta.estado.slice(1)}
                    </span>
                  </div>
                </div>

                {(selectedVenta.metodo_pago === 'alias' || selectedVenta.metodo_pago === 'transferencia') && (
                  <div className="mt-3 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
                    <p className="text-xs text-brand-700 font-medium">Alias / Transferencia</p>
                    <p className="text-sm font-semibold text-brand-800 mt-0.5">
                      {process.env.NEXT_PUBLIC_ALIAS_PAGO ?? 'Ver alias del negocio'}
                    </p>
                  </div>
                )}
              </section>

              <section>
                <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide text-text-muted mb-3">
                  Productos
                </h3>
                <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-50 border-b border-surface-border">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-brand-800 text-xs">Producto</th>
                        <th className="text-right px-3 py-2 font-semibold text-brand-800 text-xs">Cant.</th>
                        <th className="text-right px-3 py-2 font-semibold text-brand-800 text-xs">P. Unit.</th>
                        <th className="text-right px-3 py-2 font-semibold text-brand-800 text-xs">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {selectedVenta.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-text-primary">{item.producto_nombre}</td>
                          <td className="px-3 py-2 text-right text-text-secondary">{item.cantidad}</td>
                          <td className="px-3 py-2 text-right text-text-secondary whitespace-nowrap">
                            {formatGs(item.precio_unitario)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-text-primary whitespace-nowrap">
                            {formatGs(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-surface-bg rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="font-medium text-text-primary">{formatGs(selectedVenta.subtotal)}</span>
                </div>
                {selectedVenta.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Descuento</span>
                    <span className="font-medium text-red-600">- {formatGs(selectedVenta.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-surface-border">
                  <span className="font-semibold text-text-primary">Total</span>
                  <span className="font-syne font-semibold text-xl text-brand-800">
                    {formatGs(selectedVenta.total)}
                  </span>
                </div>
              </section>

              {selectedVenta.notas && (
                <section>
                  <h3 className="font-semibold text-text-muted text-xs uppercase tracking-wide mb-2">
                    Notas
                  </h3>
                  <p className="text-sm text-text-primary bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                    {selectedVenta.notas}
                  </p>
                </section>
              )}

              {selectedVenta.estado !== 'cancelado' && (
                <section>
                  <h3 className="font-semibold text-text-muted text-xs uppercase tracking-wide mb-3">
                    Cambiar estado
                  </h3>
                  <div className="flex gap-3">
                    {selectedVenta.estado !== 'confirmado' && (
                      <button
                        onClick={() => handleChangeEstado(selectedVenta.id, 'confirmado')}
                        disabled={changingEstado}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {changingEstado ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Confirmar
                      </button>
                    )}
                    <button
                      onClick={() => handleChangeEstado(selectedVenta.id, 'cancelado')}
                      disabled={changingEstado}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {changingEstado ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Cancelar
                    </button>
                  </div>
                </section>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
