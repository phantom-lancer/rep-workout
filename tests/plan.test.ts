import { describe, expect, it } from 'vitest'
import {
  PLAN,
  cycleProgress,
  dayLabel,
  isTrainingDay,
  nextTraining,
  planDay,
  scheduledFor,
} from '../src/lib/plan'

describe('план цикла', () => {
  it('считает номер дня от начала цикла', () => {
    expect(planDay('2026-01-01', '2026-01-01')).toBe(1)
    expect(planDay('2026-01-01', '2026-01-15')).toBe(15)
    expect(planDay('2026-01-01', '2025-12-31')).toBeNull()
  })

  it('тренировки через день: нечётные дни — тренировка, чётные — отдых', () => {
    expect(isTrainingDay(1)).toBe(true)
    expect(isTrainingDay(2)).toBe(false)
    expect(isTrainingDay(14)).toBe(false)
    expect(isTrainingDay(15)).toBe(true)
    expect(isTrainingDay(28)).toBe(false)
  })

  it('дни 29–30 — восстановление, день 31 — тест', () => {
    expect(scheduledFor(29, null)).toBeNull()
    expect(scheduledFor(30, null)).toBeNull()
    expect(scheduledFor(31, null)).toEqual({ kind: 'test', sets: 1, reps: null })
  })

  it('фаза A — 3×13, фаза B — 4×13', () => {
    expect(scheduledFor(1, null)).toEqual({ kind: 'standard', sets: 3, reps: 13 })
    expect(scheduledFor(13, null)).toEqual({ kind: 'standard', sets: 3, reps: 13 })
    expect(scheduledFor(15, null)).toEqual({ kind: 'standard', sets: 4, reps: 13 })
    expect(PLAN.phaseA.lastDay).toBe(14)
  })

  it('ручные параметры заменяют плановые в обычные дни', () => {
    expect(scheduledFor(1, { sets: 5, reps: 20 })).toEqual({ kind: 'standard', sets: 5, reps: 20 })
    expect(scheduledFor(15, { sets: 2, reps: 10 })).toEqual({ kind: 'standard', sets: 2, reps: 10 })
    // но не меняют день теста
    expect(scheduledFor(31, { sets: 5, reps: 20 })).toEqual({ kind: 'test', sets: 1, reps: null })
  })

  it('нагрузка не растёт автоматически', () => {
    // на любой обычный день без override — только плановые нормы
    for (const day of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27]) {
      const spec = scheduledFor(day, null)
      expect(spec).not.toBeNull()
      if (spec && spec.kind === 'standard') {
        const expected = day <= 14 ? { sets: 3, reps: 13 } : { sets: 4, reps: 13 }
        expect({ sets: spec.sets, reps: spec.reps }).toEqual(expected)
      }
    }
  })

  it('находит следующую тренировку', () => {
    const plan = { planStart: '2026-01-01', override: null }
    const n = nextTraining(plan, '2026-01-02') // день 2 — отдых
    expect(n?.dateKey).toBe('2026-01-03')
    expect(n?.day).toBe(3)
  })

  it('следующая тренировка после тестового окна', () => {
    const plan = { planStart: '2026-01-01', override: null }
    const n = nextTraining(plan, '2026-01-29') // дни 29-30 восстановление
    expect(n?.dateKey).toBe('2026-01-31')
    expect(n?.spec.kind).toBe('test')
  })

  it('прогресс цикла: выполнено из запланированных', () => {
    const dates = ['2026-01-01', '2026-01-03', '2026-02-01']
    expect(cycleProgress(dates, '2026-01-01')).toEqual({ done: 2, planned: 15 })
  })

  it('метки дней', () => {
    expect(dayLabel(29)).toBe('Восстановление')
    expect(dayLabel(31)).toBe('Контрольный тест')
    expect(dayLabel(33)).toBe('Цикл завершён')
  })
})
