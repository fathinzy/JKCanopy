// PLACEHOLDER PRICING - update these values with real prices.
// These unit prices drive the website's estimated-price calculation.
// In Phase 2 (the management system), these will come from the Item Registry
// so there is a single source of truth. For now, edit the numbers below.
//
// All prices are in Malaysian Ringgit (RM).
export const pricing = {
  canopy: 150, // per canopy
  roundTable: 15, // per round table (includes cloth)
  longTable: 12, // per long table
  chair: 2, // per chair
  // Optional surcharge per canopy colour. 0 = no extra charge.
  canopyColourSurcharge: {
    white: 0,
    red: 20,
    blue: 20,
  },
}

// Compute an estimated total from a booking selection.
// `booking` shape: { canopies, roundTables, longTables, totalChairs, canopyColour }
export function estimatePrice(booking) {
  const {
    canopies = 0,
    roundTables = 0,
    longTables = 0,
    totalChairs = 0,
    canopyColour = 'white',
  } = booking

  const surcharge = pricing.canopyColourSurcharge[canopyColour] ?? 0

  const total =
    canopies * pricing.canopy +
    canopies * surcharge +
    roundTables * pricing.roundTable +
    longTables * pricing.longTable +
    totalChairs * pricing.chair

  return Math.max(0, Math.round(total))
}
