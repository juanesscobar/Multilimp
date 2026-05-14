const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CategoriaSimple {
  id: number
  nombre: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  sku?: string
  categoria_id: number
  categoria?: CategoriaSimple
  precio_venta: number
  precio_costo?: number
  stock_actual: number
  stock_minimo: number
  stop_venta: boolean
  imagen_url?: string
  unidad_medida: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedProductos {
  total: number
  page: number
  limit: number
  pages: number
  items: Producto[]
}

export interface ItemVenta {
  id: number
  producto_id: number
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface Venta {
  id: number
  numero_venta: string
  cliente_nombre: string
  cliente_telefono?: string
  metodo_pago: 'efectivo' | 'transferencia' | 'alias' | 'otro'
  estado: 'pendiente' | 'confirmado' | 'cancelado'
  origen: 'admin' | 'catalogo'
  subtotal: number
  descuento: number
  total: number
  notas?: string
  created_at: string
  updated_at: string
  items: ItemVenta[]
}

export interface PaginatedVentas {
  total: number
  page: number
  limit: number
  pages: number
  items: Venta[]
}

export interface MovimientoStock {
  id: number
  producto_id: number
  producto_nombre: string
  tipo: 'entrada' | 'venta' | 'ajuste' | 'devolucion'
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  referencia_id?: number
  descripcion?: string
  created_at: string
}

export interface PaginatedMovimientos {
  total: number
  page: number
  limit: number
  pages: number
  items: MovimientoStock[]
}

export interface AlertaStock {
  producto_id: number
  nombre: string
  sku?: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  diferencia: number
}

export interface DashboardStats {
  ventas: {
    hoy: number
    semana: number
    mes: number
    hoy_cantidad: number
    semana_cantidad: number
    mes_cantidad: number
  }
  productos: {
    total_activos: number
    sin_stock: number
    stock_bajo: number
    con_stop_venta: number
  }
}

export interface VentaPorDia {
  fecha: string
  total: number
  cantidad: number
}

export interface TopProducto {
  producto_id: number
  nombre: string
  categoria: string
  unidades_vendidas: number
  total_vendido: number
}

export interface ImportCSVResult {
  creados: number
  actualizados: number
  errores: Array<{ fila: number; motivo: string }>
}

export interface ConfigPublica {
  nombre_negocio: string
  whatsapp_negocio: string
  alias_pago: string
  datos_transferencia: string
  nombre_banco: string
  nro_cuenta: string
  titular_cuenta: string
  cloudinary_habilitado: boolean
}

export interface ConfigAdmin {
  nombre_negocio: string
  whatsapp_negocio: string
  alias_pago: string
  datos_transferencia: string
  nombre_banco: string
  nro_cuenta: string
  titular_cuenta: string
}

// ─── Auth token helpers ────────────────────────────────────────────────────────

export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null

export const setToken = (token: string) => localStorage.setItem('token', token)

export const removeToken = () => localStorage.removeItem('token')

// ─── HTTP client ───────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    removeToken()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('No autorizado')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail ?? 'Error en la solicitud')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

async function requestForm<T>(path: string, formData: FormData, auth = true): Promise<T> {
  const headers: Record<string, string> = {}
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData })
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('No autorizado') }
  if (!res.ok) { const err = await res.json().catch(() => ({ detail: 'Error' })); throw new Error(err.detail ?? 'Error') }
  return res.json()
}

