import { CartProvider } from '@/components/catalogo/CartProvider'
import CatalogoHeader from '@/components/catalogo/CatalogoHeader'

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <CatalogoHeader />
        <main className="pt-14">
          {children}
        </main>
      </div>
    </CartProvider>
  )
}
