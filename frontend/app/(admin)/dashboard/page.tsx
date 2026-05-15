'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowUpRight } from 'lucide-react'
import Header from '@/components/admin/Header'
import { api, DashboardStats, VentaPorDia, Venta } from '@/lib/api'
import { formatGs, formatDate, estadoBadgeClass, metodoPagoLabel } from '@/lib/utils'

interface TooltipPayloadEntry {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white border border-surface-border rounded-lg px-3 py-2 shadow-sm text-sm">
      <p className="text-text-secondary mb-1">{label}</p>
      <p className="font-semibold text-brand-800">{formatGs(payload[0].value)}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-7 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="w-9 h-9 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48 mb-5" />
      <div className="h-[250px] bg-gray-100 rounded-lg" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="bg-white rounded-xl border border-surface-border animate-pulse">
      <div className="p-5 border-b border-surface-border">
        <div className="h-4 bg-gray-200 rounded w-36" />
      </div>
      <div className="divide-y divide-surface-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-5 py-3 flex gap-4">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-32 flex-1" />
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-5 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ventasPorDia, setVentasPorDia] = useState<VentaPorDia[]>([])
  const [ultimasVentas, setUltimasVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.dashboard.stats(),
      api.dashboard.ventasPorDia(30),
      api.ventas.list({ limit: 10 }),
    ])
      .then(([statsData, ventasData, ventasListData]) => {
        setStats(statsData)
        setVentasPorDia(ventasData)
        setUltimasVentas(ventasListData.items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatAxisDate = (fecha: string): string => {
    const d = new Date(fecha + 'T00:00:00')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}`
  }

  const chartData = ventasPorDia.slice(-30).map((v) => ({
    ...v,
    label: formatAxisDate(v.fecha),
  }))

  const xAxisTicks = ventasPorDia.length > 7
    ? ventasPorDia.slice(-7).map((v) => {
        const d = new Date(v.fecha + 'T00:00:00')
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        return `${day}/${month}`
      })
    : chartData.map((v) => v.label)

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {loading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonChart />
            <SkeletonTable />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-surface-border p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">
                      Ventas Hoy
                    </p>
                    <p className="font-syne text-2xl font-semibold text-brand-800 truncate">
                      {formatGs(stats?.ventas.hoy ?? 0)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {stats?.ventas.hoy_cantidad ?? 0} ventas
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0 bg-brand-50 rounded-lg p-2">
                    <TrendingUp className="w-5 h-5 text-brand-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-surface-border p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">
                      Ventas Semana
                    </p>
                    <p className="font-syne text-2xl font-semibold text-brand-800 truncate">
                      {formatGs(stats?.ventas.semana ?? 0)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {stats?.ventas.semana_cantidad ?? 0} ventas
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0 bg-brand-50 rounded-lg p-2">
                    <ArrowUpRight className="w-5 h-5 text-brand-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-surface-border p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">
                      Ventas Mes
                    </p>
                    <p className="font-syne text-2xl font-semibold text-brand-800 truncate">
                      {formatGs(stats?.ventas.mes ?? 0)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {stats?.ventas.mes_cantidad ?? 0} ventas
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0 bg-brand-50 rounded-lg p-2">
                    <ShoppingCart className="w-5 h-5 text-brand-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-surface-border p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">
                      Productos Activos
                    </p>
                    <p className="font-syne text-2xl font-semibold text-brand-800">
                      {stats?.productos.total_activos ?? 0}
                    </p>
                    <p className="text-xs text-text-muted">
                      Sin stock:{' '}
                      <span className="text-red-600 font-medium">
                        {stats?.productos.sin_stock ?? 0}
                      </span>
                      {' · '}Stock bajo:{' '}
                      <span className="text-amber-600 font-medium">
                        {stats?.productos.stock_bajo ?? 0}
                      </span>
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0 bg-brand-50 rounded-lg p-2">
                    <Package className="w-5 h-5 text-brand-400" />
                  </div>
                </div>
              </div>
            </div>

            {(stats?.productos.stock_bajo ?? 0) > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">
                    Hay {stats?.productos.stock_bajo} producto
                    {(stats?.productos.stock_bajo ?? 0) !== 1 ? 's' : ''} con stock bajo.
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Revisa el módulo de{' '}
                    <Link
                      href="/stock"
                      className="underline underline-offset-2 font-medium hover:text-amber-900"
                    >
                      Stock
                    </Link>{' '}
                    para reponer el inventario.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-surface-border p-5">
              <h2 className="font-syne font-semibold text-brand-800 text-sm mb-5">
                Ventas últimos 30 días
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F8"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    ticks={xAxisTicks}
                  />
                  <YAxis
                    tickFormatter={(v: number) => {
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
                      return String(v)
                    }}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EFF6FF' }} />
                  <Bar
                    dataKey="total"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border">
                <h2 className="font-syne font-semibold text-brand-800 text-sm">
                  Últimas ventas
                </h2>
              </div>

              {ultimasVentas.length === 0 ? (
                <div className="py-12 text-center text-text-muted text-sm">
                  No hay ventas registradas aún.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                          Número
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                          Cliente
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                          Total
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                          Método
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                          Estado
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {ultimasVentas.map((venta) => (
                        <tr
                          key={venta.id}
                          className="hover:bg-surface-bg transition-colors"
                        >
                          <td className="px-5 py-3 font-medium text-brand-800 whitespace-nowrap">
                            {venta.numero_venta}
                          </td>
                          <td className="px-5 py-3 text-text-primary whitespace-nowrap">
                            {venta.cliente_nombre}
                          </td>
                          <td className="px-5 py-3 font-syne font-semibold text-brand-800 whitespace-nowrap">
                            {formatGs(venta.total)}
                          </td>
                          <td className="px-5 py-3 text-text-secondary whitespace-nowrap">
                            {metodoPagoLabel(venta.metodo_pago)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${estadoBadgeClass(venta.estado)}`}
                            >
                              {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-text-muted whitespace-nowrap">
                            {formatDate(venta.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
