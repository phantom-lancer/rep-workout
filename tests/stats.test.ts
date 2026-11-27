import { describe, expect, it } from 'vitest'
import { chartSeries, personalRecord, periodStats, totalReps, volume } from '../src/lib/stats'
import type { Workout } from '../src/lib/db'

function mk(partial: Partial<Workout>): Workout {
  return {
    id: 'w',
    date: '2026-01-01',
    startedAt: Date.parse('2026-01-01T18:00:00'),
    status: 'completed',
    kind: 'standard',
    plannedSets: 3,
    targetReps: 13,
    sets: [
      { target: 13, done: 13, completedAt: 1 },
      { target: 13, done: 13, completedAt: 2 },
      { target: 13, done: 12, completedAt: 3 },
    ],
    currentSetIndex: 3,
    ...partial,
  }
}

describe('статистика', () => {
  it('суммирует повторения тренировки', () => {
    expect(totalReps(mk({}))).toBe(38)
  })

  it('общий объём не учитывает незавершённые', () => {
    const ws = [
      mk({ id: 'a' }),
      mk({ id: 'b', status: 'in_progress', sets: [{ target: 13, done: 50 }] }),
    ]
    expect(volume(ws)).toBe(38)
  })

  it('личный рекорд — лучший подход, включая тест', () => {
    const ws = [
      mk({ id: 'a' }),
      mk({ id: 't', kind: 'test', status: 'test', sets: [{ target: null, done: 24, completedAt: 1 }] }),
    ]
    expect(personalRecord(ws)).toBe(24)
  })

  it('периоды 7 и 30 дней', () => {
    const now = Date.parse('2026-01-20T12:00:00')
    const ws = [
      mk({ id: 'a', startedAt: now - 2 * 86_400_000 }),
      mk({ id: 'b', startedAt: now - 20 * 86_400_000 }),
      mk({ id: 'c', startedAt: now - 40 * 86_400_000 }),
    ]
    expect(periodStats(ws, now, 7).workouts).toBe(1)
    expect(periodStats(ws, now, 30).workouts).toBe(2)
  })

  it('ряд для графика отсортирован и помечает тесты', () => {
    const ws = [
      mk({ id: 'b', startedAt: 200 }),
      mk({ id: 'a', startedAt: 100 }),
      mk({ id: 't', kind: 'test', status: 'test', startedAt: 300, sets: [{ target: null, done: 24, completedAt: 1 }] }),
    ]
    const series = chartSeries(ws)
    expect(series.map((s) => s.total)).toEqual([38, 38, 24])
    expect(series[2].test).toBe(true)
  })
})
