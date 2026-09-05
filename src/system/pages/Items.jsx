import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import {
  PageHeader,
  Card,
  Button,
  Field,
  inputClass,
  EmptyState,
  currency,
} from '../components/ui.jsx'

const categories = [
  { id: 'canopy', label: 'Canopy' },
  { id: 'round_table', label: 'Round Table' },
  { id: 'long_table', label: 'Long Table' },
  { id: 'chair', label: 'Chair' },
  { id: 'other', label: 'Other' },
]

const emptyForm = { name: '', category: 'other', unit_price: '' }

export default function Items() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setItems(data ?? [])
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
    setError('')
    const payload = {
      name: form.name.trim(),
      category: form.category,
      unit_price: Number(form.unit_price) || 0,
    }
    if (!payload.name) {
      setError('Item name is required.')
      return
    }
    let res
    if (editingId) {
      res = await supabase.from('items').update(payload).eq('id', editingId)
    } else {
      res = await supabase.from('items').insert(payload)
    }
    if (res.error) {
      setError(res.error.message)
      return
    }
    resetForm()
    load()
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({ name: item.name, category: item.category, unit_price: String(item.unit_price) })
  }

  async function remove(id) {
    if (!window.confirm('Delete this item?')) return
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) setError(error.message)
    else load()
  }

  return (
    <div>
      <PageHeader title="Items" subtitle="Item Registry - prices used for quotations" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        {/* Registry form */}
        <Card>
          <h2 className="mb-4 font-semibold text-canopy-dark">
            {editingId ? 'Edit Item' : 'Add Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Item Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit Price (RM)">
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="flex gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Add Item'}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* List */}
        <Card>
          <h2 className="mb-4 font-semibold text-canopy-dark">Item List</h2>
          {loading ? (
            <p className="text-sm text-canopy/60">Loading...</p>
          ) : items.length === 0 ? (
            <EmptyState>No items yet. Add your first item on the left.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-canopy/10 text-left text-canopy/70">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Unit Price</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-canopy/5">
                      <td className="py-2 pr-3 font-medium text-canopy-dark">{item.name}</td>
                      <td className="py-2 pr-3 text-canopy/70">
                        {categories.find((c) => c.id === item.category)?.label ?? item.category}
                      </td>
                      <td className="py-2 pr-3">{currency(item.unit_price)}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => startEdit(item)}
                          className="mr-3 text-canopy hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(item.id)}
                          className="text-red-600 hover:underline"
                        >
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
