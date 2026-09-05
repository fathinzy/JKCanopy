import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { printHtml, formatMoney } from '../lib/print.js'
import {
  PageHeader,
  Card,
  Button,
  Field,
  inputClass,
  EmptyState,
  currency,
} from '../components/ui.jsx'

const COMPANY = {
  name: 'JKCanopy',
  area: 'Kluang, Johor, Malaysia',
  phone: '+60 17-779 9290',
}

const today = () => new Date().toISOString().slice(0, 10)
const emptyForm = { worker_id: '', booking_id: '', amount: '', paid_at: today(), note: '' }

export default function Payments() {
  const [slips, setSlips] = useState([])
  const [workers, setWorkers] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const [sRes, wRes, bRes] = await Promise.all([
      supabase
        .from('payment_slips')
        .select('*, worker:workers(*), booking:bookings(booking_no,event_date)')
        .order('paid_at', { ascending: false }),
      supabase.from('workers').select('*').order('name'),
      supabase.from('bookings').select('id,booking_no,event_date').order('event_date', { ascending: false }),
    ])
    if (sRes.error || wRes.error || bRes.error) {
      setError(sRes.error?.message || wRes.error?.message || bRes.error?.message)
    } else {
      setSlips(sRes.data ?? [])
      setWorkers(wRes.data ?? [])
      setBookings(bRes.data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.worker_id) {
      setError('Please select a worker.')
      return
    }
    const payload = {
      worker_id: form.worker_id,
      booking_id: form.booking_id || null,
      amount: Number(form.amount) || 0,
      paid_at: form.paid_at || today(),
      note: form.note.trim(),
    }
    const { error } = await supabase.from('payment_slips').insert(payload)
    if (error) {
      setError(error.message)
      return
    }
    setForm({ ...emptyForm, paid_at: today() })
    load()
  }

  async function remove(id) {
    if (!window.confirm('Delete this payment slip?')) return
    const { error } = await supabase.from('payment_slips').delete().eq('id', id)
    if (error) setError(error.message)
    else load()
  }

  function printSlip(slip) {
    const w = slip.worker || {}
    const body = `
      <div class="brand"><h1>JK<span class="gold">Canopy</span></h1></div>
      <div class="muted">${COMPANY.area} &middot; ${COMPANY.phone}</div>
      <div class="box">
        <div style="text-align:center; font-size:16px; font-weight:600; margin-bottom:8px;">
          PAYMENT SLIP / SLIP PEMBAYARAN
        </div>
        <table>
          <tbody>
            <tr><th>Worker / Pekerja</th><td>${w.name ?? ''}</td></tr>
            <tr><th>IC</th><td>${w.ic ?? '-'}</td></tr>
            <tr><th>Bank</th><td>${w.bank_name ?? '-'}</td></tr>
            <tr><th>Account / Akaun</th><td>${w.bank_acc ?? '-'}</td></tr>
            <tr><th>Booking</th><td>${slip.booking?.booking_no ?? '-'}</td></tr>
            <tr><th>Date / Tarikh</th><td>${slip.paid_at ?? ''}</td></tr>
            <tr><th>Note / Nota</th><td>${slip.note ?? ''}</td></tr>
          </tbody>
        </table>
        <div style="text-align:right; margin-top:16px;" class="total">
          Amount / Jumlah: ${formatMoney(slip.amount)}
        </div>
      </div>
      <div class="footer">Issued by ${COMPANY.name}. Terima kasih.</div>
    `
    printHtml(`Payment Slip - ${w.name ?? ''}`, body)
  }

  return (
    <div>
      <PageHeader title="Payment Slips" subtitle="Worker payments - print or save as PDF" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <h2 className="mb-4 font-semibold text-canopy-dark">New Payment Slip</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Worker">
              <select
                className={inputClass}
                value={form.worker_id}
                onChange={(e) => setForm({ ...form, worker_id: e.target.value })}
              >
                <option value="">Select worker...</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Booking (optional)">
              <select
                className={inputClass}
                value={form.booking_id}
                onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
              >
                <option value="">None</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_no} - {b.event_date}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (RM)">
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Paid Date">
              <input
                className={inputClass}
                type="date"
                value={form.paid_at}
                onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
              />
            </Field>
            <Field label="Note">
              <input
                className={inputClass}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Field>

            {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

            <Button type="submit">Add Payment Slip</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-canopy-dark">Payment History</h2>
          {loading ? (
            <p className="text-sm text-canopy/60">Loading...</p>
          ) : slips.length === 0 ? (
            <EmptyState>No payment slips yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-canopy/10 text-left text-canopy/70">
                    <th className="py-2 pr-3 font-medium">Worker</th>
                    <th className="py-2 pr-3 font-medium">Booking</th>
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {slips.map((s) => (
                    <tr key={s.id} className="border-b border-canopy/5">
                      <td className="py-2 pr-3 font-medium text-canopy-dark">{s.worker?.name ?? '-'}</td>
                      <td className="py-2 pr-3 text-canopy/70">{s.booking?.booking_no ?? '-'}</td>
                      <td className="py-2 pr-3 text-canopy/70">{s.paid_at}</td>
                      <td className="py-2 pr-3">{currency(s.amount)}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => printSlip(s)} className="mr-3 text-canopy hover:underline">
                          Print
                        </button>
                        <button onClick={() => remove(s.id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
