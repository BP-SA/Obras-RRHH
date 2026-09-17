import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Usuario o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Intentá de nuevo.'
      )
    }
  }

  return (
    <div className="min-h-screen w-full grid md:grid-cols-[1.1fr_1fr]" style={{ background: 'var(--bp-bg)' }}>
      {/* Panel de marca */}
      <div
        className="hidden md:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, var(--bp-red) 0%, var(--bp-red-dark) 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img src="/bp-logo.png" alt="BP" className="w-full h-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold">Obras & Servicios</div>
            <div className="text-white/70 text-sm">BP Soluciones Eléctricas</div>
          </div>
        </div>

        <div className="max-w-sm">
          <h1 className="text-4xl font-bold leading-[1.15] mb-4">
            Quién está, dónde y cuándo.
          </h1>
          <p className="text-white/80 leading-relaxed">
            Asigná operarios a cada obra por día o por rango de fechas, y compartí la
            planificación con RRHH en un mismo lugar.
          </p>
        </div>

        <div className="text-white/60 text-sm">
          Uso interno · Obras, Constructoras, Minería, Obra Pública
        </div>

        <div
          className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid var(--bp-line)' }}
        >
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              <img src="/bp-logo.png" alt="BP" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold">Obras & Servicios</span>
          </div>

          <h2 className="text-xl font-semibold mb-1">Ingresar</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--bp-muted)' }}>
            Usá tu usuario de BP para acceder.
          </p>

          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-3.5 py-2.5 mb-4 text-sm outline-none focus:border-[var(--bp-red)]"
            style={{ border: '1px solid var(--bp-line)' }}
            placeholder="nombre.apellido@bpsa.com.ar"
          />

          <label className="block text-sm font-medium mb-1.5">Contraseña</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg px-3.5 py-2.5 mb-2 text-sm outline-none focus:border-[var(--bp-red)]"
            style={{ border: '1px solid var(--bp-line)' }}
            placeholder="••••••••"
          />

          {error && (
            <p className="text-sm mt-2 mb-2" style={{ color: 'var(--bp-red)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded-lg py-2.5 font-semibold text-white text-sm transition disabled:opacity-60"
            style={{ background: 'var(--bp-red)' }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="text-xs mt-5 text-center" style={{ color: 'var(--bp-muted)' }}>
            ¿No tenés cuenta? Pedile a un administrador que te cree un usuario.
          </p>
        </form>
      </div>
    </div>
  )
}
