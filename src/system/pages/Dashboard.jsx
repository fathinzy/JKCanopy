import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js'
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  StatusBadge,
  Modal,
  currency,
  inputClass,
} from '../components/ui.jsx'
import { paymentMeta } from '../lib/bookingHelpers.js'
import {
  MONTH_NAMES,
  availableYears,
  inFilter,
  buildTrend,
  buildWorkerStats,
} from '../lib/analytics.js'

function StatCard({ label, value, tone = 'canopy', onClick }) {
  const tones = {
    canopy: 'text-canopy-dark',
    gold: 'text-gold',
    green: 'text-green-600',
    red: 'text-red-600',
  }
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:ring-canopy/30 sm:p-5"
    >
      <p className="text-sm text-canopy/70">{label}</p>
      <p className={`mt-1 text-2xl font-bold sm:text-3xl ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-canopy/40">Tap for details</p>
    </button>
  )
}

const chartColors = { revenue: '#8b5e34', canopies: '#c9a24b', salary: '#2f5d3a', jobs: '#1f4e79' }

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [workers, setWorkers] = useState([])
  const [bookingWorkers, setBookingWorkers] = useState([])
  const [slipLines, setSlipLines] = useState([]) // {worker_id, booking_id, amount}
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [year, setYear] = useState('all')
  const [month, setMonth] = useState('all')
  const [workerFilter, setWorkerFilter] = useState('all')
  const [detail, setDetail] = useState(null) // 'upcoming' | 'pending' | 'revenue' | 'total'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [bRes, wRes, bwRes, slipRes] = await Promise.all([
        supabase.from('bookings').select('*').order('event_date', { ascending: true }),
        supabase.from('workers').select('id,name').order('name'),
        supabase.from('booking_workers').select('booking_id,worker_id'),
        supabase.from('payment_slips').select('worker_id, lines:payment_slip_bookings(booking_id,amount)'),
      ])
      const err = bRes.error || wRes.error || bwRes.error || slipRes.error
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      setBookings(bRes.data ?? [])
      setWorkers(wRes.data ?? [])
      setBookingWorkers(bwRes.data ?? [])
      // Flatten slip lines to {worker_id, booking_id, amount}.
      const lines = []
      for (const s of slipRes.data ?? []) {
        for (const l of s.lines ?? []) {
          lines.push({ worker_id: s.worker_id, booking_id: l.booking_id, amount: l.amount })
        }
      }
      setSlipLines(lines)
      setLoading(false)
    }
    load()
  }, [])

  const years = useMemo(() => availableYears(bookings), [bookings])
  const todayIso = new Date().toISOString().slice(0, 10)

  // Bookings within the current year/month filter.
  const filtered = useMemo(
    () => bookings.filter((b) => inFilter(b, year, month)),
    [bookings, year, month],
  )

  const stats = useMemo(() => {
    const upcoming = bookings.filter(
      (b) => (b.event_date || '') >= todayIso && b.status !== 'cancelled',
    )
    const pending = filtered.filter(
      (b) =>
        b.status !== 'cancelled' &&
        Number(b.deposit_paid || 0) < Number(b.total || 0),
    )
    const active = filtered.filter((b) => b.status !== 'cancelled')
    const revenue = active.reduce((sum, b) => sum + Number(b.total || 0), 0)
    return {
      upcoming,
      pending,
      revenue,
      total: active.length,
      allForPeriod: active,
    }
  }, [bookings, filtered, todayIso])

  const trend = useMemo(() => buildTrend(bookings, year, month), [bookings, year, month])

  const workerStats = useMemo(() => {
    const all = buildWorkerStats(workers, bookingWorkers, bookings, slipLines, year, month)
    if (workerFilter === 'all') return all
    return all.filter((w) => w.id === workerFilter)
  }, [workers, bookingWorkers, bookings, slipLines, year, month, workerFilter])

  const periodLabel =
    year === 'all'
      ? 'All years'
      : month === 'all'
        ? `Year ${year}`
        : `${MONTH_NAMES[Number(month) - 1]} ${year}`

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={periodLabel}
        action={
          <Link to="/system/bookings/new">
            <Button variant="gold">+ New Booking</Button>
          </Link>
        }
      />

      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
          Supabase is not configured. Add your keys to <code>.env</code>.
        </p>
      )}
      {error && <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Filters */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:max-w-md">
        <select
          className={inputClass}
          value={year}
          onChange={(e) => {
            setYear(e.target.value)
            setMonth('all') // reset month when year changes
          }}
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className={inputClass}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={year === 'all'}
        >
          <option value="all">All months</option>
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming Events" value={loading ? '-' : stats.upcoming.length} onClick={() => setDetail('upcoming')} />
        <StatCard label="Pending Payment" value={loading ? '-' : stats.pending.length} tone="red" onClick={() => setDetail('pending')} />
        <StatCard label="Revenue" value={loading ? '-' : currency(stats.revenue)} tone="gold" onClick={() => setDetail('revenue')} />
        <StatCard label="Total Bookings" value={loading ? '-' : stats.total} onClick={() => setDetail('total')} />
      </div>

      {/* Two-column analytics */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* LEFT: revenue + canopy trend */}
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-canopy-dark">Revenue Trend</h2>
            <ChartFrame loading={loading} hasData={trend.length > 0}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={48} />
                <Tooltip formatter={(v) => currency(v)} />
                <Line type="monotone" dataKey="revenue" stroke={chartColors.revenue} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartFrame>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-canopy-dark">Canopy Orders</h2>
            <ChartFrame loading={loading} hasData={trend.length > 0}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={36} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="canopies" fill={chartColors.canopies} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartFrame>
          </Card>
        </div>

        {/* RIGHT: worker stats */}
        <div className="space-y-6">
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-canopy-dark">Worker Salary</h2>
              <select
                className="rounded-lg border border-canopy/20 bg-white px-2 py-1.5 text-sm outline-none focus:border-canopy"
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
              >
                <option value="all">All workers</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <ChartFrame loading={loading} hasData={workerStats.length > 0}>
              <BarChart data={workerStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={48} />
                <Tooltip formatter={(v) => currency(v)} />
                <Bar dataKey="salary" fill={chartColors.salary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartFrame>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-canopy-dark">Jobs Assigned</h2>
            <ChartFrame loading={loading} hasData={workerStats.length > 0}>
              <BarChart data={workerStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={36} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="jobs" fill={chartColors.jobs} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartFrame>
          </Card>
        </div>
      </div>

      {/* Detail modal for stat cards */}
      <DetailModal
        detail={detail}
        stats={stats}
        periodLabel={periodLabel}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}

// Wraps a Recharts chart with loading / empty handling and a fixed height.
function ChartFrame({ loading, hasData, children }) {
  if (loading) return <p className="py-10 text-center text-sm text-canopy/60">Loading...</p>
  if (!hasData) return <p className="py-10 text-center text-sm text-canopy/50">No data for this period.</p>
  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  )
}

function DetailModal({ detail, stats, periodLabel, onClose }) {
  if (!detail) return null
  const titles = {
    upcoming: 'Upcoming Events',
    pending: 'Pending Payment',
    revenue: 'Revenue Breakdown',
    total: 'All Bookings',
  }
  const rows =
    detail === 'upcoming'
      ? stats.upcoming
      : detail === 'pending'
        ? stats.pending
        : stats.allForPeriod // revenue + total both show the full period list

  return (
    <Modal open onClose={onClose} title={`${titles[detail]} - ${periodLabel}`}>
      {rows.length === 0 ? (
        <EmptyState>Nothing to show.</EmptyState>
      ) : (
        <div className="space-y-2">
          {rows.map((b) => {
            const balance = Math.max(0, Number(b.total || 0) - Number(b.deposit_paid || 0))
            return (
              <Link
                key={b.id}
                to="/system/bookings"
                onClick={onClose}
                className="block rounded-lg border border-canopy/10 p-3 hover:bg-sand/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-canopy-dark">{b.booking_no}</span>
                    <span className="ml-2 text-xs text-canopy/60">{b.customer_name}</span>
                  </div>
                  <StatusBadge tone={paymentMeta[b.payment_status]?.tone ?? 'gray'}>
                    {paymentMeta[b.payment_status]?.label ?? b.payment_status}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-canopy/60">
                  {b.event_date} &middot; {currency(b.total)}
                  {balance > 0 && detail !== 'upcoming' ? ` \u00b7 Balance ${currency(balance)}` : ''}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
