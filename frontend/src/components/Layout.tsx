import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
      </svg>
    ),
  },
  {
    label: 'Resource Planner',
    path: '/resource-planner',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z" />
        <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14l-5-3z" />
        <path d="M21 5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    ),
  },
  {
    label: 'Talent Pool',
    path: '/employees',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Teams',
    path: '/teams',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22V12l8-4 8 4v10" />
        <path d="M12 2v6" />
        <path d="M4 10h16" />
      </svg>
    ),
  },
  {
    label: 'Transfers',
    path: '/transfers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16" />
        <path d="M4 17h16" />
        <path d="M20 7l-3-3-3 3" />
        <path d="M4 17l3 3 3-3" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19h16" />
        <path d="M7 15v4" />
        <path d="M12 11v8" />
        <path d="M17 7v12" />
      </svg>
    ),
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const roleColor: Record<string, string> = {
    vp: 'bg-purple-100 text-purple-700',
    director: 'bg-blue-100 text-blue-700',
    manager: 'bg-green-100 text-green-700',
  }

  return (
    <div className="relative flex h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 opacity-90" />
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />

      {/* Left Navbar */}
      <aside className="relative z-10 w-72 border-r border-slate-800/50 bg-white/85 backdrop-blur-xl shadow-2xl shadow-slate-950/15 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-200/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-500 shadow-lg shadow-red-500/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">WorkspaceHub</p>
              <p className="text-xs text-slate-500">Toyota Internal Mobility</p>
            </div>
          </div>
        </div>

        {/* User Details & Sign Out */}
        <div className="px-4 py-4 border-b border-slate-200/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm font-semibold shadow-sm">
                {user?.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-semibold ${roleColor[user?.role || ''] || 'bg-slate-100 text-slate-600'}`}>
                  {user?.role || 'USER'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 shadow-sm"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-2">
          {navItems.map(item => {
            const active = pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? 'bg-red-50 text-red-700 shadow-sm shadow-red-500/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-sm">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content - Right Side */}
      <main className="relative z-10 flex-1 overflow-auto scrollbar-thin">
        {children}
      </main>
    </div>
  )
}
