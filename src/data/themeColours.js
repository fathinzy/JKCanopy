// Theme colours customers can filter the gallery by and select in the calculator.
// `id` is stable; labels are bilingual. `swatch` is the CSS colour for the dot.
export const themeColours = [
  { id: 'maroon', swatch: '#7b1e2b', label: { en: 'Maroon', ms: 'Marun' } },
  { id: 'gold', swatch: '#c9a24b', label: { en: 'Gold', ms: 'Emas' } },
  { id: 'green', swatch: '#2f5d3a', label: { en: 'Green', ms: 'Hijau' } },
  { id: 'blue', swatch: '#1f4e79', label: { en: 'Blue', ms: 'Biru' } },
  { id: 'purple', swatch: '#5b3a72', label: { en: 'Purple', ms: 'Ungu' } },
  { id: 'pink', swatch: '#c76b8e', label: { en: 'Pink', ms: 'Merah Jambu' } },
  { id: 'white', swatch: '#f2f0eb', label: { en: 'White', ms: 'Putih' } },
]

export function themeLabel(id, lang) {
  const found = themeColours.find((c) => c.id === id)
  if (!found) return id
  return found.label[lang] ?? found.label.en
}
