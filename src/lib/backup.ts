import type { Settings, Workout } from './db'
import { DEFAULT_SETTINGS } from './db'

export interface Backup {
  app: 'rep'
  version: 1
  exportedAt: string
  settings: Settings
  workouts: Workout[]
}

export function buildBackup(settings: Settings, workouts: Workout[]): Backup {
  return {
    app: 'rep',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: { ...settings },
    workouts: workouts.map((w) => ({ ...w })),
  }
}

/** Валидация резервной копии. Бросает Error с понятным сообщением. */
export function parseBackup(raw: unknown): { settings: Settings; workouts: Workout[] } {
  if (typeof raw !== 'object' || raw === null) throw new Error('Файл не похож на резервную копию')
  const b = raw as Partial<Backup>
  if (b.app !== 'rep' || !Array.isArray(b.workouts)) {
    throw new Error('Файл не похож на резервную копию REP')
  }
  const workouts: Workout[] = b.workouts
    .filter((w): w is Workout => {
      return (
        typeof w === 'object' &&
        w !== null &&
        typeof (w as Workout).id === 'string' &&
        typeof (w as Workout).date === 'string' &&
        Array.isArray((w as Workout).sets)
      )
    })
    .map((w) => ({
      ...w,
      status: w.status ?? 'completed',
      kind: w.kind ?? 'standard',
      plannedSets: w.plannedSets ?? w.sets.length,
      targetReps: w.targetReps ?? null,
      currentSetIndex: w.currentSetIndex ?? w.sets.length,
    }))
  const s = (b.settings ?? {}) as Partial<Settings>
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...s,
    reminder: { ...DEFAULT_SETTINGS.reminder, ...(s.reminder ?? {}) },
  }
  return { settings, workouts }
}

export function downloadBackup(backup: Backup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rep-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
