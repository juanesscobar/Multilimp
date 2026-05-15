'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { getToken } from '@/lib/api'
import Sidebar from '@/components/admin/Sidebar'
import QuickActions from '@/components/admin/QuickActions'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
    } else {
      setReady(true)
    }
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Barra superior móvil — solo visible en < lg */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-brand-800 z-30 flex items-center px-4 gap-3 border-b border-brand-700/50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-syne font-semibold text-white text-sm">
          {process.env.NEXT_PUBLIC_NOMBRE_NEGOCIO ?? 'MultiLimp'} — Admin
        </span>
      </div>

      {/* Overlay oscuro al abrir sidebar en móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenido principal: sin margen en móvil, con margen en desktop */}
      <main className="lg:ml-64 pt-14 min-h-screen">
        {children}
      </main>

      <QuickActions />
    </div>
  )
}
