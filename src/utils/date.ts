export function todayLocalDate(): string {
  return toLocalDateInputValue(new Date())
}

export function addLocalDays(value: string | Date, days: number): string {
  const baseDate = value instanceof Date ? value : parseLocalDate(value)
  if (!baseDate) return ''
  const nextDate = new Date(baseDate)
  nextDate.setDate(nextDate.getDate() + days)
  return toLocalDateInputValue(nextDate)
}

export function toLocalDateInputValue(value?: string | Date | null): string {
  if (!value) return ''
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnlyMatch) return dateOnlyMatch[0]

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return toLocalDateInputValue(parsed)
}

export function parseLocalDate(value?: string | null): Date | null {
  const normalized = toLocalDateInputValue(value)
  if (!normalized) return null
  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatLocalDate(value?: string | null): string {
  const parsed = parseLocalDate(value)
  if (!parsed) return ''
  return new Intl.DateTimeFormat('pt-BR').format(parsed)
}

export function isBeforeToday(value?: string | null): boolean {
  const parsed = parseLocalDate(value)
  if (!parsed) return false
  const today = parseLocalDate(todayLocalDate())
  return !!today && parsed.getTime() < today.getTime()
}

export function isSameLocalDate(value: string | null | undefined, date: Date): boolean {
  return toLocalDateInputValue(value) === toLocalDateInputValue(date)
}
