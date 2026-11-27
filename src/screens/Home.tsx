import { completedDates, store, useStore } from '../store'
import {
  cycleProgress,
  dayLabel,
  isTrainingDay,
  nextTraining,
  planDay,
  scheduledFor,
  specDetail,
  specTitle,
  type WorkoutSpec,
} from '../lib/plan'
import { formatDayLong, formatDayShort, formatNumber, parseDateKey, plural, todayKey, addDays, toLocalDateKey } from '../lib/time'
import { personalRecord, volume } from '../lib/stats'
import { Ring } from '../components/Ring'
import { IconGear } from '../components/Icon'

interface HomeProps {
  /** null — продолжить активную тренировку */
  onOpen: (spec: WorkoutSpec | null) => void
  onOpenSettings: () => void
}

export function Home({ onOpen, onOpenSettings }: HomeProps) {
  const { settings, workouts } = useStore()
  const key = todayKey()
  const day = planDay(settings.planStart, key)
  const active = workouts.find((w) => w.status === 'in_progress')

  const trainedToday = workouts.some((w) => w.date === key && w.status !== 'in_progress')
  const cycleDone = day !== null && day > 31

  const spec: WorkoutSpec | null = day !== null ? scheduledFor(day, settings.override) : null
  /* если сегодня уже тренировались — ищем следующий день с завтрашнего */
  const fromKey = trainedToday ? toLocalDateKey(addDays(parseDateKey(key), 1)) : key
  const next = nextTraining({ planStart: settings.planStart, override: settings.override }, fromKey)

  const cycle = cycleProgress(completedDates(workouts), settings.planStart)
  const vol = volume(workouts)
  const pr = personalRecord(workouts)
  const doneCount = workouts.filter((w) => w.status !== 'in_progress').length

  const status = cycleDone
    ? 'Цикл завершён'
    : day !== null && isTrainingDay(day)
      ? active
        ? 'Тренировка идёт'
        : trainedToday
          ? 'Сегодня выполнено'
          : 'Тренировочный день'
      : 'День отдыха'

  const dotClass = cycleDone ? '' : day !== null && isTrainingDay(day) ? (trainedToday && !active ? 'done' : 'train') : ''

  const shown: WorkoutSpec | null = spec ?? next?.spec ?? null
  const heroSpec = cycleDone ? 'Финиш' : shown ? specTitle(shown) : '—'
  const heroDetail = cycleDone
    ? 'цикл пройден — посмотрите статистику'
    : shown
      ? specDetail(shown)
      : ''
  const heroWhen = cycleDone
    ? 'можно начать новый цикл'
    : spec
      ? 'сегодня'
      : next
        ? `${formatDayShort(parseDateKey(next.dateKey))}, ${dayLabel(next.day).toLowerCase()}`
        : ''

  const nextLine =
    !cycleDone && trainedToday && next
      ? `Следующая тренировка: ${formatDayShort(parseDateKey(next.dateKey))}, ${specTitle(next.spec).toLowerCase()}`
      : null

  const testMissed = cycleDone && !workouts.some((w) => w.kind === 'test' && dayOf(settings.planStart, w.date) >= 29)

  const ctaLabel = active
    ? 'Продолжить тренировку'
    : cycleDone
      ? 'Начать новый цикл'
      : shown?.kind === 'test'
        ? 'Пройти тест'
        : 'Начать тренировку'

  const onCta = () => {
    if (active) {
      onOpen(null)
      return
    }
    if (cycleDone) {
      void store.patchSettings({ planStart: todayKey() })
      return
    }
    if (shown) onOpen(shown)
  }

  return (
    <>
      <header className="app-header">
        <h1 className="h-page">{formatDayLong(new Date())}</h1>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Настройки">
          <IconGear size={21} />
        </button>
      </header>

      <div className="status-row">
        <span className={`day-dot ${dotClass}`} />
        <span>{status}</span>
        {day !== null && !cycleDone && <span className="t-micro">{dayLabel(day).toLowerCase()}</span>}
      </div>

      <section className="hero glass" aria-label="Следующая тренировка">
        <div className="hero-spec num">{heroSpec}</div>
        <div className="hero-detail">{heroDetail}</div>
        {!cycleDone && (
          <div className="hero-ring">
            <Ring
              progress={cycle.planned === 0 ? 0 : cycle.done / cycle.planned}
              label={`${cycle.done}/${cycle.planned}`}
              caption="план"
            />
          </div>
        )}
        <div className="t-micro" style={{ gridColumn: '1 / -1' }}>{heroWhen}</div>
      </section>

      <div className="cta-row">
        <button className="btn btn-primary" onClick={onCta}>
          {ctaLabel}
        </button>
        {testMissed && !active && (
          <button className="btn btn-quiet" onClick={() => onOpen({ kind: 'test', sets: 1, reps: null })}>
            Пройти тест сейчас
          </button>
        )}
        {nextLine && <div className="next-line">{nextLine}</div>}
      </div>

      <section className="statline glass" aria-label="Показатели">
        <div>
          <span className="v num">{formatNumber(vol)}</span>
          <span className="c">{plural(vol, 'отжимание', 'отжимания', 'отжиманий')}</span>
        </div>
        <div>
          <span className="v num">{pr}</span>
          <span className="c">рекорд</span>
        </div>
        <div>
          <span className="v num">{doneCount}</span>
          <span className="c">{plural(doneCount, 'тренировка', 'тренировки', 'тренировок')}</span>
        </div>
      </section>
    </>
  )
}

function dayOf(planStart: string, date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00`) - Date.parse(`${planStart}T00:00:00`)) / 86_400_000)
}
