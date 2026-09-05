import { useLanguage } from '../i18n/LanguageContext.jsx'
import { WHATSAPP_NUMBER, buildWhatsAppUrl } from '../utils/whatsapp.js'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer id="contact" className="bg-canopy-dark text-sand">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="JKCanopy" className="h-9 w-9" />
              <span className="text-xl font-bold">
                JK<span className="text-gold">Canopy</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-sand/80">{t('contact.subtitle')}</p>
          </div>

          <div className="sm:text-right">
            <h3 className="text-lg font-semibold">{t('contact.title')}</h3>
            <p className="mt-2 text-sm text-sand/80">{t('footer.area')}</p>
            <a
              href={buildWhatsAppUrl('')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-semibold text-white transition hover:brightness-110"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5L8.9 8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-1 1-1 2.4s1 2.8 1.2 3 2 3.1 4.9 4.3c2.4 1 2.9.8 3.4.8s1.8-.7 2-1.4.3-1.3.2-1.4l-.5-.2z" />
                <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20z" />
              </svg>
              {t('contact.whatsapp')}: +{WHATSAPP_NUMBER}
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-sand/20 pt-6 text-center text-xs text-sand/70">
          &copy; {new Date().getFullYear()} JKCanopy. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
}
