import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext.jsx'

const navItems = [
  { to: '/system', label: 'Dashboard', end: true, icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/system/bookings/new', label: 'New Booking', icon: 'M12 5v14M5 12h14' },
  { to: '/system/bookings', label: 'Booking List', icon: 'M4 6h16M4 12h16M4 18h16' },
  { to: '/system/quotations', label: 'Quotations', icon: 'M6 2h9l5 5v15H6zM14 2v6h6' },
  { to: '/system/calendar', label: 'Calendar', icon: 'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4' },
  { to: '/system/workers', label: 'Workers', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0' },
  { to: '/system/payments', label: 'Payment Slips', icon: 'M3 7h18v10H3zM3 11h18' },
  { to: '/system/items', label: 'Items', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
]

export default function SystemLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/system/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-sand/50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-canopy-dark text-sand transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-4">
          <img src="/favicon.svg" alt="JKCanopy" className="h-8 w-8" />
          <span className="text-lg font-bold">
            JK<span className="text-gold">Canopy</span>
          </span>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-gold text-canopy-dark font-semibold' : 'text-sand/85 hover:bg-white/10'
                }`
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Main area */}
      <div className="md:ml-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-canopy/10 bg-white px-4 py-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-canopy-dark md:hidden"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-canopy/80 sm:inline">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-canopy/30 px-3 py-1.5 text-sm font-medium text-canopy transition hover:bg-canopy hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
