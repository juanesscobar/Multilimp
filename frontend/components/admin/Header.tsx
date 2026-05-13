'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { User, Bell } from 'lucide-react'

interface Props {
  title: string
}

export default function Header({ title }: Props) {
  const [nombre, setNombre] = useState('')
  const [alertas, setAlertas] = useState(0)

  useEffect(() => {
    api.auth.me().then(u => setNombre(u.nombre)).catch(() => {})
    api.stock.alertas().then(a => setAlertas(a.length)).catch(() => {})
  }, [])

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-white border-b border-surface-border flex items-center justify-between px-6 z-20">
      <h1 className="font-syne font-semibold text-brand-800 text-lg">{title}</h1>
      <div className="flex items-center gap-3">
        {alertas > 0 && (
          <div className="relative">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {alertas > 9 ? '9+' : alertas}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="bg-brand-100 rounded-full p-1.5">
            <User className="w-3.5 h-3.5 text-brand-800" />
          </div>
          <span className="font-medium text-text-primary">{nombre || '…'}</span>
        </div>
      </div>
    </header>
  )
}
