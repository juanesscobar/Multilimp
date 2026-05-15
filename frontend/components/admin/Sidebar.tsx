'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart,
  Warehouse, LogOut, Droplets, Settings, ExternalLink, X
} from 'lucide-react'
import { removeToken } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { href: '/stock', label: 'Stock', icon: Warehouse },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    removeToken()
    router.push('/login')
  }

  function handleNav() {
    onClose()
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 w-64 bg-brand-800 flex flex-col z-50 transition-transform duration-200 ease-in-out',
        // En desktop siempre visible; en móvil depende del estado open
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Logo + botón cerrar en móvil */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-brand-700/50">
        <div className="flex items-center gap-3">
          <div className="bg-brand-400 rounded-xl p-2">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-syne font-semibold text-white text-sm leading-tight block">
              {process.env.NEXT_PUBLIC_NOMBRE_NEGOCIO?.split(' ').slice(0, 2).join(' ') ?? 'MultiLimp'}
            </span>
            <span className="text-brand-200 text-xs">Panel Admin</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-brand-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNav}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-brand-400/20 text-white'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white transition-all mt-2"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          Ver Catálogo
        </a>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-brand-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
