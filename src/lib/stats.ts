import type { Workout } from './db'

/** Все показатели считаются из реальных записей журнала. */

export function totalReps(w: Workout): number {
  return w.sets.reduce((s, x) => s + x.done, 0)
}

export function volume(workouts: Workout[]): number {
  return workouts
    .filter((w) => w.status !== 'in_progress')
    .reduce((s, w) => s + totalReps(w), 0)
}

/** Личный рекорд — максимум повторений за один подход (тест тоже считается). */
export function personalRecord(workouts: Workout[]): number {
  let pr = 0
  for (const w of workouts) {
    for (const s of w.sets) if (s.done > pr) pr = s.done
  }
  return pr
}

export function periodStats(workouts: Workout[], now: number, days: number) {
  const from = now - days * 86_400_000
  const inPeriod = workouts.filter((w) => w.status !== 'in_progress' && w.startedAt >= from)
  return {
    volume: inPeriod.reduce((s, w) => s + totalReps(w), 0),
    workouts: inPeriod.length,
  }
}

/** Ряд для графика: суммарные повторения по тренировкам, по возрастанию даты. */
export function chartSeries(workouts: Workout[], limit = 30) {
  const done = workouts
    .filter((w) => w.status !== 'in_progress')
    .sort((a, b) => a.startedAt - b.startedAt)
  return done.slice(-limit).map((w) => ({
    date: w.date,
    total: totalReps(w),
    test: w.kind === 'test',
  }))
}
