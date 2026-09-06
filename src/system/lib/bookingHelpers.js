// Shared helpers for bookings: payment status, worker WhatsApp message, formatting.

// Derive a payment status from the total and how much deposit/payment received.
// unpaid: nothing paid | deposit: some paid but < total | settled: paid >= total
export function derivePaymentStatus(total, paid) {
  const t = Number(total) || 0
  const p = Number(paid) || 0
  if (p <= 0) return 'unpaid'
  if (p >= t) return 'settled'
  return 'deposit'
}

export const paymentMeta = {
  unpaid: { label: 'Unpaid', tone: 'red' },
  deposit: { label: 'Deposit Paid', tone: 'amber' },
  balance: { label: 'Balance Paid', tone: 'blue' },
  settled: { label: 'Fully Settled', tone: 'green' },
}

// Sum a list of payment rows (each with an `amount`).
export function sumPayments(payments) {
  return (payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
}

// Balance still owed on a booking given its total and payments.
export function balanceOf(total, payments) {
  return Math.max(0, (Number(total) || 0) - sumPayments(payments))
}

export const bookingStatusMeta = {
  draft: { label: 'Draft', tone: 'gray' },
  confirmed: { label: 'Confirmed', tone: 'blue' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

// Normalise a Malaysian phone number into wa.me format (digits, 60 country code).
// Accepts inputs like "0177799290", "+60177799290", "017-779 9290".
export function toWaNumber(phone) {
  if (!phone) return ''
  let digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '60' + digits.slice(1)
  else if (!digits.startsWith('60')) digits = '60' + digits
  return digits
}

// Build a job-assignment WhatsApp message to send to a worker.
export function buildWorkerJobMessage(booking) {
  const lines = [
    '*JKCanopy - Job Assignment / Tugasan Kerja*',
    '',
    `Booking: ${booking.booking_no ?? ''}`,
    `Date / Tarikh: ${booking.event_date ?? '-'}`,
    `Customer / Pelanggan: ${booking.customer_name ?? ''}`,
    `Phone: ${booking.phone ?? '-'}`,
    `Address / Alamat: ${booking.address ?? '-'}`,
    `Canopies / Khemah: ${booking.canopies ?? 0}`,
    `Round tables: ${booking.round_tables ?? 0}, Long tables: ${booking.long_tables ?? 0}`,
    `Chairs / Kerusi: ${booking.chairs ?? 0}`,
    `Canopy colour: ${booking.canopy_colour ?? '-'}`,
  ]
  return lines.join('\n')
}

export function buildWorkerWaUrl(phone, booking) {
  const num = toWaNumber(phone)
  const text = encodeURIComponent(buildWorkerJobMessage(booking))
  return num ? `https://wa.me/${num}?text=${text}` : ''
}
