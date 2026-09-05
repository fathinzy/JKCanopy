// Gallery items tagged by theme colour so the gallery can filter automatically.
// To add a real photo later:
//   1. Drop the image into /public/gallery/
//   2. Add an entry here with the correct `theme` id (see themeColours.js)
//      and set `image` to "/gallery/your-file.jpg"
// Until real photos are added, items with image=null show a colour placeholder.
export const galleryItems = [
  {
    id: 'g1',
    theme: 'maroon',
    image: null,
    title: { en: 'Wedding Reception', ms: 'Majlis Perkahwinan' },
    location: { en: 'Kluang', ms: 'Kluang' },
  },
  {
    id: 'g2',
    theme: 'gold',
    image: null,
    title: { en: 'Engagement Ceremony', ms: 'Majlis Pertunangan' },
    location: { en: 'Kluang', ms: 'Kluang' },
  },
  {
    id: 'g3',
    theme: 'green',
    image: null,
    title: { en: 'Kenduri Kesyukuran', ms: 'Kenduri Kesyukuran' },
    location: { en: 'Kluang', ms: 'Kluang' },
  },
  {
    id: 'g4',
    theme: 'blue',
    image: null,
    title: { en: 'Aqiqah Event', ms: 'Majlis Akikah' },
    location: { en: 'Kluang', ms: 'Kluang' },
  },
  {
    id: 'g5',
    theme: 'purple',
    image: null,
    title: { en: 'Wedding Reception', ms: 'Majlis Perkahwinan' },
    location: { en: 'Kluang', ms: 'Kluang' },
  },
  {
    id: 'g6',
    theme: 'maroon',
    image: null,
    title: { en: 'Corporate Dinner', ms: 'Majlis Makan Malam' },
    location: { en: 'Kluang', ms: 'Kluang' },
  },
]
