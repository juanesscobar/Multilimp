'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import NextImage from 'next/image'
import Link from 'next/link'
import {
  Search,
  ShoppingBag,
  Plus,
  X,
  Minus,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useCart } from '@/components/catalogo/CartProvider'
import { formatGs, cn } from '@/lib/utils'
import type { Producto, Categoria, PaginatedProductos } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const NOMBRE_NEGOCIO = process.env.NEXT_PUBLIC_NOMBRE_NEGOCIO ?? 'MultiLimp'

async function fetchCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${API_URL}/catalogo/categorias`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function fetchProductos(params: {
  page: number
  limit: number
  search: string
  categoria_id: number | null
}): Promise<PaginatedProductos> {
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('limit', String(params.limit))
  if (params.search) q.set('search', params.search)
  if (params.categoria_id !== null) q.set('categoria_id', String(params.categoria_id))
  const res = await fetch(`${API_URL}/catalogo/productos?${q}`, { cache: 'no-store' })
  if (!res.ok) return { items: [], total: 0, page: 1, limit: 16, pages: 0 }
  return res.json()
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-2 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-1" />
      </div>
    </div>
  )
}

interface ProductCardProps {
  producto: Producto
  onOpenModal: (p: Producto) => void
  onAddToCart: (p: Producto) => void
  addingId: number | null
}

function ProductCard({ producto, onOpenModal, onAddToCart, addingId }: ProductCardProps) {
  const isUnavailable = producto.stop_venta || producto.stock_actual === 0
  const isAdding = addingId === producto.id

  return (
    <div
      className="bg-white rounded-xl border border-surface-border shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      onClick={() => onOpenModal(producto)}
    >
      <div className="aspect-square bg-brand-50 relative">
        {producto.imagen_url ? (
          <NextImage
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-brand-200" />
          </div>
        )}
        {producto.stop_venta && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-xl">
            <span className="text-white text-xs font-medium px-2 py-1 bg-black/40 rounded">
              No disponible
            </span>
          </div>
        )}
        {!producto.stop_venta && producto.stock_actual === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-xl">
            <span className="text-white text-xs font-medium px-2 py-1 bg-black/40 rounded">
              Sin stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-[10px] text-text-muted uppercase tracking-wide truncate">
          {producto.categoria?.nombre ?? '—'}
        </p>
        <p className="text-sm font-medium text-text-primary leading-tight line-clamp-2 mt-0.5">
          {producto.nombre}
        </p>
        <p className="font-syne font-semibold text-brand-800 text-base mt-1">
          {formatGs(producto.precio_venta)}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-text-muted">{producto.unidad_medida}</span>
          <button
            onClick={e => {
              e.stopPropagation()
              if (!isUnavailable) onAddToCart(producto)
            }}
            disabled={isUnavailable}
            className={cn(
              'bg-brand-400 text-white rounded-lg w-7 h-7 flex items-center justify-center hover:bg-brand-700 transition-colors',
              isUnavailable && 'opacity-50 cursor-not-allowed',
            )}
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ProductModalProps {
  producto: Producto
  onClose: () => void
}

function ProductModal({ producto, onClose }: ProductModalProps) {
  const { addItem, items } = useCart()
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const isUnavailable = producto.stop_venta || producto.stock_actual === 0
  const cartCount = items.reduce((s, i) => s + i.cantidad, 0)

  const handleAdd = async () => {
    if (isUnavailable) return
    setAdding(true)
    for (let i = 0; i < qty; i++) {
      addItem({
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_venta: producto.precio_venta,
        imagen_url: producto.imagen_url,
        unidad_medida: producto.unidad_medida,
      })
    }
    await new Promise(r => setTimeout(r, 400))
    setAdding(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl max-w-sm w-full mx-4 shadow-2xl overflow-hidden">
        <div className="aspect-square bg-brand-50 relative">
          {producto.imagen_url ? (
            <NextImage
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              className="object-contain"
              sizes="384px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-20 h-20 text-brand-200" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm transition-colors"
          >
            <X className="w-4 h-4 text-text-primary" />
          </button>
        </div>

        <div className="p-5">
          <span className="inline-block border border-surface-border rounded-md px-2 py-0.5 text-xs text-text-muted font-medium mb-2">
            {producto.categoria?.nombre ?? '—'}
          </span>

          <h2 className="font-syne font-semibold text-xl text-text-primary leading-tight">
            {producto.nombre}
          </h2>

          {producto.descripcion && (
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              {producto.descripcion}
            </p>
          )}

          <p className="font-syne font-semibold text-2xl text-brand-800 mt-3">
            {formatGs(producto.precio_venta)}
          </p>

          <p className="text-sm text-text-muted mt-1">
            Disponible: {producto.stock_actual} {producto.unidad_medida}
          </p>

          {isUnavailable && (
            <p className="text-sm text-red-600 font-medium mt-2">
              No disponible actualmente
            </p>
          )}

          {!isUnavailable && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-surface-border flex items-center justify-center hover:bg-brand-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-text-secondary" />
              </button>
              <span className="w-8 text-center text-base font-medium text-text-primary">
                {qty}
              </span>
              <button
                onClick={() => setQty(q => Math.min(producto.stock_actual, q + 1))}
                className="w-8 h-8 rounded-lg border border-surface-border flex items-center justify-center hover:bg-brand-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={isUnavailable || adding}
            className={cn(
              'mt-4 w-full bg-brand-400 text-white rounded-lg py-2.5 font-medium text-sm flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors',
              (isUnavailable || adding) && 'opacity-50 cursor-not-allowed',
            )}
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Agregando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Agregar al carrito
              </>
            )}
          </button>

          {cartCount > 0 && (
            <Link
              href="/carrito"
              className="mt-2 w-full border border-brand-400 text-brand-800 rounded-lg py-2.5 font-medium text-sm flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Ver carrito ({cartCount})
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CatalogoPage() {
  const { addItem } = useCart()

  const [productos, setProductos] = useState<PaginatedProductos>({
    items: [],
    total: 0,
    page: 1,
    limit: 16,
    pages: 0,
  })
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [modalProducto, setModalProducto] = useState<Producto | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchCategorias().then(setCategorias)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput])

  useEffect(() => {
    setLoading(true)
    fetchProductos({ page, limit: 16, search, categoria_id: categoriaFiltro })
      .then(data => setProductos(data))
      .finally(() => setLoading(false))
  }, [page, search, categoriaFiltro])

  const handleAddToCart = useCallback(
    async (producto: Producto) => {
      setAddingId(producto.id)
      addItem({
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_venta: producto.precio_venta,
        imagen_url: producto.imagen_url,
        unidad_medida: producto.unidad_medida,
      })
      await new Promise(r => setTimeout(r, 500))
      setAddingId(null)
    },
    [addItem],
  )

  const handleCategoriaFiltro = (id: number | null) => {
    setCategoriaFiltro(id)
    setPage(1)
  }

  const clearFilters = () => {
    setCategoriaFiltro(null)
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  return (
    <>
      <section className="bg-gradient-to-br from-brand-800 to-brand-400 text-white py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-syne font-semibold text-2xl md:text-3xl tracking-tight">
            {NOMBRE_NEGOCIO}
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Productos de limpieza para el hogar y la industria
          </p>
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-white/20 backdrop-blur border border-white/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/60 text-sm outline-none focus:border-white/60 transition-colors"
            />
          </div>
        </div>
      </section>

      <div className="px-4 py-4">
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2" style={{ flexWrap: 'nowrap' }}>
            <button
              onClick={() => handleCategoriaFiltro(null)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                categoriaFiltro === null
                  ? 'bg-brand-400 text-white font-medium'
                  : 'border border-surface-border text-text-secondary hover:bg-brand-50',
              )}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoriaFiltro(cat.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                  categoriaFiltro === cat.id
                    ? 'bg-brand-400 text-white font-medium'
                    : 'border border-surface-border text-text-secondary hover:bg-brand-50',
                )}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : productos.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="w-14 h-14 text-text-muted mb-4" />
            <p className="text-text-secondary font-medium text-base">
              No encontramos productos
            </p>
            <p className="text-text-muted text-sm mt-1">
              Intenta con otros filtros o términos de búsqueda
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 bg-brand-400 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Ver todo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {productos.items.map(producto => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onOpenModal={setModalProducto}
                onAddToCart={handleAddToCart}
                addingId={addingId}
              />
            ))}
          </div>
        )}

        {!loading && productos.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-lg border border-surface-border flex items-center justify-center hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            <span className="text-sm text-text-secondary font-medium">
              Página {page} de {productos.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(productos.pages, p + 1))}
              disabled={page === productos.pages}
              className="w-9 h-9 rounded-lg border border-surface-border flex items-center justify-center hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        )}
      </div>

      {modalProducto && (
        <ProductModal
          producto={modalProducto}
          onClose={() => setModalProducto(null)}
        />
      )}
    </>
  )
}
