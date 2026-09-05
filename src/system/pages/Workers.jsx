import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import {
  PageHeader,
  Card,
  Button,
  Field,
  inputClass,
  EmptyState,
} from '../components/ui.jsx'

const emptyForm = { name: '', ic: '', phone: '', bank_name: '', bank_acc: '' }

export default function Workers() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setWorkers(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Worker name is required.')
      return
    }
    const payload = {
      name: form.name.trim(),
      ic: form.ic.trim(),
      phone: form.phone.trim(),
      bank_name: form.bank_name.trim(),
      bank_acc: form.bank_acc.trim(),
    }
    const res = editingId
      ? await supabase.from('workers').update(payload).eq('id', editingId)
      : await supabase.from('workers').insert(payload)
    if (res.error) {
      setError(res.error.message)
      return
    }
    resetForm()
    load()
  }

  function startEdit(w) {
    setEditingId(w.id)
    setForm({
      name: w.name ?? '',
      ic: w.ic ?? '',
      phone: w.phone ?? '',
      bank_name: w.bank_name ?? '',
      bank_acc: w.bank_acc ?? '',
    })
  }

  async function remove(id) {
    if (!window.confirm('Delete this worker?')) return
    const { error } = await supabase.from('workers').delete().eq('id', id)
    if (error) setError(error.message)
    else load()
  }

  return (
    <div>
      <PageHeader title="Workers" subtitle="Worker Registry & List" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <h2 className="mb-4 font-semibold text-canopy-dark">
            {editingId ? 'Edit Worker' : 'Add Worker'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name">
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="IC Number">
              <input className={inputClass} value={form.ic} onChange={(e) => setForm({ ...form, ic: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Bank Name">
              <input className={inputClass} value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </Field>
            <Field label="Bank Account No.">
              <input className={inputClass} value={form.bank_acc} onChange={(e) => setForm({ ...form, bank_acc: e.target.value })} />
            </Field>

            {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Add Worker'}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-canopy-dark">Worker List</h2>
          {loading ? (
            <p className="text-sm text-canopy/60">Loading...</p>
          ) : workers.length === 0 ? (
            <EmptyState>No workers yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-canopy/10 text-left text-canopy/70">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">IC</th>
                    <th className="py-2 pr-3 font-medium">Bank</th>
                    <th className="py-2 pr-3 font-medium">Account</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w.id} className="border-b border-canopy/5">
                      <td className="py-2 pr-3 font-medium text-canopy-dark">{w.name}</td>
                      <td className="py-2 pr-3 text-canopy/70">{w.ic || '-'}</td>
                      <td className="py-2 pr-3 text-canopy/70">{w.bank_name || '-'}</td>
                      <td className="py-2 pr-3 text-canopy/70">{w.bank_acc || '-'}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => startEdit(w)} className="mr-3 text-canopy hover:underline">
                          Edit
                        </button>
                        <button onClick={() => remove(w.id)} className="text-red-600 hover:underline">
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
