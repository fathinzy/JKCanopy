// Analytics helpers for the dashboard.
// Drill-down logic:
//   year = 'all'            -> bucket by YEAR   (label: "2025")
//   year = 2025, month=all  -> bucket by MONTH  (label: "Jan".."Dec")
//   year = 2025, month = 3  -> bucket by DAY    (label: "1".."31")

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Parse a YYYY-MM-DD string into {y, m (1-12), d}. Returns null if invalid.
export function parseDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10))
  if (!y || !m || !d) return null
  return { y, m, d }
}

// Does a booking fall inside the selected year/month filter?
export function inFilter(booking, year, month) {
  const p = parseDate(booking.event_date)
  if (!p) return false
  if (year !== 'all' && p.y !== Number(year)) return false
  if (month !== 'all' && p.m !== Number(month)) return false
  return true
}

// The distinct years present in the data (descending), for the year dropdown.
export function availableYears(bookings) {
  const set = new Set()
  for (const b of bookings) {
    const p = parseDate(b.event_date)
    if (p) set.add(p.y)
  }
  return Array.from(set).sort((a, b) => b - a)
}

// Determine which bucketing mode applies for the current filter.
export function bucketMode(year, month) {
  if (year === 'all') return 'year'
  if (month === 'all') return 'month'
  return 'day'
}

// Build chart data: an array of { label, revenue, canopies } bucketed by the
// current drill-down mode. Includes empty buckets so the axis is continuous.
export function buildTrend(bookings, year, month) {
  const mode = bucketMode(year, month)
  const filtered = bookings.filter((b) => inFilter(b, year, month))

  const buckets = new Map() // key -> { label, revenue, canopies, order }

  function ensure(key, label, order) {
    if (!buckets.has(key)) buckets.set(key, { label, revenue: 0, canopies: 0, order })
    return buckets.get(key)
  }

  if (mode === 'month') {
    for (let m = 1; m <= 12; m++) ensure(m, MONTH_NAMES[m - 1], m)
  } else if (mode === 'day') {
    const y = Number(year)
    const m = Number(month)
    const daysInMonth = new Date(y, m, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) ensure(d, String(d), d)
  }

  for (const b of filtered) {
    const p = parseDate(b.event_date)
    if (!p) continue
    let key, label, order
    if (mode === 'year') {
      key = p.y
      label = String(p.y)
      order = p.y
    } else if (mode === 'month') {
      key = p.m
      label = MONTH_NAMES[p.m - 1]
      order = p.m
    } else {
      key = p.d
      label = String(p.d)
      order = p.d
    }
    const row = ensure(key, label, order)
    row.revenue += Number(b.total || 0)
    row.canopies += Number(b.canopies || 0)
  }

  return Array.from(buckets.values()).sort((a, b) => a.order - b.order)
}

// Worker aggregates over the filter window.
// slips: payment_slips rows with lines (payment_slip_bookings joined to booking event_date)
// Returns [{ name, salary, jobs }] filtered/aggregated by year+month.
export function buildWorkerStats(workers, bookingWorkers, bookings, slipLines, year, month) {
  const bookingById = new Map(bookings.map((b) => [b.id, b]))

  const stats = new Map()
  for (const w of workers) stats.set(w.id, { id: w.id, name: w.name, salary: 0, jobs: 0 })

  // Jobs assigned: count bookings (in filter) assigned to each worker.
  for (const bw of bookingWorkers) {
    const booking = bookingById.get(bw.booking_id)
    if (!booking || !inFilter(booking, year, month)) continue
    const s = stats.get(bw.worker_id)
    if (s) s.jobs += 1
  }

  // Salary: sum of payment_slip_bookings amounts where the linked booking is in filter.
  for (const line of slipLines) {
    const booking = bookingById.get(line.booking_id)
    if (!booking || !inFilter(booking, year, month)) continue
    const s = stats.get(line.worker_id)
    if (s) s.salary += Number(line.amount || 0)
  }

  return Array.from(stats.values())
}
