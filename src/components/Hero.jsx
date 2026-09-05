import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-canopy-dark via-canopy to-canopy-light text-white"
    >
      {/* Decorative arch pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="arches" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M0 80 Q40 0 80 80 Z" fill="none" stroke="white" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arches)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
          {t('footer.area')}
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-sand/90 sm:text-lg">
          {t('hero.subtitle')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#calculator"
            className="rounded-full bg-gold px-6 py-3 font-semibold text-canopy-dark shadow-lg transition hover:brightness-110"
          >
            {t('hero.cta')}
          </a>
          <a
            href="#gallery"
            className="rounded-full border-2 border-white/70 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            {t('hero.cta2')}
          </a>
        </div>
      </div>
    </section>
  )
}
