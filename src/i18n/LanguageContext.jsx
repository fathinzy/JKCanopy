import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { translations } from './translations.js'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'jkcanopy_lang'

function getInitialLang() {
  if (typeof window === 'undefined') return 'ms'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'ms') return saved
  // Default to Bahasa Melayu for local Kluang customers.
  return 'ms'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'en' ? 'ms' : 'en'
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next)
      }
      return next
    })
  }, [])

  // Translate helper: returns the string for the current language,
  // falling back to the key itself if missing.
  const t = useCallback(
    (key) => {
      const dict = translations[lang] || {}
      return dict[key] ?? key
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, toggleLang, t }), [lang, toggleLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}
