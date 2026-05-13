'use client'

import { useEffect, useRef, useState } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'
import {
  Search,
  Upload,
  Plus,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import Header from '@/components/admin/Header'
import { api, Producto, Categoria, PaginatedProductos, ImportCSVResult } from '@/lib/api'
import { formatGs, cn } from '@/lib/utils'

export default function ProductosPage() {
  const [productos, setProductos] = useState<PaginatedProductos | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null)
  const [stopFiltro, setStopFiltro] = useState<boolean | null>(null)
  const [page, setPage] = useState(1)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [csvResult, setCsvResult] = useState<ImportCSVResult | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    api.categorias.list().then(setCategorias).catch(() => {})
  }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [search])

  useEffect(() => {
    setLoading(true)
    const params: Parameters<typeof api.productos.list>[0] = {
      page,
      limit: 20,
    }
    if (debouncedSearch) params.search = debouncedSearch
    if (categoriaFiltro !== null) params.categoria_id = categoriaFiltro
    if (stopFiltro !== null) params.stop_venta = stopFiltro

    api.productos
      .list(params)
      .then(setProductos)
      .catch(() => setProductos(null))
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, categoriaFiltro, stopFiltro])

  const handleToggleStop = async (producto: Producto) => {
    if (togglingId !== null) return
    setTogglingId(producto.id)
    setProductos(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(p =>
          p.id === producto.id ? { ...p, stop_venta: !p.stop_venta } : p
        ),
      }
    })
    try {
      const updated = await api.productos.toggleStop(producto.id)
      setProductos(prev => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map(p => (p.id === updated.id ? updated : p)),
        }
      })
    } catch {
      setProductos(prev => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map(p =>
            p.id === producto.id ? { ...p, stop_venta: producto.stop_venta } : p
          ),
        }
      })
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Desactivar el producto "${nombre}"?`)) return
    setDeletingId(id)
    try {
      await api.productos.delete(id)
      setProductos(prev => {
        if (!prev) return prev
        return {
          ...prev,
          total: prev.total - 1,
          items: prev.items.filter(p => p.id !== id),
        }
      })
    } catch {
    } finally {
      setDeletingId(null)
    }
  }

  const handleCSVImport = async () => {
    if (!selectedFile) return
    setCsvLoading(true)
    setCsvError(null)
    setCsvResult(null)
    try {
      const result = await api.productos.importCSV(selectedFile)
      setCsvResult(result)
      setPage(1)
      setDebouncedSearch('')
      setSearch('')
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : 'Error al importar el archivo')
    } finally {
      setCsvLoading(false)
    }
  }

  const closeCSVModal = () => {
    setShowCSVModal(false)
    setCsvResult(null)
    setCsvError(null)
    setSelectedFile(null)
    setCsvLoading(false)
  }

  const handleCategoryChange = (val: string) => {
    setCategoriaFiltro(val === '' ? null : Number(val))
    setPage(1)
  }

  const handleStopChange = (val: string) => {
    if (val === '') setStopFiltro(null)
    else if (val === 'false') setStopFiltro(false)
    else setStopFiltro(true)
    setPage(1)
  }

  const pages = productos?.pages ?? 0
  const total = productos?.total ?? 0

  return (
    <div className="p-6">
      <Header title="Productos" />

      <div className="flex items-center justify-between mb-6 pt-2">
        <div />
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCSVModal(true)}
            className="flex items-center gap-2 border border-brand-400 text-brand-800 rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <Link
            href="/productos/nuevo"
            className="flex items-center gap-2 bg-brand-400 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-surface-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-text-primary placeholder:text-text-muted"
          />
        </div>

        <select
          value={categoriaFiltro ?? ''}
          onChange={e => handleCategoryChange(e.target.value)}
          className="py-2 px-3 text-sm border border-surface-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-text-primary min-w-[160px]"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={stopFiltro === null ? '' : String(stopFiltro)}
          onChange={e => handleStopChange(e.target.value)}
          className="py-2 px-3 text-sm border border-surface-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-text-primary min-w-[140px]"
        >
          <option value="">Todos los estados</option>
          <option value="false">En venta</option>
          <option value="true">Pausados</option>
        </select>

        {!loading && (
          <span className="text-sm text-text-secondary">
            {total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-brand-50 border-b border-surface-border">
                <th className="text-left px-4 py-3 font-medium text-text-secondary w-16">Imagen</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Precio</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-border">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-24 bg-gray-100 rounded-md animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                        <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : productos && productos.items.length > 0 ? (
                productos.items.map(producto => (
                  <tr
                    key={producto.id}
                    className="border-b border-surface-border hover:bg-brand-50/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center overflow-hidden border border-surface-border">
                        {producto.imagen_url ? (
                          <NextImage
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-brand-200" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{producto.nombre}</p>
                      {producto.sku && (
                        <p className="text-xs text-text-muted mt-0.5">SKU: {producto.sku}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {producto.categoria ? (
                        <span className="border border-surface-border rounded-md px-2 py-0.5 text-xs font-medium text-text-secondary">
                          {producto.categoria.nombre}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-syne font-semibold text-brand-800">
                        {formatGs(producto.precio_venta)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-medium">{producto.stock_actual}</span>
                        {producto.stock_actual <= producto.stock_minimo && (
                          <span className="bg-red-100 text-red-700 text-xs font-medium rounded-md px-1.5 py-0.5">
                            Bajo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStop(producto)}
                        disabled={togglingId === producto.id}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-w-[100px] justify-center',
                          producto.stop_venta
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        )}
                      >
                        {togglingId === producto.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : producto.stop_venta ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Pausado
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            En Venta
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/productos/${producto.id}/editar`}
                          className="p-1.5 rounded text-text-secondary hover:text-brand-700 hover:bg-brand-50 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(producto.id, producto.nombre)}
                          disabled={deletingId === producto.id}
                          className="p-1.5 rounded text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Desactivar"
                        >
                          {deletingId === producto.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-text-muted">
                    <Package className="w-10 h-10 mx-auto mb-3 text-brand-200" />
                    <p className="font-medium">No se encontraron productos</p>
                    <p className="text-xs mt-1">Ajustá los filtros o creá un nuevo producto</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <p className="text-sm text-text-secondary">
              Página {page} de {pages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-brand-50 text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                let num: number
                if (pages <= 5) {
                  num = i + 1
                } else if (page <= 3) {
                  num = i + 1
                } else if (page >= pages - 2) {
                  num = pages - 4 + i
                } else {
                  num = page - 2 + i
                }
                return (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={cn(
                      'w-8 h-8 rounded text-sm font-medium transition-colors',
                      num === page
                        ? 'bg-brand-400 text-white'
                        : 'text-text-secondary hover:bg-brand-50'
                    )}
                  >
                    {num}
                  </button>
                )
              })}

              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded hover:bg-brand-50 text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCSVModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeCSVModal}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <button
              onClick={closeCSVModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-syne font-semibold text-brand-800 text-lg mb-1">
              Importar Productos CSV
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              El archivo debe tener las columnas:{' '}
              <span className="font-mono text-xs bg-brand-50 px-1 py-0.5 rounded">
                nombre, descripcion, categoria, precio_venta, precio_costo, stock_actual, stock_minimo, sku, unidad_medida
              </span>
            </p>

            {!csvResult ? (
              <>
                <div
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center mb-4 transition-colors',
                    selectedFile
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-surface-border hover:border-brand-400'
                  )}
                >
                  <input
                    type="file"
                    accept=".csv"
                    id="csv-input"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] ?? null
                      setSelectedFile(f)
                      setCsvError(null)
                    }}
                  />
                  <label htmlFor="csv-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-brand-400" />
                    {selectedFile ? (
                      <p className="text-sm font-medium text-brand-800">{selectedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-text-primary">
                          Hacer click para seleccionar
                        </p>
                        <p className="text-xs text-text-muted mt-1">Solo archivos .csv</p>
                      </>
                    )}
                  </label>
                </div>

                <div className="mb-4">
                  <button className="text-sm text-brand-400 hover:text-brand-700 underline">
                    Descargar plantilla de ejemplo
                  </button>
                </div>

                {csvError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{csvError}</p>
                  </div>
                )}

                <button
                  onClick={handleCSVImport}
                  disabled={!selectedFile || csvLoading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-400 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {csvLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importar
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-syne font-semibold text-green-700">
                      {csvResult.creados}
                    </p>
                    <p className="text-xs text-green-600 font-medium">Creados</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-syne font-semibold text-blue-700">
                      {csvResult.actualizados}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">Actualizados</p>
                  </div>
                  <div
                    className={cn(
                      'border rounded-xl p-3 text-center',
                      csvResult.errores.length > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    )}
                  >
                    <AlertCircle
                      className={cn(
                        'w-5 h-5 mx-auto mb-1',
                        csvResult.errores.length > 0 ? 'text-red-500' : 'text-gray-400'
                      )}
                    />
                    <p
                      className={cn(
                        'text-2xl font-syne font-semibold',
                        csvResult.errores.length > 0 ? 'text-red-700' : 'text-gray-500'
                      )}
                    >
                      {csvResult.errores.length}
                    </p>
                    <p
                      className={cn(
                        'text-xs font-medium',
                        csvResult.errores.length > 0 ? 'text-red-600' : 'text-gray-400'
                      )}
                    >
                      Errores
                    </p>
                  </div>
                </div>

                {csvResult.errores.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-text-primary mb-2">Detalle de errores:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {csvResult.errores.map((err, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2"
                        >
                          <span className="text-xs font-mono text-red-500 shrink-0 mt-0.5">
                            Fila {err.fila}
                          </span>
                          <span className="text-xs text-red-700">{err.motivo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={closeCSVModal}
                  className="w-full bg-brand-400 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
