import { NavLink, Outlet } from 'react-router-dom'
import { CalendarRange, HardHat, Users, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Asignaciones', icon: CalendarRange, end: true },
  { to: '/obras', label: 'Obras', icon: HardHat },
  { to: '/operarios', label: 'Operarios', icon: Users },
]

export default function Layout() {
  const { session, signOut } = useAuth()
  const email = session?.user?.email || ''
  const initial = email ? email[0].toUpperCase() : '?'

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bp-bg)' }}>
      <aside
        className="w-64 shrink-0 hidden md:flex flex-col justify-between py-6 px-4"
        style={{ background: '#fff', borderRight: '1px solid var(--bp-line)' }}
      >
        <div>
          <div className="flex items-center gap-3 px-2 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg"
              style={{ background: 'var(--bp-red)' }}
            >
              bp
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-[15px]">Obras & Servicios</div>
              <div className="text-xs" style={{ color: 'var(--bp-muted)' }}>
                Obras / RRHH
              </div>
            </div>
          </div>

          <div
            className="text-[11px] font-semibold tracking-wide px-3 mb-2"
            style={{ color: 'var(--bp-muted)' }}
          >
            PLANIFICACIÓN
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive ? '' : 'hover:bg-[#f5f6f8]'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        background: 'var(--bp-red-tint)',
                        color: 'var(--bp-red)',
                      }
                    : { color: 'var(--bp-ink-soft)' }
                }
              >
                <Icon size={18} strokeWidth={2.1} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="px-2">
          <div
            className="flex items-center gap-3 p-2 rounded-lg"
            style={{ border: '1px solid var(--bp-line)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ background: 'var(--bp-red-tint)', color: 'var(--bp-red)' }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{email}</div>
              <div className="text-xs" style={{ color: 'var(--bp-muted)' }}>
                Sesión activa
              </div>
            </div>
            <button
              onClick={signOut}
              title="Cerrar sesión"
              className="p-1.5 rounded-md hover:bg-[#f5f6f8] shrink-0"
              style={{ color: 'var(--bp-muted)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
