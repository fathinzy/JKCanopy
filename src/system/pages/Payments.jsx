import { useEffect, useMemo, useState } from 'react'
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

export default function Payments() {
  const [workers, setWorkers] = useState([])
  const [workerId, setWorkerId] = useState('')
  const [completedJobs, setCompletedJobs] = useState([]) // completed bookings for worker
  const [paidBookingIds, setPaidBookingIds] = useState(new Set()) // already in a slip
  const [slips, setSlips] = useState([]) // history for this worker
  const [selection, setSelection] = useState({}) // bookingId -> { checked, amount }
  const [paidAt, setPaidAt] = useState(today())
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load workers once.
  useEffect(() => {
    supabase
      .from('workers')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setWorkers(data ?? [])
      })
  }, [])

  // When a worker is picked, load their completed jobs, which are already paid,
  // and their payment slip history.
  async function loadForWorker(id) {
    if (!id) {
      setCompletedJobs([])
      setSlips([])
      setSelection({})
      return
    }
    setLoading(true)
    setError('')

    // Bookings assigned to this worker.
    const { data: bwRows, error: bwErr } = await supabase
      .from('booking_workers')
      .select('booking_id')
      .eq('worker_id', id)
    if (bwErr) {
      setError(bwErr.message)
      setLoading(false)
      return
    }
    const bookingIds = (bwRows ?? []).map((r) => r.booking_id)

    if (bookingIds.length === 0) {
      setCompletedJobs([])
      setPaidBookingIds(new Set())
      setLoading(false)
      await loadSlips(id)
      return
    }

    // Completed bookings among those.
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .in('id', bookingIds)
      .eq('status', 'completed')
      .order('event_date', { ascending: false })
    if (bErr) {
      setError(bErr.message)
      setLoading(false)
      return
    }

    // Which of those are already included in a payment slip (any slip).
    const { data: psb, error: psbErr } = await supabase
      .from('payment_slip_bookings')
      .select('booking_id')
      .in('booking_id', bookingIds)
    if (psbErr) {
      setError(psbErr.message)
      setLoading(false)
      return
    }
    const paid = new Set((psb ?? []).map((r) => r.booking_id))
    setPaidBookingIds(paid)

    // Only show completed jobs not yet paid.
    setCompletedJobs((bookings ?? []).filter((b) => !paid.has(b.id)))
    setSelection({})
    setLoading(false)
    await loadSlips(id)
  }

  async function loadSlips(id) {
    const { data, error } = await supabase
      .from('payment_slips')
      .select('*, lines:payment_slip_bookings(*, booking:bookings(booking_no,event_date))')
      .eq('worker_id', id)
      .order('paid_at', { ascending: false })
    if (error) setError(error.message)
    else setSlips(data ?? [])
  }

  useEffect(() => {
    loadForWorker(workerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId])

  function toggle(bookingId) {
    setSelection((s) => {
      const cur = s[bookingId] || { checked: false, amount: '' }
      return { ...s, [bookingId]: { ...cur, checked: !cur.checked } }
    })
  }
  function setAmount(bookingId, amount) {
    setSelection((s) => {
      const cur = s[bookingId] || { checked: true, amount: '' }
      return { ...s, [bookingId]: { ...cur, checked: true, amount } }
    })
  }

  const chosen = useMemo(
    () =>
      completedJobs
        .filter((j) => selection[j.id]?.checked)
        .map((j) => ({ job: j, amount: Number(selection[j.id]?.amount) || 0 })),
    [completedJobs, selection],
  )
  const totalAmount = chosen.reduce((sum, c) => sum + c.amount, 0)
  const worker = workers.find((w) => w.id === workerId)

  async function createSlip() {
    if (chosen.length === 0) {
      setError('Select at least one job and enter an amount.')
      return
    }
    setSaving(true)
    setError('')

    // 1. Create the parent slip (amount = sum of selected job amounts).
    const { data: slip, error: sErr } = await supabase
      .from('payment_slips')
      .insert({
        worker_id: workerId,
        amount: totalAmount,
        paid_at: paidAt || today(),
        note: note.trim(),
      })
      .select()
      .single()
    if (sErr) {
      setSaving(false)
      setError(sErr.message)
      return
    }

    // 2. Add a line per selected job.
    const lines = chosen.map((c) => ({
      slip_id: slip.id,
      booking_id: c.job.id,
      amount: c.amount,
    }))
    const { error: lErr } = await supabase.from('payment_slip_bookings').insert(lines)
    if (lErr) {
      setSaving(false)
      setError(lErr.message)
      return
    }

    setSaving(false)
    setNote('')
    setPaidAt(today())
    loadForWorker(workerId)
  }

  function printSlip(slip) {
    const w = worker || {}
    const rows = (slip.lines || [])
      .map(
        (l) => `<tr>
          <td>${l.booking?.booking_no ?? '-'}</td>
          <td>${l.booking?.event_date ?? '-'}</td>
          <td class="num">${formatMoney(l.amount)}</td>
        </tr>`,
      )
      .join('')
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
            <tr><th>Date / Tarikh</th><td>${slip.paid_at ?? ''}</td></tr>
            <tr><th>Note / Nota</th><td>${slip.note ?? ''}</td></tr>
          </tbody>
        </table>
        <table>
          <thead><tr><th>Booking</th><th>Event Date</th><th class="num">Amount</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="2" class="num total">Total</td><td class="num total">${formatMoney(slip.amount)}</td></tr></tfoot>
        </table>
      </div>
      <div class="footer">Issued by ${COMPANY.name}. Terima kasih.</div>
    `
    printHtml(`Payment Slip - ${w.name ?? ''}`, body)
  }

  return (
    <div>
      <PageHeader title="Payment Slips" subtitle="Pay workers for completed jobs" />

      <Card className="mb-6">
        <Field label="Select Worker">
          <select className={inputClass} value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
            <option value="">Choose a worker...</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </Field>
      </Card>

      {error && <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      {workerId && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Completed unpaid jobs to pay */}
          <Card>
            <h2 className="mb-3 font-semibold text-canopy-dark">Unpaid Completed Jobs</h2>
            {loading ? (
              <p className="text-sm text-canopy/60">Loading...</p>
            ) : completedJobs.length === 0 ? (
              <EmptyState>
                No unpaid completed jobs for this worker. Jobs appear here once their booking
                status is set to Completed.
              </EmptyState>
            ) : (
              <div className="space-y-2">
                {completedJobs.map((j) => {
                  const sel = selection[j.id] || {}
                  return (
                    <div
                      key={j.id}
                      className={`rounded-lg border p-3 transition ${
                        sel.checked ? 'border-canopy bg-canopy/5' : 'border-canopy/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex min-w-0 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!sel.checked}
                            onChange={() => toggle(j.id)}
                            className="h-4 w-4 accent-canopy"
                          />
                          <span className="min-w-0">
                            <span className="font-medium text-canopy-dark">{j.booking_no}</span>
                            <span className="ml-2 text-xs text-canopy/60">
                              {j.customer_name} &middot; {j.event_date}
                            </span>
                          </span>
                        </label>
                        {sel.checked && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Amount"
                            value={sel.amount ?? ''}
                            onChange={(e) => setAmount(j.id, e.target.value)}
                            className="w-28 rounded-lg border border-canopy/20 px-2 py-1.5 text-sm outline-none focus:border-canopy"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {chosen.length > 0 && (
              <div className="mt-4 border-t border-canopy/10 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Paid Date">
                    <input className={inputClass} type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                  </Field>
                  <Field label="Note">
                    <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
                  </Field>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-canopy-dark">
                    Total: {currency(totalAmount)} ({chosen.length} job{chosen.length > 1 ? 's' : ''})
                  </span>
                  <Button variant="gold" onClick={createSlip} disabled={saving}>
                    {saving ? 'Saving...' : 'Create Payment Slip'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* History */}
          <Card>
            <h2 className="mb-3 font-semibold text-canopy-dark">Payment History</h2>
            {slips.length === 0 ? (
              <EmptyState>No payment slips yet for this worker.</EmptyState>
            ) : (
              <div className="space-y-2">
                {slips.map((s) => (
                  <div key={s.id} className="rounded-lg border border-canopy/15 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-canopy-dark">{currency(s.amount)}</p>
                        <p className="text-xs text-canopy/60">
                          {s.paid_at} &middot; {(s.lines || []).length} job(s)
                        </p>
                      </div>
                      <button onClick={() => printSlip(s)} className="text-sm text-canopy hover:underline">
                        Print / PDF
                      </button>
                    </div>
                    {(s.lines || []).length > 0 && (
                      <p className="mt-1 text-xs text-canopy/50">
                        {(s.lines || []).map((l) => l.booking?.booking_no).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
