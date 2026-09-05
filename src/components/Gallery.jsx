import { useMemo, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { themeColours } from '../data/themeColours.js'
import { galleryItems } from '../data/gallery.js'

export default function Gallery() {
  const { t, lang } = useLanguage()
  const [activeTheme, setActiveTheme] = useState('all')

  const filtered = useMemo(() => {
    if (activeTheme === 'all') return galleryItems
    return galleryItems.filter((item) => item.theme === activeTheme)
  }, [activeTheme])

  const swatchOf = (id) => themeColours.find((c) => c.id === id)?.swatch ?? '#ccc'

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-canopy-dark">{t('gallery.title')}</h2>
        <p className="mt-2 text-canopy">{t('gallery.subtitle')}</p>
      </div>

      {/* Theme colour filter */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActiveTheme('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTheme === 'all'
              ? 'bg-canopy text-white'
              : 'bg-white text-canopy-dark hover:bg-canopy/10'
          }`}
        >
          {t('gallery.filter.all')}
        </button>
        {themeColours.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveTheme(c.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTheme === c.id
                ? 'bg-canopy text-white'
                : 'bg-white text-canopy-dark hover:bg-canopy/10'
            }`}
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: c.swatch }}
            />
            {c.label[lang] ?? c.label.en}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-canopy/70">{t('gallery.empty')}</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <figure
              key={item.id}
              className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title[lang] ?? item.title.en}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  // Placeholder while real photos are not added yet.
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: swatchOf(item.theme) }}
                  >
                    <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white">
                      {t('gallery.theme')}:{' '}
                      {themeColours.find((c) => c.id === item.theme)?.label[lang] ?? item.theme}
                    </span>
                  </div>
                )}
              </div>
              <figcaption className="p-4">
                <h3 className="font-semibold text-canopy-dark">
                  {item.title[lang] ?? item.title.en}
                </h3>
                <p className="text-sm text-canopy/70">{item.location[lang] ?? item.location.en}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  )
}
