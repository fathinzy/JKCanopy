// Layout suggestions taken from "canopy layout.pptx".
// Each layout maps a canopy count to a table/chair arrangement.
// `chairsPerTable` reflects the "8 X n" chair notation in the slides.
export const CHAIRS_PER_TABLE = 8

export const layouts = [
  {
    id: 'layout1',
    canopies: 1,
    roundTables: 4,
    longTables: 2,
    chairs: 32, // 8 x 4
    name: { en: 'Layout 1', ms: 'Susun Atur 1' },
  },
  {
    id: 'layout2',
    canopies: 1,
    roundTables: 0,
    longTables: 6,
    chairs: 32, // 8 x 4
    name: { en: 'Layout 2', ms: 'Susun Atur 2' },
  },
  {
    id: 'layout3',
    canopies: 2,
    roundTables: 8,
    longTables: 2,
    chairs: 64, // 8 x 8
    name: { en: 'Layout 3', ms: 'Susun Atur 3' },
  },
  {
    id: 'layout4',
    canopies: 2,
    roundTables: 6,
    longTables: 2,
    chairs: 48, // 8 x 6
    name: { en: 'Layout 4', ms: 'Susun Atur 4' },
  },
]

// Return the layouts that match a given canopy count (used by the calculator
// to suggest arrangements). Falls back to all layouts if none match.
export function layoutsForCanopies(count) {
  const matches = layouts.filter((l) => l.canopies === count)
  return matches.length ? matches : layouts
}
