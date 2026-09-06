import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  StatusBadge,
  currency,
  inputClass,
} from '../components/ui.jsx'
import { paymentMeta, bookingStatusMeta } from '../lib/bookingHelpers.js'
import BookingDetail from './BookingDetail.jsx'

export default function BookingList() {
  const [bookings, setBookings] = useState([])
  const [workers, setWorkers] = useState([])
  const [items, setItems] = useState([])
  const [assignments, setAssignments] = useState({}) // bookingId -> [worker_id]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [payFilter, setPayFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    setLoading(true)
    const [bRes, wRes, iRes, awRes] = await Promise.all([
      supabase.from('bookings').select('*').order('event_date', { ascending: true }),
      supabase.from('workers').select('*').order('name'),
      supabase.from('items').select('*'),
      supabase.from('booking_workers').select('booking_id,worker_id'),
    ])
    const err = bRes.error || wRes.error || iRes.error || awRes.error
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setBookings(bRes.data ?? [])
    setWorkers(wRes.data ?? [])
    setItems(iRes.data ?? [])
    const map = {}
    for (const row of awRes.data ?? []) {
      map[row.booking_id] = map[row.booking_id] || []
      map[row.booking_id].push(row.worker_id)
    }
    setAssignments(map)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter((b) => {
      if (payFilter !== 'all' && b.payment_status !== payFilter) return false
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (q) {
        const hay = `${b.booking_no ?? ''} ${b.customer_name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [bookings, search, payFilter, statusFilter])

  const selectedBooking = bookings.find((b) => b.id === selected)

  return (
    <div>
      <PageHeader
        title="Booking List"
        subtitle="Tap a booking to view, edit, assign workers and record payment"
        action={
          <Link to="/system/bookings/new">
            <Button variant="gold">+ New Booking</Button>
          </Link>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Filters */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input
          className={inputClass}
          placeholder="Search booking no or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputClass} value={payFilter} onChange={(e) => setPayFilter(e.target.value)}>
          <option value="all">All payment status</option>
          {Object.entries(paymentMeta).map(([id, m]) => (
            <option key={id} value={id}>{m.label}</option>
          ))}
        </select>
        <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All booking status</option>
          {Object.entries(bookingStatusMeta).map(([id, m]) => (
            <option key={id} value={id}>{m.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-canopy/60">Loading...</p>
      ) : filtered.length === 0 ? (
        <EmptyState>No bookings match your filters.</EmptyState>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const assigned = assignments[b.id] || []
            const balance = Math.max(0, Number(b.total || 0) - Number(b.deposit_paid || 0))
            return (
              <Card key={b.id}>
                <button
                  onClick={() => setSelected(b.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-canopy-dark">{b.booking_no}</span>
                      <StatusBadge tone={bookingStatusMeta[b.status]?.tone ?? 'gray'}>
                        {bookingStatusMeta[b.status]?.label ?? b.status}
                      </StatusBadge>
                      <StatusBadge tone={paymentMeta[b.payment_status]?.tone ?? 'gray'}>
                        {paymentMeta[b.payment_status]?.label ?? b.payment_status}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 truncate text-sm text-canopy-dark">{b.customer_name}</p>
                    <p className="text-xs text-canopy/60">
                      {b.event_date} &middot; {b.canopies} canopy &middot; {assigned.length} worker(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-canopy-dark">{currency(b.total)}</p>
                    {balance > 0 ? (
                      <p className="text-xs text-red-600">Balance {currency(balance)}</p>
                    ) : (
                      <p className="text-xs text-green-600">Paid</p>
                    )}
                  </div>
                </button>
              </Card>
            )
          })}
        </div>
      )}

      {selectedBooking && (
        <BookingDetail
          booking={selectedBooking}
          items={items}
          workers={workers}
          assignments={assignments[selectedBooking.id] || []}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null)
            load()
          }}
          onDeleted={() => {
            setSelected(null)
            load()
          }}
        />
      )}
    </div>
  )
}
