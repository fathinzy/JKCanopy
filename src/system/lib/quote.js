// Build quotation line items from a booking and the item price list.
// `items` is the array from the `items` table (each has category + unit_price).
// Returns { lineItems, subtotal, total }.
//
// Line items are matched to booking quantities by item category:
//   canopy      -> booking.canopies
//   round_table -> booking.round_tables
//   long_table  -> booking.long_tables
//   chair       -> booking.chairs
export function buildQuote(booking, items) {
  const qtyByCategory = {
    canopy: Number(booking.canopies) || 0,
    round_table: Number(booking.round_tables) || 0,
    long_table: Number(booking.long_tables) || 0,
    chair: Number(booking.chairs) || 0,
  }

  const lineItems = []

  for (const item of items) {
    const qty = qtyByCategory[item.category]
    if (qty == null || qty === 0) continue
    const unit = Number(item.unit_price) || 0
    lineItems.push({
      name: item.name,
      category: item.category,
      qty,
      unit_price: unit,
      amount: Math.round(qty * unit * 100) / 100,
    })
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0)
  const total = Math.round(subtotal * 100) / 100

  return { lineItems, subtotal, total }
}
