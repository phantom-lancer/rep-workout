import type { PlanParams } from './plan'

/** Модель данных. Все записи живут только в IndexedDB на устройстве. */

export interface WorkoutSet {
  /** Целевое число повторений (null — тест без цели). */
  target: number | null
  done: number
  completedAt?: number
}

export type WorkoutStatus = 'in_progress' | 'completed' | 'partial' | 'test'

export interface Workout {
  id: string
  date: string // YYYY-MM-DD (локальная дата)
  startedAt: number
  finishedAt?: number
  status: WorkoutStatus
  kind: 'standard' | 'test'
  plannedSets: number
  targetReps: number | null
  sets: WorkoutSet[]
  /** Активный отдых: метка времени окончания. */
  restUntil?: number
  currentSetIndex: number
}

export interface Settings extends PlanParams {
  reminder: { enabled: boolean; time: string } // "HH:MM"
  lastReminderDate?: string
}

export const DEFAULT_SETTINGS: Settings = {
  planStart: '', // заполняется при первом запуске сегодняшней датой
  override: null,
  reminder: { enabled: false, time: '20:00' },
}

const DB_NAME = 'rep'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('workouts')) {
        const s = db.createObjectStore('workouts', { keyPath: 'id' })
        s.createIndex('date', 'date')
      }
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(
  stores: string | string[],
  mode: IDBTransactionMode,
  fn: (t: IDBTransaction) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const t = db.transaction(Array.isArray(stores) ? stores : [stores], mode)
        let request: IDBRequest<T> | void
        t.oncomplete = () => resolve(request ? request.result : undefined)
        t.onerror = () => reject(t.error)
        t.onabort = () => reject(t.error)
        request = fn(t)
      }),
  )
}

/* ---------- kv ---------- */

export function kvGet<T>(key: string): Promise<T | undefined> {
  return tx<T>('kv', 'readonly', (t) => t.objectStore('kv').get(key) as IDBRequest<T>)
}

export function kvPut(key: string, value: unknown): Promise<void> {
  return tx('kv', 'readwrite', (t) => {
    t.objectStore('kv').put(value, key)
  }).then(() => undefined)
}

/* ---------- workouts ---------- */

export function workoutsAll(): Promise<Workout[]> {
  return openDb().then(
    (db) =>
      new Promise<Workout[]>((resolve, reject) => {
        const t = db.transaction('workouts', 'readonly')
        const req = t.objectStore('workouts').getAll()
        req.onsuccess = () => resolve(req.result as Workout[])
        req.onerror = () => reject(req.error)
      }),
  )
}

export function workoutPut(w: Workout): Promise<void> {
  return tx('workouts', 'readwrite', (t) => {
    t.objectStore('workouts').put(w)
  }).then(() => undefined)
}

export function workoutDelete(id: string): Promise<void> {
  return tx('workouts', 'readwrite', (t) => {
    t.objectStore('workouts').delete(id)
  }).then(() => undefined)
}

export function clearAll(): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(['workouts', 'kv'], 'readwrite')
        t.objectStore('workouts').clear()
        t.objectStore('kv').clear()
        t.oncomplete = () => resolve()
        t.onerror = () => reject(t.error)
      }),
  )
}

/** Массовая запись (импорт). */
export async function replaceAll(settings: Settings, workouts: Workout[]): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(['workouts', 'kv'], 'readwrite')
    t.objectStore('workouts').clear()
    t.objectStore('kv').clear()
    const ws = t.objectStore('workouts')
    for (const w of workouts) ws.put(w)
    t.objectStore('kv').put(settings, 'settings')
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}
