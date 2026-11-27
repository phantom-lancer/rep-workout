/** Локальные даты в формате YYYY-MM-DD (не UTC — тренировки привязаны к «своим» дням). */

export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return toLocalDateKey(new Date())
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Целое число суток между двумя ключами дат (по локальной полуночи). */
export function daysBetween(fromKey: string, toKey: string): number {
  const a = parseDateKey(fromKey).getTime()
  const b = parseDateKey(toKey).getTime()
  return Math.round((b - a) / 86_400_000)
}

const fmtLong = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })
const fmtShort = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const fmtTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function formatDayLong(d: Date): string {
  return fmtLong.format(d)
}

export function formatDayShort(d: Date): string {
  return fmtShort.format(d).replace('.', '')
}

export function formatTime(ts: number): string {
  return fmtTime.format(new Date(ts))
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  if (s < 60) return `${s} с`
  const m = Math.floor(s / 60)
  const rest = s % 60
  if (m < 60) return rest === 0 ? `${m} мин` : `${m} мин ${rest} с`
  const h = Math.floor(m / 60)
  return `${h} ч ${m % 60} мин`
}

/** Русское склонение: plural(5, 'подход', 'подхода', 'подходов'). */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const d = abs % 10
  if (abs > 10 && abs < 20) return many
  if (d > 1 && d < 5) return few
  if (d === 1) return one
  return many
}

const nf = new Intl.NumberFormat('ru-RU')

export function formatNumber(n: number): string {
  return nf.format(n)
}
