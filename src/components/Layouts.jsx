import { useLanguage } from '../i18n/LanguageContext.jsx'
import { layouts } from '../data/layouts.js'
import LayoutDiagram from './LayoutDiagram.jsx'

function StatPill({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-sand px-3 py-1.5 text-sm">
      <span className="text-canopy/80">{label}</span>
      <span className="font-semibold text-canopy-dark">{value}</span>
    </div>
  )
}

export default function Layouts() {
  const { t, lang } = useLanguage()

  return (
    <section id="layouts" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-canopy-dark">{t('layouts.title')}</h2>
          <p className="mt-2 text-canopy">{t('layouts.subtitle')}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              className="rounded-2xl border border-canopy/10 bg-sand/40 p-4 shadow-sm"
            >
              <h3 className="mb-2 text-center font-semibold text-canopy-dark">
                {layout.name[lang] ?? layout.name.en}
              </h3>
              <div className="rounded-xl bg-white ring-1 ring-black/5">
                <LayoutDiagram layout={layout} />
              </div>
              <div className="mt-3 space-y-1.5">
                <StatPill label={t('layouts.canopy')} value={layout.canopies} />
                <StatPill label={t('layouts.roundTable')} value={layout.roundTables} />
                <StatPill label={t('layouts.longTable')} value={layout.longTables} />
                <StatPill label={t('layouts.chair')} value={layout.chairs} />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-canopy/70">{t('layouts.note')}</p>
      </div>
    </section>
  )
}
