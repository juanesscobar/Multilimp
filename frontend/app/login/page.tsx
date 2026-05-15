'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken } from '@/lib/api'
import { Loader2, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login(email, password)
      setToken(res.access_token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-800 to-brand-400 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-brand-800 rounded-2xl p-3 mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-syne font-semibold text-2xl text-brand-800">Panel Admin</h1>
          <p className="text-text-secondary text-sm mt-1">
            {process.env.NEXT_PUBLIC_NOMBRE_NEGOCIO ?? 'Distribuidora Limpieza'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="admin@multilimp.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-400 text-white rounded-lg py-2.5 font-medium text-sm hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
