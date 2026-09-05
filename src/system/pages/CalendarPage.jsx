import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { PageHeader, Card, Button, EmptyState } from '../components/ui.jsx'

// Build a "Add to Google Calendar" link for an all-day event on the booking date.
function googleCalUrl(booking) {
  const date = (booking.event_date || '').replaceAll('-', '')
  if (!date) return '#'
  // All-day event: end date is the day after start (Google convention).
  const d = new Date(booking.event_date)
  d.setDate(d.getDate() + 1)
  const end = d.toISOString().slice(0, 10).replaceAll('-', '')

  const text = `JKCanopy: ${booking.customer_name} (${booking.booking_no})`
  const details = [
    `Booking: ${booking.booking_no}`,
    `Customer: ${booking.customer_name}`,
    `Phone: ${booking.phone || '-'}`,
    `Canopies: ${booking.canopies}, Chairs: ${booking.chairs}`,
    `Theme: ${booking.theme_colour || '-'} / Canopy: ${booking.canopy_colour || '-'}`,
  ].join('\n')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: `${date}/${end}`,
    details,
    location: booking.address || 'Kluang, Johor',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() } // month 0-indexed
  })

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

  // Group bookings by their event_date (YYYY-MM-DD).
  const byDate = useMemo(() => {
    const map = {}
    for (const b of bookings) {
      if (!b.event_date) continue
      map[b.event_date] = map[b.event_date] || []
      map[b.event_date].push(b)
    }
    return map
  }, [bookings])

  // Build the grid of days for the current month view.
  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1)
    const startDow = first.getDay()
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, iso, events: byDate[iso] || [] })
    }
    return cells
  }, [cursor, byDate])

  function move(delta) {
    setCursor((c) => {
      const m = c.month + delta
      const year = c.year + Math.floor(m / 12)
      const month = ((m % 12) + 12) % 12
      return { year, month }
    })
  }

  const todayIso = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Event dates - green means a booking that day"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => move(-1)}>&larr;</Button>
            <span className="min-w-40 text-center font-semibold text-canopy-dark">
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <Button variant="outline" onClick={() => move(1)}>&rarr;</Button>
          </div>
        }
      />

      {error && <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        {loading ? (
          <p className="text-sm text-canopy/60">Loading...</p>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-canopy/60">
              {DOW.map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {grid.map((cell, i) => {
                if (!cell) return <div key={i} className="min-h-24 rounded-lg" />
                const has = cell.events.length > 0
                const isToday = cell.iso === todayIso
                return (
                  <div
                    key={i}
                    className={`min-h-24 rounded-lg border p-1.5 text-left ${
                      has ? 'border-green-300 bg-green-50' : 'border-canopy/10 bg-white'
                    }`}
                  >
                    <div className={`text-xs font-semibold ${isToday ? 'text-gold' : 'text-canopy/70'}`}>
                      {cell.day}
                    </div>
                    <div className="mt-1 space-y-1">
                      {cell.events.map((b) => (
                        <a
                          key={b.id}
                          href={googleCalUrl(b)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Add to Google Calendar"
                          className="block truncate rounded bg-green-600 px-1 py-0.5 text-[10px] font-medium text-white hover:bg-green-700"
                        >
                          {b.customer_name}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {!loading && bookings.length === 0 && (
        <div className="mt-4">
          <EmptyState>
            No bookings to show.{' '}
            <Link to="/system/bookings/new" className="text-canopy underline">
              Create one
            </Link>
            .
          </EmptyState>
        </div>
      )}

      <p className="mt-4 text-xs text-canopy/60">
        Tip: click an event to add it to Google Calendar. Share one Google Calendar with your
        family so everyone sees the same event dates on their phones.
      </p>
    </div>
  )
}
