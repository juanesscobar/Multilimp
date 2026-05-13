import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGs(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'Gs. 0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'Gs. 0'
  return `Gs. ${Math.round(num).toLocaleString('es-PY').replace(/,/g, '.')}`
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-PY', {
    timeZone: 'America/Asuncion',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateOnly(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-PY', {
    timeZone: 'America/Asuncion',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'confirmado': return 'bg-green-100 text-green-700'
    case 'pendiente':  return 'bg-yellow-100 text-yellow-700'
    case 'cancelado':  return 'bg-red-100 text-red-700'
    default:           return 'bg-gray-100 text-gray-700'
  }
}

export function metodoPagoLabel(metodo: string): string {
  const labels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    alias: 'Alias',
    otro: 'Otro',
  }
  return labels[metodo] ?? metodo
}

export function tipoMovimientoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    entrada: 'Entrada',
    venta: 'Venta',
    ajuste: 'Ajuste',
    devolucion: 'Devolución',
  }
  return labels[tipo] ?? tipo
}

export function tipoMovimientoClass(tipo: string): string {
  switch (tipo) {
    case 'entrada':    return 'bg-green-100 text-green-700'
    case 'venta':      return 'bg-blue-100 text-blue-700'
    case 'ajuste':     return 'bg-yellow-100 text-yellow-700'
    case 'devolucion': return 'bg-purple-100 text-purple-700'
    default:           return 'bg-gray-100 text-gray-700'
  }
}

export function truncate(str: string, max = 40): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}