// ─── API methods ───────────────────────────────────────────────────────────────

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false),
    me: () => request<{ id: number; nombre: string; email: string; rol: string }>('/auth/me'),
  },

  // Config pública
  config: {
    get: () => request<ConfigPublica>('/config', {}, false),
  },

  // Configuración admin (requiere auth)
  configuracion: {
    get: () => request<ConfigAdmin>('/configuracion'),
    update: (data: Partial<ConfigAdmin>) =>
      request<ConfigAdmin>('/configuracion', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Categorías
  categorias: {
    list: (activo?: boolean) => {
      const q = activo !== undefined ? `?activo=${activo}` : ''
      return request<Categoria[]>(`/categorias${q}`)
    },
    create: (data: { nombre: string; descripcion?: string }) =>
      request<Categoria>('/categorias', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Categoria>) =>
      request<Categoria>(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Productos
  productos: {
    list: (params?: {
      page?: number; limit?: number; search?: string
      categoria_id?: number; stop_venta?: boolean; activo?: boolean
    }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.search) q.set('search', params.search)
      if (params?.categoria_id) q.set('categoria_id', String(params.categoria_id))
      if (params?.stop_venta !== undefined) q.set('stop_venta', String(params.stop_venta))
      if (params?.activo !== undefined) q.set('activo', String(params.activo))
      return request<PaginatedProductos>(`/productos?${q}`)
    },
    get: (id: number) => request<Producto>(`/productos/${id}`),
    create: (data: Partial<Producto>) =>
      request<Producto>('/productos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Producto>) =>
      request<Producto>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleStop: (id: number) =>
      request<Producto>(`/productos/${id}/stop-venta`, { method: 'PATCH' }),
    delete: (id: number) =>
      request<void>(`/productos/${id}`, { method: 'DELETE' }),
    importCSV: (file: File) => {
      const fd = new FormData(); fd.append('file', file)
      return requestForm<ImportCSVResult>('/productos/importar-csv', fd)
    },
    uploadImage: (id: number, file: File) => {
      const fd = new FormData(); fd.append('file', file)
      return requestForm<Producto>(`/productos/${id}/imagen`, fd)
    },
  },

  // Ventas
  ventas: {
    list: (params?: {
      page?: number; limit?: number; estado?: string
      metodo_pago?: string; origen?: string
      fecha_desde?: string; fecha_hasta?: string
    }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.estado) q.set('estado', params.estado)
      if (params?.metodo_pago) q.set('metodo_pago', params.metodo_pago)
      if (params?.origen) q.set('origen', params.origen)
      if (params?.fecha_desde) q.set('fecha_desde', params.fecha_desde)
      if (params?.fecha_hasta) q.set('fecha_hasta', params.fecha_hasta)
      return request<PaginatedVentas>(`/ventas?${q}`)
    },
    get: (id: number) => request<Venta>(`/ventas/${id}`),
    create: (data: {
      cliente_nombre: string; cliente_telefono?: string
      metodo_pago: string; descuento?: number; notas?: string
      origen: string; items: Array<{ producto_id: number; cantidad: number }>
    }) => request<Venta>('/ventas', { method: 'POST', body: JSON.stringify(data) }),
    changeEstado: (id: number, estado: string) =>
      request<Venta>(`/ventas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
    comprobante: (id: number) => request<any>(`/ventas/${id}/comprobante`, {}, false),
  },

  // Stock
  stock: {
    movimientos: (params?: { page?: number; limit?: number; producto_id?: number; tipo?: string }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.producto_id) q.set('producto_id', String(params.producto_id))
      if (params?.tipo) q.set('tipo', params.tipo)
      return request<PaginatedMovimientos>(`/stock/movimientos?${q}`)
    },
    entrada: (data: { producto_id: number; cantidad: number; descripcion?: string }) =>
      request<any>('/stock/entrada', { method: 'POST', body: JSON.stringify(data) }),
    ajuste: (data: { producto_id: number; stock_nuevo: number; descripcion?: string }) =>
      request<any>('/stock/ajuste', { method: 'POST', body: JSON.stringify(data) }),
    alertas: () => request<AlertaStock[]>('/stock/alertas'),
  },

  // Dashboard
  dashboard: {
    stats: () => request<DashboardStats>('/dashboard/stats'),
    ventasPorDia: (dias = 30) => request<VentaPorDia[]>(`/dashboard/ventas-por-dia?dias=${dias}`),
    topProductos: (limite = 10) => request<TopProducto[]>(`/dashboard/top-productos?limite=${limite}`),
  },
}
