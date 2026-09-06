import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { buildQuote } from '../lib/quote.js'
import {
  derivePaymentStatus,
  bookingStatusMeta,
  buildWorkerWaUrl,
} from '../lib/bookingHelpers.js'
import { Modal, Button, Field, inputClass, currency, StatusBadge } from '../components/ui.jsx'

const CHAIRS_PER_TABLE = 8
const themeColourOptions = ['Maroon', 'Gold', 'Green', 'Blue', 'Purple', 'Pink', 'White']
const canopyColourOptions = ['white', 'red', 'blue']
const statusOptions = ['draft', 'confirmed', 'completed', 'cancelled']

// Booking detail + edit panel shown in a modal.
// Props: booking, items, workers, assignments (worker ids), onClose, onSaved
export default function BookingDetail({ booking, items, workers, assignments, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...booking }))
  const [assigned, setAssigned] = useState(assignments || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({ ...booking })
    setAssigned(assignments || [])
  }, [booking, assignments])

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value })
  }
  function setNum(key) {
    return (e) => setForm({ ...form, [key]: Math.max(0, parseInt(e.target.value, 10) || 0) })
  }

  // Recompute total from current quantities + item prices whenever they change.
  const quote = useMemo(
    () =>
      buildQuote(
        {
          canopies: form.canopies,
          round_tables: form.round_tables,
          long_tables: form.long_tables,
          chairs: form.chairs,
        },
        items,
      ),
    [form.canopies, form.round_tables, form.long_tables, form.chairs, items],
  )

  const balance = Math.max(0, quote.total - (Number(form.deposit_paid) || 0))

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
      const url = buildWorkerWaUrl(worker.phone, { ...form, booking_no: booking.booking_no })
      if (url) {
        if (window.confirm(`Assigned ${worker.name}. Send WhatsApp job message now?`)) {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
      } else {
        window.alert(`${worker.name} has no phone saved. Add one in the Workers module to send WhatsApp.`)
      }
    }
  }

  async function save() {
    setSaving(true)
    setError('')
    const paymentStatus = derivePaymentStatus(quote.total, form.deposit_paid)
    const { error } = await supabase
      .from('bookings')
      .update({
        customer_name: form.customer_name?.trim(),
        phone: form.phone?.trim(),
        address: form.address?.trim(),
        event_date: form.event_date,
        theme_colour: form.theme_colour,
        canopy_colour: form.canopy_colour,
        canopies: Number(form.canopies),
        round_tables: Number(form.round_tables),
        long_tables: Number(form.long_tables),
        chairs: Number(form.chairs),
        notes: form.notes?.trim(),
        deposit_paid: Number(form.deposit_paid) || 0,
        status: form.status,
        payment_status: paymentStatus,
        total: quote.total,
      })
      .eq('id', booking.id)

    if (error) {
      setSaving(false)
      setError(error.message)
      return
    }

    // Keep the linked quotation in sync with the edited quantities.
    await supabase
      .from('quotations')
      .update({ line_items: quote.lineItems, subtotal: quote.subtotal, total: quote.total })
      .eq('booking_id', booking.id)

    setSaving(false)
    onSaved()
  }

  const totalTables = Number(form.round_tables) + Number(form.long_tables)

  return (
    <Modal open onClose={onClose} title={`Booking ${booking.booking_no}`} maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={bookingStatusMeta[form.status]?.tone ?? 'gray'}>
            {bookingStatusMeta[form.status]?.label ?? form.status}
          </StatusBadge>
          <span className="text-sm text-canopy/60">Total {currency(quote.total)}</span>
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

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Canopies">
            <input className={inputClass} type="number" min="0" value={form.canopies ?? 0} onChange={setNum('canopies')} />
          </Field>
          <Field label="Round Tables">
            <input className={inputClass} type="number" min="0" value={form.round_tables ?? 0} onChange={setNum('round_tables')} />
          </Field>
          <Field label="Long Tables">
            <input className={inputClass} type="number" min="0" value={form.long_tables ?? 0} onChange={setNum('long_tables')} />
          </Field>
          <Field label="Chairs">
            <input className={inputClass} type="number" min="0" value={form.chairs ?? 0} onChange={setNum('chairs')} />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-canopy/50">
          Suggested chairs for {totalTables} tables: {totalTables * CHAIRS_PER_TABLE}
        </p>

        {/* Payment / deposit */}
        <div className="rounded-lg bg-sand/60 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Total">
              <div className="px-1 py-2 font-semibold text-canopy-dark">{currency(quote.total)}</div>
            </Field>
            <Field label="Deposit Paid (RM)">
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                value={form.deposit_paid ?? 0}
                onChange={(e) => setForm({ ...form, deposit_paid: e.target.value })}
              />
            </Field>
            <Field label="Balance">
              <div className={`px-1 py-2 font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {currency(balance)}
              </div>
            </Field>
          </div>
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

        <div className="flex justify-end gap-2 border-t border-canopy/10 pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="gold" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
