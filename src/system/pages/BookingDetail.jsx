import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import {
  derivePaymentStatus,
  bookingStatusMeta,
  buildWorkerWaUrl,
  sumPayments,
} from '../lib/bookingHelpers.js'
import { Modal, Button, Field, inputClass, currency, StatusBadge } from '../components/ui.jsx'
import LineItemsEditor, { summariseLines } from '../components/LineItemsEditor.jsx'

const todayIso = () => new Date().toISOString().slice(0, 10)
const themeColourOptions = ['Maroon', 'Gold', 'Green', 'Blue', 'Purple', 'Pink', 'White']
const canopyColourOptions = ['white', 'red', 'blue']
const statusOptions = ['draft', 'confirmed', 'completed', 'cancelled']

// Booking detail + edit panel shown in a modal.
// Props: booking, items, workers, assignments (worker ids), onClose, onSaved
export default function BookingDetail({ booking, items, workers, assignments, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState(() => ({ ...booking }))
  const [assigned, setAssigned] = useState(assignments || [])
  const [lines, setLines] = useState([])
  const [payments, setPayments] = useState([])
  const [newPayment, setNewPayment] = useState({ amount: '', paid_at: todayIso(), note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({ ...booking })
    setAssigned(assignments || [])
  }, [booking, assignments])

  // Load the payment ledger for this booking.
  async function loadPayments() {
    const { data, error } = await supabase
      .from('booking_payments')
      .select('*')
      .eq('booking_id', booking.id)
      .order('paid_at', { ascending: true })
    if (error) setError(error.message)
    else setPayments(data ?? [])
  }

  // Load the booking's line items.
  async function loadLines() {
    const { data, error } = await supabase
      .from('booking_items')
      .select('*')
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else
      setLines(
        (data ?? []).map((r) => ({
          item_id: r.item_id,
          name: r.name,
          category: r.category,
          qty: r.qty,
          unit_price: r.unit_price,
        })),
      )
  }

  useEffect(() => {
    loadPayments()
    loadLines()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.id])

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value })
  }

  // Total + canopy count derived from the current line items.
  const summary = summariseLines(lines)

  const totalPaid = sumPayments(payments)
  const balance = Math.max(0, summary.total - totalPaid)
  const currentPaymentStatus = derivePaymentStatus(summary.total, totalPaid)

  async function toggleWorker(worker) {
    const isOn = assigned.includes(worker.id)
    if (isOn) {
      const { error } = await supabase
        .from('booking_workers')
        .delete()
        .eq('booking_id', booking.id)
        .eq('worker_id', worker.id)
      if (error) return setError(error.message)
      setAssigned((a) => a.filter((id) => id !== worker.id))
    } else {
      const { error } = await supabase
        .from('booking_workers')
        .insert({ booking_id: booking.id, worker_id: worker.id })
      if (error) return setError(error.message)
      setAssigned((a) => [...a, worker.id])
      // After assigning, offer to notify the worker via WhatsApp.
      const url = buildWorkerWaUrl(
        worker.phone,
        { ...form, booking_no: booking.booking_no },
        lines.map((l) => ({ name: l.name, qty: l.qty })),
      )
      if (url) {
        if (window.confirm(`Assigned ${worker.name}. Send WhatsApp job message now?`)) {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
      } else {
        window.alert(`${worker.name} has no phone saved. Add one in the Workers module to send WhatsApp.`)
      }
    }
  }

  // Persist the booking's payment_status to match the ledger. Called after
  // any payment change so the list/dashboard stay in sync.
  async function syncPaymentStatus(paidTotal, total) {
    const status = derivePaymentStatus(total, paidTotal)
    await supabase
      .from('bookings')
      .update({ payment_status: status, deposit_paid: paidTotal })
      .eq('id', booking.id)
  }

  async function addPayment() {
    const amount = Number(newPayment.amount) || 0
    if (amount <= 0) {
      setError('Enter a payment amount greater than 0.')
      return
    }
    setError('')
    const { error } = await supabase.from('booking_payments').insert({
      booking_id: booking.id,
      amount,
      paid_at: newPayment.paid_at || todayIso(),
      note: newPayment.note?.trim() || null,
    })
    if (error) {
      setError(error.message)
      return
    }
    const newTotalPaid = totalPaid + amount
    await syncPaymentStatus(newTotalPaid, summary.total)
    setNewPayment({ amount: '', paid_at: todayIso(), note: '' })
    loadPayments()
  }

  async function deletePayment(id, amount) {
    if (!window.confirm('Remove this payment?')) return
    const { error } = await supabase.from('booking_payments').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    await syncPaymentStatus(Math.max(0, totalPaid - Number(amount || 0)), summary.total)
    loadPayments()
  }

  async function deleteBooking() {
    if (
      !window.confirm(
        `Delete booking ${booking.booking_no} permanently? This also removes its quotation, payments and worker assignments. This cannot be undone.`,
      )
    )
      return
    setSaving(true)
    setError('')
    // Related rows (quotation, payments, assignments) are removed automatically
    // via ON DELETE CASCADE foreign keys.
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onDeleted ? onDeleted() : onSaved()
  }

  async function save() {
    if (lines.length === 0) {
      setError('Add at least one item to the booking.')
      return
    }
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('bookings')
      .update({
        customer_name: form.customer_name?.trim(),
        phone: form.phone?.trim(),
        address: form.address?.trim(),
        event_date: form.event_date,
        theme_colour: form.theme_colour,
        canopy_colour: form.canopy_colour,
        canopies: summary.canopies,
        notes: form.notes?.trim(),
        status: form.status,
        // Recompute payment status against the (possibly changed) total.
        payment_status: derivePaymentStatus(summary.total, totalPaid),
        deposit_paid: totalPaid,
        total: summary.total,
      })
      .eq('id', booking.id)

    if (error) {
      setSaving(false)
      setError(error.message)
      return
    }

    // Replace the line items with the current set (simplest reliable sync).
    await supabase.from('booking_items').delete().eq('booking_id', booking.id)
    const itemRows = summary.rows.map((r) => ({ ...r, booking_id: booking.id }))
    if (itemRows.length > 0) {
      const { error: biErr } = await supabase.from('booking_items').insert(itemRows)
      if (biErr) {
        setSaving(false)
        setError(biErr.message)
        return
      }
    }

    // Keep the linked quotation in sync.
    await supabase
      .from('quotations')
      .update({ line_items: summary.rows, subtotal: summary.total, total: summary.total })
      .eq('booking_id', booking.id)

    setSaving(false)
    onSaved()
  }

  return (
    <Modal open onClose={onClose} title={`Booking ${booking.booking_no}`} maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={bookingStatusMeta[form.status]?.tone ?? 'gray'}>
            {bookingStatusMeta[form.status]?.label ?? form.status}
          </StatusBadge>
          <span className="text-sm text-canopy/60">Total {currency(summary.total)}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer Name">
            <input className={inputClass} value={form.customer_name ?? ''} onChange={set('customer_name')} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone ?? ''} onChange={set('phone')} />
          </Field>
        </div>

        <Field label="Address">
          <textarea className={inputClass} rows={2} value={form.address ?? ''} onChange={set('address')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Event Date">
            <input className={inputClass} type="date" value={form.event_date ?? ''} onChange={set('event_date')} />
          </Field>
          <Field label="Theme Colour">
            <select className={inputClass} value={form.theme_colour ?? ''} onChange={set('theme_colour')}>
              {themeColourOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Canopy Colour">
            <select className={inputClass} value={form.canopy_colour ?? 'white'} onChange={set('canopy_colour')}>
              {canopyColourOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Line items */}
        <div className="rounded-lg bg-sand/50 p-4">
          <p className="mb-2 text-sm font-medium text-canopy-dark">Items</p>
          <LineItemsEditor items={items} lines={lines} onChange={setLines} />
        </div>

        {/* Payment ledger */}
        <div className="rounded-lg bg-sand/60 p-4">
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs text-canopy/60">Total</p>
              <p className="font-semibold text-canopy-dark">{currency(summary.total)}</p>
            </div>
            <div>
              <p className="text-xs text-canopy/60">Paid</p>
              <p className="font-semibold text-canopy-dark">{currency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-canopy/60">Balance</p>
              <p className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {currency(balance)}
              </p>
            </div>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm font-medium text-canopy-dark">Payments</p>
            <StatusBadge
              tone={
                currentPaymentStatus === 'settled'
                  ? 'green'
                  : currentPaymentStatus === 'deposit'
                    ? 'amber'
                    : 'red'
              }
            >
              {currentPaymentStatus === 'settled'
                ? 'Fully Settled'
                : currentPaymentStatus === 'deposit'
                  ? 'Partly Paid'
                  : 'Unpaid'}
            </StatusBadge>
          </div>

          {/* Existing payment rows */}
          {payments.length === 0 ? (
            <p className="mb-3 text-sm text-canopy/50">No payments recorded yet.</p>
          ) : (
            <div className="mb-3 space-y-1.5">
              {payments.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-black/5"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-canopy-dark">
                      {i === 0 ? 'Deposit' : `Payment ${i + 1}`}
                    </span>
                    <span className="ml-2 text-xs text-canopy/60">
                      {p.paid_at}
                      {p.note ? ` \u00b7 ${p.note}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-canopy-dark">{currency(p.amount)}</span>
                    <button
                      onClick={() => deletePayment(p.id, p.amount)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add a payment (only while balance remains) */}
          {balance > 0 ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
              <Field label="Amount (RM)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder={balance.toFixed(2)}
                />
              </Field>
              <Field label="Date">
                <input
                  className={inputClass}
                  type="date"
                  value={newPayment.paid_at}
                  onChange={(e) => setNewPayment({ ...newPayment, paid_at: e.target.value })}
                />
              </Field>
              <Field label="Note">
                <input
                  className={inputClass}
                  value={newPayment.note}
                  onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                />
              </Field>
              <Button type="button" onClick={addPayment} className="h-[38px]">
                Add
              </Button>
            </div>
          ) : (
            <p className="text-sm font-medium text-green-600">Balance fully paid.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Booking Status">
            <select className={inputClass} value={form.status ?? 'confirmed'} onChange={set('status')}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{bookingStatusMeta[s]?.label ?? s}</option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <input className={inputClass} value={form.notes ?? ''} onChange={set('notes')} />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-canopy/50">
          Cancelled bookings are hidden from the calendar.
        </p>

        {/* Worker assignment */}
        <div className="border-t border-canopy/10 pt-4">
          <p className="mb-2 text-sm font-medium text-canopy-dark">Assign Workers</p>
          {workers.length === 0 ? (
            <p className="text-sm text-canopy/60">No workers yet. Add them in the Workers module.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {workers.map((w) => {
                const on = assigned.includes(w.id)
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWorker(w)}
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
          <p className="mt-2 text-xs text-canopy/50">
            Assigning a worker offers to send them a WhatsApp job message (needs their phone saved).
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-canopy/10 pt-4">
          <Button variant="danger" onClick={deleteBooking} disabled={saving}>
            Delete Booking
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="gold" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
