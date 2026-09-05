import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  StatusBadge,
  currency,
} from '../components/ui.jsx'

const paymentOptions = [
  { id: 'unpaid', label: 'Unpaid', tone: 'red' },
  { id: 'deposit', label: 'Deposit Paid', tone: 'amber' },
  { id: 'balance', label: 'Balance Paid', tone: 'blue' },
  { id: 'settled', label: 'Fully Settled', tone: 'green' },
]

function paymentTone(status) {
  return paymentOptions.find((p) => p.id === status)?.tone ?? 'gray'
}
function paymentLabel(status) {
  return paymentOptions.find((p) => p.id === status)?.label ?? status
}

export default function BookingList() {
  const [bookings, setBookings] = useState([])
  const [workers, setWorkers] = useState([])
  const [assignments, setAssignments] = useState({}) // bookingId -> [worker_id]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  async function load() {
    setLoading(true)
    const [bRes, wRes, awRes] = await Promise.all([
      supabase.from('bookings').select('*').order('event_date', { ascending: true }),
      supabase.from('workers').select('id,name').order('name'),
      supabase.from('booking_workers').select('booking_id,worker_id'),
    ])
    if (bRes.error || wRes.error || awRes.error) {
      setError(bRes.error?.message || wRes.error?.message || awRes.error?.message)
      setLoading(false)
      return
    }
    setBookings(bRes.data ?? [])
    setWorkers(wRes.data ?? [])
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

  async function updatePayment(bookingId, status) {
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: status })
      .eq('id', bookingId)
    if (error) setError(error.message)
    else {
      setBookings((bs) =>
        bs.map((b) => (b.id === bookingId ? { ...b, payment_status: status } : b)),
      )
    }
  }

  async function toggleWorker(bookingId, workerId) {
    const current = assignments[bookingId] || []
    const isAssigned = current.includes(workerId)
    if (isAssigned) {
      const { error } = await supabase
        .from('booking_workers')
        .delete()
        .eq('booking_id', bookingId)
        .eq('worker_id', workerId)
      if (error) return setError(error.message)
    } else {
      const { error } = await supabase
        .from('booking_workers')
        .insert({ booking_id: bookingId, worker_id: workerId })
      if (error) return setError(error.message)
    }
    setAssignments((prev) => {
      const list = prev[bookingId] || []
      return {
        ...prev,
        [bookingId]: isAssigned ? list.filter((id) => id !== workerId) : [...list, workerId],
      }
    })
  }

  return (
    <div>
      <PageHeader
        title="Booking List"
        subtitle="Assign workers and update payment status"
        action={
          <Link to="/system/bookings/new">
            <Button variant="gold">+ New Booking</Button>
          </Link>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-canopy/60">Loading...</p>
      ) : bookings.length === 0 ? (
        <EmptyState>No bookings yet.</EmptyState>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const assigned = assignments[b.id] || []
            const isOpen = expanded === b.id
            return (
              <Card key={b.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-canopy-dark">{b.booking_no}</span>
                      <StatusBadge tone={paymentTone(b.payment_status)}>
                        {paymentLabel(b.payment_status)}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-canopy-dark">{b.customer_name}</p>
                    <p className="text-xs text-canopy/60">
                      {b.event_date} &middot; {b.canopies} canopy &middot; {b.chairs} chairs &middot;{' '}
                      {currency(b.total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={b.payment_status}
                      onChange={(e) => updatePayment(b.id, e.target.value)}
                      className="rounded-lg border border-canopy/20 bg-white px-2 py-1.5 text-sm outline-none focus:border-canopy"
                    >
                      {paymentOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => setExpanded(isOpen ? null : b.id)}
                    >
                      {isOpen ? 'Hide' : 'Assign'} ({assigned.length})
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 border-t border-canopy/10 pt-4">
                    <p className="mb-2 text-sm font-medium text-canopy-dark">Assign Workers</p>
                    {workers.length === 0 ? (
                      <p className="text-sm text-canopy/60">
                        No workers yet.{' '}
                        <Link to="/system/workers" className="text-canopy underline">
                          Add workers
                        </Link>
                        .
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {workers.map((w) => {
                          const on = assigned.includes(w.id)
                          return (
                            <button
                              key={w.id}
                              onClick={() => toggleWorker(b.id, w.id)}
                              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                on
                                  ? 'border-canopy bg-canopy text-white'
                                  : 'border-canopy/30 text-canopy hover:bg-canopy/10'
                              }`}
                            >
                              {on ? '\u2713 ' : ''}
                              {w.name}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
