import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const navLinks = [
  { href: '#gallery', key: 'nav.gallery' },
  { href: '#layouts', key: 'nav.layouts' },
  { href: '#calculator', key: 'nav.calculator' },
  { href: '#contact', key: 'nav.contact' },
]

export default function Header() {
  const { t, toggleLang } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-sand/95 backdrop-blur border-b border-canopy/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#top" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="JKCanopy" className="h-9 w-9" />
          <span className="text-xl font-bold text-canopy-dark">
            JK<span className="text-gold">Canopy</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-canopy-dark transition hover:text-gold"
            >
              {t(link.key)}
            </a>
          ))}
          <button
            onClick={toggleLang}
            className="rounded-full border border-canopy px-3 py-1 text-sm font-semibold text-canopy transition hover:bg-canopy hover:text-white"
          >
            {t('lang.toggle')}
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleLang}
            className="rounded-full border border-canopy px-3 py-1 text-sm font-semibold text-canopy"
          >
            {t('lang.toggle')}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-md p-2 text-canopy-dark"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-canopy/10 bg-sand px-4 py-2 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-canopy-dark hover:bg-canopy/10"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
