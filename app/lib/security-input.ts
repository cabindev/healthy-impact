// Shared with forms; this module contains no server-only imports.
export const MIN_PASSWORD_LENGTH = 12
export function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= MIN_PASSWORD_LENGTH && new TextEncoder().encode(value).length <= 72
}
export function normalizedEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}
export const validResetToken = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
