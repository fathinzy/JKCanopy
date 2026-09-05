import { useMemo, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { themeColours, themeLabel } from '../data/themeColours.js'
import { CHAIRS_PER_TABLE, layoutsForCanopies } from '../data/layouts.js'
import { estimatePrice, pricing } from '../data/pricing.js'
import { buildWhatsAppUrl } from '../utils/whatsapp.js'
import LayoutDiagram from './LayoutDiagram.jsx'

const canopyColours = [
  { id: 'white', swatch: '#f2f0eb', labelKey: 'calc.colour.white' },
  { id: 'red', swatch: '#b23b3b', labelKey: 'calc.colour.red' },
  { id: 'blue', swatch: '#1f4e79', labelKey: 'calc.colour.blue' },
]

const initialForm = {
  name: '',
  phone: '',
  address: '',
  eventDate: '',
  themeColour: 'maroon',
  canopyColour: 'white',
  canopies: 1,
  roundTables: 4,
  longTables: 2,
  extraChairs: 0,
}

// Small labelled number stepper.
function NumberField({ label, value, onChange, min = 0 }) {
  const set = (n) => onChange(Math.max(min, n))
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-canopy-dark">{label}</label>
      <div className="flex items-center overflow-hidden rounded-lg border border-canopy/20 bg-white">
        <button
          type="button"
          onClick={() => set(value - 1)}
          className="px-3 py-2 text-lg text-canopy hover:bg-canopy/10"
          aria-label="decrease"
        >
          &minus;
        </button>
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => set(parseInt(e.target.value, 10) || 0)}
          className="w-full border-x border-canopy/10 py-2 text-center outline-none"
        />
        <button
          type="button"
          onClick={() => set(value + 1)}
          className="px-3 py-2 text-lg text-canopy hover:bg-canopy/10"
          aria-label="increase"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function Calculator() {
  const { t, lang } = useLanguage()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))
  const updateInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const totalTables = form.roundTables + form.longTables
  const includedChairs = totalTables * CHAIRS_PER_TABLE
  const totalChairs = includedChairs + Number(form.extraChairs || 0)

  const estimate = useMemo(
    () =>
      estimatePrice({
        canopies: form.canopies,
        roundTables: form.roundTables,
        longTables: form.longTables,
        totalChairs,
        canopyColour: form.canopyColour,
      }),
    [form.canopies, form.roundTables, form.longTables, totalChairs, form.canopyColour],
  )

  const suggestedLayouts = useMemo(
    () => layoutsForCanopies(form.canopies),
    [form.canopies],
  )

  const currency = t('common.currency')

  function buildMessage() {
    const themeName = themeLabel(form.themeColour, lang)
    const canopyName = t(canopyColours.find((c) => c.id === form.canopyColour)?.labelKey ?? '')
    const lines = [
      `*${t('wa.heading')}*`,
      '',
      `${t('wa.name')}: ${form.name}`,
      `${t('wa.phone')}: ${form.phone}`,
      `${t('wa.address')}: ${form.address}`,
      `${t('wa.eventDate')}: ${form.eventDate}`,
      `${t('wa.themeColour')}: ${themeName}`,
      `${t('wa.canopyColour')}: ${canopyName}`,
      `${t('wa.noCanopy')}: ${form.canopies}`,
      `${t('wa.roundTable')}: ${form.roundTables}`,
      `${t('wa.longTable')}: ${form.longTables}`,
      `${t('wa.chairs')}: ${totalChairs}`,
      `${t('wa.estimate')}: ${currency} ${estimate}`,
    ]
    return lines.join('\n')
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Minimal validation: name, phone and event date are required.
    if (!form.name.trim() || !form.phone.trim() || !form.eventDate) {
      setError(t('calc.required'))
      return
    }
    setError('')
    const url = buildWhatsAppUrl(buildMessage())
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const inputClass =
    'w-full rounded-lg border border-canopy/20 bg-white px-3 py-2 outline-none focus:border-canopy'

  return (
    <section id="calculator" className="bg-sand/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-canopy-dark">{t('calc.title')}</h2>
          <p className="mt-2 text-canopy">{t('calc.subtitle')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]"
        >
          {/* Left: fields */}
          <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-canopy-dark">
                  {t('calc.name')} *
                </label>
                <input className={inputClass} value={form.name} onChange={updateInput('name')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-canopy-dark">
                  {t('calc.phone')} *
                </label>
                <input
                  className={inputClass}
                  type="tel"
                  value={form.phone}
                  onChange={updateInput('phone')}
                  placeholder="01x-xxxxxxx"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-canopy-dark">
                {t('calc.address')}
              </label>
              <textarea
                className={inputClass}
                rows={2}
                value={form.address}
                onChange={updateInput('address')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-canopy-dark">
                  {t('calc.eventDate')} *
                </label>
                <input
                  className={inputClass}
                  type="date"
                  value={form.eventDate}
                  onChange={updateInput('eventDate')}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-canopy-dark">
                  {t('calc.themeColour')}
                </label>
                <select
                  className={inputClass}
                  value={form.themeColour}
                  onChange={updateInput('themeColour')}
                >
                  {themeColours.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label[lang] ?? c.label.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Canopy colour */}
            <div>
              <label className="mb-1 block text-sm font-medium text-canopy-dark">
                {t('calc.canopyColour')}
              </label>
              <div className="flex flex-wrap gap-2">
                {canopyColours.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => update('canopyColour')(c.id)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                      form.canopyColour === c.id
                        ? 'border-canopy bg-canopy/10 font-semibold text-canopy-dark'
                        : 'border-canopy/20 bg-white text-canopy-dark hover:bg-canopy/5'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: c.swatch }}
                    />
                    {t(c.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantities */}
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField
                label={t('calc.noCanopy')}
                value={form.canopies}
                onChange={update('canopies')}
                min={1}
              />
              <NumberField
                label={t('calc.roundTable')}
                value={form.roundTables}
                onChange={update('roundTables')}
              />
              <NumberField
                label={t('calc.longTable')}
                value={form.longTables}
                onChange={update('longTables')}
              />
            </div>

            {/* Chairs */}
            <div className="rounded-lg bg-sand/60 p-4">
              <p className="text-sm font-medium text-canopy-dark">{t('calc.chairInfo')}</p>
              <div className="mt-2 flex flex-wrap items-end gap-4">
                <div className="text-sm text-canopy">
                  {t('calc.includedChairs')}:{' '}
                  <span className="font-semibold text-canopy-dark">{includedChairs}</span>
                </div>
                <div className="w-32">
                  <NumberField
                    label={t('calc.extraChair')}
                    value={Number(form.extraChairs)}
                    onChange={update('extraChairs')}
                  />
                </div>
                <div className="text-sm text-canopy">
                  {t('calc.totalChairs')}:{' '}
                  <span className="font-semibold text-canopy-dark">{totalChairs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: summary + estimate */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-canopy-dark p-6 text-sand shadow-sm">
              <p className="text-sm uppercase tracking-wide text-sand/70">{t('calc.estimate')}</p>
              <p className="mt-1 text-4xl font-bold text-gold">
                {currency} {estimate}
              </p>
              <p className="mt-2 text-xs text-sand/70">{t('calc.estimateNote')}</p>

              {error && (
                <p className="mt-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-semibold text-white transition hover:brightness-110"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20z" />
                  <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5L8.9 8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-1 1-1 2.4s1 2.8 1.2 3 2 3.1 4.9 4.3c2.4 1 2.9.8 3.4.8s1.8-.7 2-1.4.3-1.3.2-1.4l-.5-.2z" />
                </svg>
                {t('calc.submit')}
              </button>
            </div>

            {/* Suggested layout preview */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <h3 className="mb-2 text-center text-sm font-semibold text-canopy-dark">
                {suggestedLayouts[0]?.name[lang] ?? suggestedLayouts[0]?.name.en}
              </h3>
              <div className="rounded-xl ring-1 ring-black/5">
                <LayoutDiagram layout={suggestedLayouts[0]} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
