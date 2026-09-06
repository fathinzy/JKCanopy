// Small shared UI building blocks for the management system pages.

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <div>
        <h1 className="text-xl font-bold text-canopy-dark sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-canopy/70">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5 ${className}`}>
      {children}
    </div>
  )
}

// Full-screen modal/drawer that works well on phones (slides up on mobile,
// centered dialog on larger screens).
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full ${maxWidth} flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between border-b border-canopy/10 px-5 py-3">
          <h2 className="font-semibold text-canopy-dark">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-canopy/60 hover:bg-canopy/10 hover:text-canopy"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-canopy text-white hover:bg-canopy-dark',
    gold: 'bg-gold text-canopy-dark hover:brightness-110',
    outline: 'border border-canopy/30 text-canopy hover:bg-canopy hover:text-white',
    danger: 'border border-red-300 text-red-600 hover:bg-red-600 hover:text-white',
  }
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export const inputClass =
  'w-full rounded-lg border border-canopy/20 bg-white px-3 py-2 text-sm outline-none focus:border-canopy'

export function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-canopy-dark">{label}</label>
      {children}
    </div>
  )
}

export function StatusBadge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-canopy/20 bg-white/60 p-10 text-center text-sm text-canopy/60">
      {children}
    </div>
  )
}

export function currency(n) {
  return `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
