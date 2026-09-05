// WhatsApp number in international format WITHOUT the leading '+'.
// wa.me links require this format (country code + number, digits only).
export const WHATSAPP_NUMBER = '60177799290'

// Build a wa.me deep link with an optional pre-filled, URL-encoded message.
// Opening this link lets the customer send the message from their own WhatsApp.
export function buildWhatsAppUrl(message = '') {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}
