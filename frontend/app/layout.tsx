import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_NOMBRE_NEGOCIO ?? 'Distribuidora Limpieza',
  description: 'Sistema de gestión de productos de limpieza',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
