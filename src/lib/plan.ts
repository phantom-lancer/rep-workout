/**
 * План цикла: 30 дней нагрузки + восстановление и контрольный тест.
 * Дни 1–14 — 3×13, дни 15–28 — 4×13, через день.
 * Дни 29–30 — восстановление. День 31 — контрольный тест (максимум за подход).
 * Ручные параметры (override) заменяют норму подходов/повторений в обычные дни.
 * Нагрузка не растёт автоматически — только по плану цикла или вручную.
 */

import { toLocalDateKey, addDays, parseDateKey, plural } from './time'

export interface WorkoutSpec {
  kind: 'standard' | 'test'
  sets: number
  reps: number | null // null — без целевого числа (тест)
}

export interface PlanParams {
  planStart: string // ключ даты первого дня цикла
  override: { sets: number; reps: number } | null
}

export const PLAN = {
  phaseA: { lastDay: 14, sets: 3, reps: 13 },
  phaseB: { lastDay: 28, sets: 4, reps: 13 },
  recovery: { firstDay: 29, lastDay: 30 },
  testDay: 31,
  /** тренировочных дней в расчётном окне 30 дней */
  scheduledInWindow: 15,
} as const

export const REST_SECONDS = 120

/** Номер дня в цикле (1-основной). null — дата раньше начала цикла. */
export function planDay(planStart: string, dateKey: string): number | null {
  const diff = Math.round(
    (Date.parse(`${dateKey}T00:00:00`) - Date.parse(`${planStart}T00:00:00`)) / 86_400_000,
  )
  return diff < 0 ? null : diff + 1
}

/** Тренировочный ли день по расписанию «через день». */
export function isTrainingDay(day: number): boolean {
  if (day <= PLAN.phaseB.lastDay) return day % 2 === 1
  return day === PLAN.testDay
}

/** Что запланировано на этот день цикла. null — день отдыха или цикл завершён. */
export function scheduledFor(day: number, override: PlanParams['override']): WorkoutSpec | null {
  if (!isTrainingDay(day)) return null
  if (day === PLAN.testDay) return { kind: 'test', sets: 1, reps: null }
  const phase = day <= PLAN.phaseA.lastDay ? PLAN.phaseA : PLAN.phaseB
  if (override) return { kind: 'standard', sets: override.sets, reps: override.reps }
  return { kind: 'standard', sets: phase.sets, reps: phase.reps }
}

export function dayLabel(day: number): string {
  if (day >= PLAN.recovery.firstDay && day <= PLAN.recovery.lastDay) return 'Восстановление'
  if (day === PLAN.testDay) return 'Контрольный тест'
  if (day > PLAN.testDay) return 'Цикл завершён'
  return `День ${day}`
}

/** Следующий тренировочный день, начиная с указанной даты. */
export function nextTraining(
  plan: PlanParams,
  fromKey: string,
): { day: number; dateKey: string; spec: WorkoutSpec } | null {
  let key = fromKey
  for (let i = 0; i < 60; i++) {
    const day = planDay(plan.planStart, key)
    if (day !== null) {
      const spec = scheduledFor(day, plan.override)
      if (spec) return { day, dateKey: key, spec }
    }
    key = toLocalDateKey(addDays(parseDateKey(key), 1))
  }
  return null
}

/** Прогресс 30-дневного окна цикла: выполнено из запланированных. */
export function cycleProgress(
  completedDates: string[],
  planStart: string,
): { done: number; planned: number } {
  const end = Date.parse(`${planStart}T00:00:00`) + 30 * 86_400_000
  const done = completedDates.filter((k) => {
    const t = Date.parse(`${k}T00:00:00`)
    return t >= Date.parse(`${planStart}T00:00:00`) && t < end
  }).length
  return { done, planned: PLAN.scheduledInWindow }
}

export function specTitle(spec: WorkoutSpec): string {
  return spec.kind === 'test' ? 'Контрольный тест' : `${spec.sets} × ${spec.reps}`
}

export function specDetail(spec: WorkoutSpec): string {
  if (spec.kind === 'test') return 'максимум повторений за подход, без отказа'
  return `${spec.sets} ${plural(spec.sets, 'подход', 'подхода', 'подходов')} по ${spec.reps} ${plural(spec.reps ?? 0, 'повторение', 'повторения', 'повторений')}`
}
