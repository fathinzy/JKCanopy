import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { isSupabaseConfigured } from '../../lib/supabase.js'
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  StatusBadge,
  currency,
} from '../components/ui.jsx'

function StatCard({ label, value, tone = 'canopy' }) {
  const tones = {
    canopy: 'text-canopy-dark',
    gold: 'text-gold',
    green: 'text-green-600',
    red: 'text-red-600',
  }
  return (
    <Card>
      <p className="text-sm text-canopy/70">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tones[tone]}`}>{value}</p>
    </Card>
  )
}

const paymentLabels = {
  unpaid: 'Unpaid',
  deposit: 'Deposit Paid',
  balance: 'Balance Paid',
  settled: 'Fully Settled',
}
const paymentTones = {
  unpaid: 'red',
  deposit: 'amber',
  balance: 'blue',
  settled: 'green',
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('bookings')
      .select('*')
      .order('event_date', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setBookings(data ?? [])
        setLoading(false)
      })
  }, [])

  const todayIso = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => (b.event_date || '') >= todayIso)
    const pendingPayment = bookings.filter((b) => b.payment_status !== 'settled')
    const monthRevenue = bookings
      .filter((b) => (b.event_date || '').startsWith(monthKey))
      .reduce((sum, b) => sum + Number(b.total || 0), 0)
    return {
      upcomingCount: upcoming.length,
      upcoming: upcoming.slice(0, 6),
      pendingCount: pendingPayment.length,
      monthRevenue,
      totalBookings: bookings.length,
    }
  }, [bookings, todayIso, monthKey])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your bookings"
        action={
          <Link to="/system/bookings/new">
            <Button variant="gold">+ New Booking</Button>
          </Link>
        }
      />

      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
          Supabase is not configured. Add your keys to <code>.env</code> and run the schema in
          the Supabase SQL editor.
        </p>
      )}
      {error && <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming Events" value={loading ? '-' : stats.upcomingCount} />
        <StatCard label="Pending Payment" value={loading ? '-' : stats.pendingCount} tone="red" />
        <StatCard
          label="This Month Revenue"
          value={loading ? '-' : currency(stats.monthRevenue)}
          tone="gold"
        />
        <StatCard label="Total Bookings" value={loading ? '-' : stats.totalBookings} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-semibold text-canopy-dark">Upcoming Events</h2>
        {loading ? (
          <p className="text-sm text-canopy/60">Loading...</p>
        ) : stats.upcoming.length === 0 ? (
          <EmptyState>No upcoming events.</EmptyState>
        ) : (
          <div className="space-y-2">
            {stats.upcoming.map((b) => (
              <Card key={b.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-canopy-dark">{b.booking_no}</span>
                    <StatusBadge tone={paymentTones[b.payment_status] ?? 'gray'}>
                      {paymentLabels[b.payment_status] ?? b.payment_status}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-canopy-dark">{b.customer_name}</p>
                  <p className="text-xs text-canopy/60">
                    {b.event_date} &middot; {b.canopies} canopy &middot; {b.chairs} chairs
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-canopy-dark">{currency(b.total)}</p>
                  <Link to="/system/bookings" className="text-xs text-canopy underline">
                    View bookings
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
