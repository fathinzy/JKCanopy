import { useState } from 'react'
import { Button, inputClass, currency } from './ui.jsx'

// Reusable line-item editor driven by the Item Registry.
// Props:
//   items    - array from the `items` table (id, name, category, unit_price)
//   lines    - current line items [{ item_id, name, category, qty, unit_price }]
//   onChange - called with the new lines array on any edit
//
// Each line's amount is qty * unit_price. Unit price defaults to the item's
// registered price but can be adjusted per booking.
export default function LineItemsEditor({ items, lines, onChange }) {
  const [pickId, setPickId] = useState('')

  function addItem() {
    if (!pickId) return
    const item = items.find((i) => i.id === pickId)
    if (!item) return
    // If the item is already a line, just bump its quantity.
    const existing = lines.find((l) => l.item_id === item.id)
    if (existing) {
      onChange(lines.map((l) => (l.item_id === item.id ? { ...l, qty: Number(l.qty) + 1 } : l)))
    } else {
      onChange([
        ...lines,
        {
          item_id: item.id,
          name: item.name,
          category: item.category,
          qty: 1,
          unit_price: Number(item.unit_price) || 0,
        },
      ])
    }
    setPickId('')
  }

  function updateLine(index, patch) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }
  function removeLine(index) {
    onChange(lines.filter((_, i) => i !== index))
  }

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_price) || 0),
    0,
  )

  return (
    <div>
      {/* Add item picker */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-sm font-medium text-canopy-dark">Add Item</label>
          <select className={inputClass} value={pickId} onChange={(e) => setPickId(e.target.value)}>
            <option value="">Choose from item registry...</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({currency(i.unit_price)})
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={addItem} disabled={!pickId}>
          + Add
        </Button>
      </div>

      {items.length === 0 && (
        <p className="mt-2 text-sm text-amber-700">
          No items in the registry yet. Add items in the Items module first.
        </p>
      )}

      {/* Line rows */}
      {lines.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-canopy/10 text-left text-canopy/70">
                <th className="py-2 pr-3 font-medium">Item</th>
                <th className="py-2 pr-3 font-medium">Qty</th>
                <th className="py-2 pr-3 font-medium">Unit Price</th>
                <th className="py-2 pr-3 font-medium text-right">Amount</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const amount = (Number(l.qty) || 0) * (Number(l.unit_price) || 0)
                return (
                  <tr key={`${l.item_id}-${i}`} className="border-b border-canopy/5">
                    <td className="py-2 pr-3 text-canopy-dark">{l.name}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={l.qty}
                        onChange={(e) => updateLine(i, { qty: e.target.value })}
                        className="w-20 rounded-lg border border-canopy/20 px-2 py-1.5 outline-none focus:border-canopy"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.unit_price}
                        onChange={(e) => updateLine(i, { unit_price: e.target.value })}
                        className="w-24 rounded-lg border border-canopy/20 px-2 py-1.5 outline-none focus:border-canopy"
                      />
                    </td>
                    <td className="py-2 pr-3 text-right font-medium">{currency(amount)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right font-semibold text-canopy-dark">
                  Total
                </td>
                <td className="pt-3 text-right text-lg font-bold text-canopy-dark">
                  {currency(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// Helper: normalise lines into DB rows and compute totals + canopy count.
export function summariseLines(lines) {
  const rows = lines.map((l) => {
    const qty = Number(l.qty) || 0
    const unit_price = Number(l.unit_price) || 0
    return {
      item_id: l.item_id ?? null,
      name: l.name,
      category: l.category ?? 'other',
      qty,
      unit_price,
      amount: Math.round(qty * unit_price * 100) / 100,
    }
  })
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const canopies = rows
    .filter((r) => r.category === 'canopy')
    .reduce((s, r) => s + r.qty, 0)
  return { rows, total: Math.round(total * 100) / 100, canopies }
}
