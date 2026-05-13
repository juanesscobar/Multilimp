'use client'
import Link from 'next/link'
import { ShoppingCart, Droplets } from 'lucide-react'
import { useCart } from './CartProvider'

export default function CatalogoHeader() {
  const { totalItems } = useCart()

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-surface-border z-40 flex items-center justify-between px-4">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-brand-800 rounded-lg p-1.5">
          <Droplets className="w-4 h-4 text-white" />
        </div>
        <span className="font-syne font-semibold text-brand-800 text-base leading-tight">
          {process.env.NEXT_PUBLIC_NOMBRE_NEGOCIO ?? 'MultiLimp'}
        </span>
      </Link>

      <Link href="/carrito" className="relative p-2 rounded-lg hover:bg-brand-50 transition-colors">
        <ShoppingCart className="w-5 h-5 text-brand-800" />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-brand-400 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </Link>
    </header>
  )
}
