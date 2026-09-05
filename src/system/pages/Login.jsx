import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { isSupabaseConfigured } from '../../lib/supabase.js'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const from = location.state?.from?.pathname || '/system'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate(from, { replace: true })
  }

  const inputClass =
    'w-full rounded-lg border border-canopy/20 bg-white px-3 py-2 outline-none focus:border-canopy'

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
        <div className="mb-6 flex items-center justify-center gap-2">
          <img src="/favicon.svg" alt="JKCanopy" className="h-10 w-10" />
          <span className="text-2xl font-bold text-canopy-dark">
            JK<span className="text-gold">Canopy</span>
          </span>
        </div>
        <h1 className="mb-1 text-center text-lg font-semibold text-canopy-dark">
          Management System
        </h1>
        <p className="mb-6 text-center text-sm text-canopy/70">Sistem Pengurusan</p>

        {!isSupabaseConfigured && (
          <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
            Supabase is not configured. Add your keys to <code>.env</code>.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-canopy-dark">Email</label>
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-canopy-dark">Password</label>
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-canopy px-5 py-2.5 font-semibold text-white transition hover:bg-canopy-dark disabled:opacity-60"
          >
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-canopy/70 hover:text-canopy"
        >
          &larr; Back to website
        </Link>
      </div>
    </div>
  )
}
