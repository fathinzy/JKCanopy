import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { derivePaymentStatus } from '../lib/bookingHelpers.js'
import {
  PageHeader,
  Card,
  Button,
  Field,
  inputClass,
  currency,
} from '../components/ui.jsx'
import LineItemsEditor, { summariseLines } from '../components/LineItemsEditor.jsx'

const themeColourOptions = ['Maroon', 'Gold', 'Green', 'Blue', 'Purple', 'Pink', 'White']
const canopyColourOptions = [
  { id: 'white', label: 'White' },
  { id: 'red', label: 'Red' },
  { id: 'blue', label: 'Blue' },
]

const initial = {
  customer_name: '',
  phone: '',
  address: '',
  event_date: '',
  theme_colour: 'Maroon',
  canopy_colour: 'white',
  deposit: '',
  notes: '',
}

function Stepper({ step }) {
  const steps = ['Details', 'Quotation']
  return (
    <div className="mb-6 flex items-center gap-3">
      {steps.map((label, i) => {
        const n = i + 1
        const active = step === n
        const done = step > n
        return (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                active ? 'bg-canopy text-white' : done ? 'bg-gold text-canopy-dark' : 'bg-canopy/10 text-canopy/60'
              }`}
            >
              {n}
            </div>
            <span className={active ? 'font-semibold text-canopy-dark' : 'text-canopy/60'}>{label}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-8 bg-canopy/20" />}
          </div>
        )
      })}
    </div>
  )
}

export default function BookingForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initial)
  const [items, setItems] = useState([])
  const [lines, setLines] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('items')
      .select('*')
      .order('name')
      .then(({ data }) => setItems(data ?? []))
  }, [])

  const summary = summariseLines(lines)
  const depositAmount = Math.min(Math.max(0, Number(form.deposit) || 0), summary.total)
  const balanceDue = Math.max(0, summary.total - depositAmount)

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value })
  }

  function goToQuote(e) {
    e.preventDefault()
    if (!form.customer_name.trim() || !form.phone.trim() || !form.event_date) {
      setError('Please fill in customer name, phone and event date.')
      return
    }
    if (lines.length === 0) {
      setError('Add at least one item to the booking.')
      return
    }
    setError('')
    setStep(2)
  }

  async function confirmBooking() {
    setSaving(true)
    setError('')

    // 1. Insert the booking. canopies is derived from canopy-category lines so
    //    the dashboard canopy chart keeps working.
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .insert({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        event_date: form.event_date,
        theme_colour: form.theme_colour,
        canopy_colour: form.canopy_colour,
        canopies: summary.canopies,
        notes: form.notes.trim(),
        status: 'confirmed',
        payment_status: depositAmount > 0 ? derivePaymentStatus(summary.total, depositAmount) : 'unpaid',
        deposit_paid: depositAmount,
        total: summary.total,
      })
      .select()
      .single()

    if (bErr) {
      setSaving(false)
      setError(bErr.message)
      return
    }

    // 2. Save the line items.
    const itemRows = summary.rows.map((r) => ({ ...r, booking_id: booking.id }))
    const { error: biErr } = await supabase.from('booking_items').insert(itemRows)
    if (biErr) {
      setSaving(false)
      setError(biErr.message)
      return
    }

    // 3. Save the quotation snapshot.
    const { error: qErr } = await supabase.from('quotations').insert({
      booking_id: booking.id,
      line_items: summary.rows,
      subtotal: summary.total,
      total: summary.total,
    })

    // 4. Record the deposit as the first payment.
    if (depositAmount > 0) {
      const { error: pErr } = await supabase.from('booking_payments').insert({
        booking_id: booking.id,
        amount: depositAmount,
        note: 'Deposit',
      })
      if (pErr) {
        setSaving(false)
        setError(pErr.message)
        return
      }
    }

    setSaving(false)
    if (qErr) {
      setError(qErr.message)
      return
    }
    navigate('/system/bookings')
  }

  return (
    <div>
      <PageHeader title="New Booking" subtitle="Booking Registry" />
      <Stepper step={step} />

      {step === 1 && (
        <Card>
          <form onSubmit={goToQuote} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer Name *">
                <input className={inputClass} value={form.customer_name} onChange={set('customer_name')} />
              </Field>
              <Field label="Phone Number *">
                <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="01x-xxxxxxx" />
              </Field>
            </div>

            <Field label="Address">
              <textarea className={inputClass} rows={2} value={form.address} onChange={set('address')} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Event Date *">
                <input className={inputClass} type="date" value={form.event_date} onChange={set('event_date')} />
              </Field>
              <Field label="Theme Colour">
                <select className={inputClass} value={form.theme_colour} onChange={set('theme_colour')}>
                  {themeColourOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Canopy Colour">
                <select className={inputClass} value={form.canopy_colour} onChange={set('canopy_colour')}>
                  {canopyColourOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Line items */}
            <div className="rounded-lg bg-sand/50 p-4">
              <LineItemsEditor items={items} lines={lines} onChange={setLines} />
            </div>

            <Field label="Notes">
              <textarea className={inputClass} rows={2} value={form.notes} onChange={set('notes')} />
            </Field>

            {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="flex items-center justify-between">
              <span className="text-sm text-canopy/70">
                Total: <span className="font-semibold text-canopy-dark">{currency(summary.total)}</span>
              </span>
              <Button type="submit">Next: Quotation &rarr;</Button>
            </div>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="mb-1 font-semibold text-canopy-dark">Quotation</h2>
          <p className="mb-4 text-sm text-canopy/70">
            {form.customer_name} &middot; {form.event_date}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canopy/10 text-left text-canopy/70">
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium">Qty</th>
                  <th className="py-2 pr-3 font-medium">Unit Price</th>
                  <th className="py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((li, i) => (
                  <tr key={i} className="border-b border-canopy/5">
                    <td className="py-2 pr-3 text-canopy-dark">{li.name}</td>
                    <td className="py-2 pr-3">{li.qty}</td>
                    <td className="py-2 pr-3">{currency(li.unit_price)}</td>
                    <td className="py-2 text-right font-medium">{currency(li.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-right font-semibold text-canopy-dark">Total</td>
                  <td className="pt-3 text-right text-lg font-bold text-canopy-dark">{currency(summary.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Deposit + balance */}
          <div className="mt-5 rounded-lg bg-sand/60 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Deposit (RM)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.deposit}
                  onChange={set('deposit')}
                  placeholder="0.00"
                />
              </Field>
              <div>
                <p className="mb-1 text-sm font-medium text-canopy-dark">Deposit Recorded</p>
                <p className="px-1 py-2 font-semibold text-canopy-dark">{currency(depositAmount)}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-canopy-dark">Balance</p>
                <p className={`px-1 py-2 font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {currency(balanceDue)}
                </p>
              </div>
            </div>
            <p className="mt-1 text-xs text-canopy/50">
              The deposit is recorded as the first payment. Add more payments later from the
              Booking List until the balance is zero.
            </p>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-6 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              &larr; Back
            </Button>
            <Button type="button" variant="gold" onClick={confirmBooking} disabled={saving}>
              {saving ? 'Saving...' : 'Confirm Booking'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
