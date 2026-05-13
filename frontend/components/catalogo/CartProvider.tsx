'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface CartItem {
  producto_id: number
  nombre: string
  precio_venta: number
  imagen_url?: string
  cantidad: number
  unidad_medida: string
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'cantidad'>) => void
  removeItem: (producto_id: number) => void
  updateQty: (producto_id: number, cantidad: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'multilimp_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addItem = useCallback((newItem: Omit<CartItem, 'cantidad'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.producto_id === newItem.producto_id)
      if (existing) {
        return prev.map(i =>
          i.producto_id === newItem.producto_id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [...prev, { ...newItem, cantidad: 1 }]
    })
  }, [])

  const removeItem = useCallback((producto_id: number) => {
    setItems(prev => prev.filter(i => i.producto_id !== producto_id))
  }, [])

  const updateQty = useCallback((producto_id: number, cantidad: number) => {
    if (cantidad <= 0) {
      setItems(prev => prev.filter(i => i.producto_id !== producto_id))
    } else {
      setItems(prev =>
        prev.map(i => i.producto_id === producto_id ? { ...i, cantidad } : i)
      )
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0)
  const totalPrice = items.reduce((s, i) => s + i.precio_venta * i.cantidad, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
