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
// `lineItems` is optional: [{ name, qty }] listing what's needed for the job.
export function buildWorkerJobMessage(booking, lineItems = []) {
  const msg = [
    '*JKCanopy - Job Assignment / Tugasan Kerja*',
    '',
    `Booking: ${booking.booking_no ?? ''}`,
    `Date / Tarikh: ${booking.event_date ?? '-'}`,
    `Customer / Pelanggan: ${booking.customer_name ?? ''}`,
    `Phone: ${booking.phone ?? '-'}`,
    `Address / Alamat: ${booking.address ?? '-'}`,
    `Canopy colour: ${booking.canopy_colour ?? '-'}`,
  ]
  if (lineItems && lineItems.length > 0) {
    msg.push('', 'Items:')
    for (const li of lineItems) {
      msg.push(`- ${li.name} x ${li.qty}`)
    }
  }
  return msg.join('\n')
}

export function buildWorkerWaUrl(phone, booking, lineItems = []) {
  const num = toWaNumber(phone)
  const text = encodeURIComponent(buildWorkerJobMessage(booking, lineItems))
  return num ? `https://wa.me/${num}?text=${text}` : ''
}
