import { useSyncExternalStore } from 'react'
import {
  DEFAULT_SETTINGS,
  kvGet,
  kvPut,
  replaceAll,
  clearAll,
  workoutDelete,
  workoutPut,
  workoutsAll,
  type Settings,
  type Workout,
} from './lib/db'
import { REST_SECONDS } from './lib/plan'
import { todayKey } from './lib/time'
import { buildBackup, parseBackup, type Backup } from './lib/backup'

/**
 * Единое хранилище приложения. Каждое изменение немедленно пишется в IndexedDB,
 * поэтому незавершённая тренировка и отдых переживают перезагрузку.
 */

interface State {
  loaded: boolean
  settings: Settings
  workouts: Workout[]
}

class Store {
  private state: State = { loaded: false, settings: DEFAULT_SETTINGS, workouts: [] }
  private listeners = new Set<() => void>()
  private saveTimer: ReturnType<typeof setTimeout> | null = null

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  getSnapshot = () => this.state

  private emit() {
    this.state = { ...this.state }
    this.listeners.forEach((l) => l())
  }

  async init(): Promise<void> {
    const [settings, workouts] = await Promise.all([
      kvGet<Settings>('settings'),
      workoutsAll(),
    ])
    const s: Settings = {
      ...DEFAULT_SETTINGS,
      ...(settings ?? {}),
      reminder: { ...DEFAULT_SETTINGS.reminder, ...(settings?.reminder ?? {}) },
    }
    if (!s.planStart) {
      s.planStart = todayKey()
      await kvPut('settings', s)
    }
    this.state = { loaded: true, settings: s, workouts }
    this.emit()
  }

  get settings() {
    return this.state.settings
  }

  get workouts() {
    return this.state.workouts
  }

  get loaded() {
    return this.state.loaded
  }

  activeWorkout(): Workout | undefined {
    return this.state.workouts.find((w) => w.status === 'in_progress')
  }

  async patchSettings(patch: Partial<Settings>): Promise<void> {
    const settings = { ...this.state.settings, ...patch }
    this.state.settings = settings
    this.emit()
    await kvPut('settings', settings)
  }

  /** Отложенная запись текущей тренировки (для частых изменений счётчика). */
  private debouncedWorkoutSave(w: Workout) {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      void workoutPut({ ...w })
    }, 250)
  }

  /* ---------- тренировка ---------- */

  async startWorkout(kind: 'standard' | 'test', plannedSets: number, targetReps: number | null): Promise<Workout> {
    const now = Date.now()
    const w: Workout = {
      id: `w${now}`,
      date: todayKey(),
      startedAt: now,
      status: 'in_progress',
      kind,
      plannedSets,
      targetReps,
      sets: Array.from({ length: plannedSets }, () => ({ target: targetReps, done: 0 })),
      currentSetIndex: 0,
    }
    if (kind === 'test') w.sets = [{ target: null, done: 0 }]
    await workoutPut(w)
    this.state.workouts = [...this.state.workouts.filter((x) => x.id !== w.id), w]
    this.emit()
    return w
  }

  private updateActive(mut: (w: Workout) => void, immediate = false): Workout | undefined {
    const w = this.activeWorkout()
    if (!w) return undefined
    mut(w)
    if (immediate) {
      if (this.saveTimer) clearTimeout(this.saveTimer)
      this.saveTimer = null
      void workoutPut({ ...w })
    } else {
      this.debouncedWorkoutSave(w)
    }
    this.emit()
    return w
  }

  setReps(n: number): void {
    this.updateActive((w) => {
      const s = w.sets[w.currentSetIndex]
      if (s) s.done = Math.max(0, Math.min(999, n))
    })
  }

  adjustSet(index: number, done: number): void {
    this.updateActive((w) => {
      const s = w.sets[index]
      if (s) s.done = Math.max(0, Math.min(999, done))
    })
  }

  /** Завершить текущий подход и запустить отдых (кроме последнего). */
  async completeSet(): Promise<void> {
    const w = this.activeWorkout()
    if (!w) return
    const isLast = w.currentSetIndex >= w.sets.length - 1
    w.sets[w.currentSetIndex].completedAt = Date.now()
    if (isLast) {
      w.restUntil = undefined
    } else {
      w.currentSetIndex += 1
      w.restUntil = Date.now() + REST_SECONDS * 1000
    }
    await workoutPut({ ...w })
    this.emit()
  }

  skipRest(): void {
    this.updateActive((w) => {
      w.restUntil = undefined
    }, true)
  }

  workoutFinished(w: Workout): boolean {
    return w.sets.length > 0 && w.sets.every((s) => s.completedAt !== undefined)
  }

  /** Итог подтверждён (экран сводки): тренировка записана как выполненная. */
  async confirmFinished(): Promise<void> {
    const w = this.activeWorkout()
    if (!w) return
    await workoutDelete(w.id) // in_progress-копия больше не нужна
    const finished: Workout = {
      ...w,
      restUntil: undefined,
      status: w.kind === 'test' ? 'test' : 'completed',
      finishedAt: Date.now(),
    }
    this.state.workouts = [...this.state.workouts.filter((x) => x.id !== w.id), finished]
    this.emit()
    await workoutPut(finished)
  }

  /** Пользователь прерывает тренировку: 0 подходов — отменить, иначе — частично. */
  async abandonWorkout(): Promise<void> {
    const w = this.activeWorkout()
    if (!w) return
    const doneSets = w.sets.filter((s) => s.completedAt).length
    w.restUntil = undefined
    if (doneSets === 0) {
      await workoutDelete(w.id)
      this.state.workouts = this.state.workouts.filter((x) => x.id !== w.id)
      this.emit()
    } else {
      w.status = 'partial'
      w.finishedAt = Date.now()
      await workoutPut({ ...w })
      this.emit()
    }
  }

  async deleteWorkout(id: string): Promise<void> {
    await workoutDelete(id)
    this.state.workouts = this.state.workouts.filter((w) => w.id !== id)
    this.emit()
  }

  /* ---------- данные ---------- */

  exportAll(): Backup {
    return buildBackup(this.state.settings, this.state.workouts)
  }

  async importAll(raw: unknown): Promise<number> {
    const { settings, workouts } = parseBackup(raw)
    await replaceAll(settings, workouts)
    this.state.settings = settings
    this.state.workouts = workouts
    this.emit()
    return workouts.length
  }

  async wipeAll(): Promise<void> {
    await clearAll()
    this.state.settings = { ...DEFAULT_SETTINGS, planStart: todayKey() }
    this.state.workouts = []
    this.emit()
    await kvPut('settings', this.state.settings)
  }
}

export const store = new Store()

export function useStore(): State {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}

/** Даты выполненных тренировок (для прогресса цикла). */
export function completedDates(workouts: Workout[]): string[] {
  const set = new Set<string>()
  for (const w of workouts) {
    if (w.status === 'completed' || w.status === 'partial' || w.status === 'test') set.add(w.date)
  }
  return [...set]
}
