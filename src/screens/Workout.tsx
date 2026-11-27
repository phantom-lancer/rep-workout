import { useCallback, useEffect, useRef, useState } from 'react'
import { store, useStore } from '../store'
import { REST_SECONDS } from '../lib/plan'
import { formatClock, formatDuration, formatTime, plural } from '../lib/time'
import { personalRecord } from '../lib/stats'
import { showNotification, vibrate } from '../lib/notifications'
import { Ring } from '../components/Ring'
import { Sheet } from '../components/Sheet'
import { IconClose, IconMinus, IconPlus } from '../components/Icon'

export function Workout({ onExit, toast }: { onExit: () => void; toast: (text: string) => void }) {
  const { workouts } = useStore()
  const w = workouts.find((x) => x.status === 'in_progress')

  const [now, setNow] = useState(Date.now())
  const [editSet, setEditSet] = useState<number | null>(null)
  const [editValue, setEditValue] = useState(0)
  const [confirmExit, setConfirmExit] = useState(false)
  const [confirmDone, setConfirmDone] = useState(false)
  const notifiedRef = useRef<number>(-1)

  /* тик таймера */
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [])

  /* конец отдыха: баннер, уведомление, вибрация */
  useEffect(() => {
    if (!w?.restUntil) return
    if (now >= w.restUntil) {
      const key = w.restUntil
      if (notifiedRef.current !== key) {
        notifiedRef.current = key
        store.skipRest()
        const label = `Подход ${w.currentSetIndex + 1} из ${w.plannedSets}`
        toast(`Отдых завершён, ${label.toLowerCase()}`)
        vibrate([120, 80, 120])
        if (document.hidden) void showNotification('REP', `${label} — время работать`, 'rest')
      }
    }
  }, [now, w, toast])

  if (!w) return null

  const finished = w.sets.length > 0 && w.sets.every((s) => s.completedAt !== undefined)
  const resting = w.restUntil !== undefined && w.restUntil > now
  const remaining = w.restUntil ? ((w.restUntil - now) / 1000) : 0
  const current = w.sets[w.currentSetIndex]
  const target = w.kind === 'test' ? null : current?.target ?? null
  const reached = target !== null && (current?.done ?? 0) >= target
  const doneSets = w.sets.filter((s) => s.completedAt).length

  const exit = () => {
    if (finished) {
      void store.confirmFinished()
      onExit()
    } else {
      setConfirmExit(true)
    }
  }

  return (
    <div className="workout-layer" role="dialog" aria-label="Тренировка">
      <div className="workout-head">
        <div className="t-caption">
          {finished
            ? 'Тренировка завершена'
            : resting
              ? 'Отдых'
              : w.kind === 'test'
                ? 'Контрольный тест'
                : `Подход ${w.currentSetIndex + 1} из ${w.plannedSets}`}
        </div>
        <button className="icon-btn" onClick={exit} aria-label="Выйти из тренировки">
          <IconClose size={20} />
        </button>
      </div>

      {finished ? (
        <Summary w={w} prevPr={personalRecord(workouts.filter((x) => x.id !== w.id))} onDone={() => { void store.confirmFinished(); onExit(); toast('Тренировка сохранена') }} />
      ) : (
        <>
          {resting ? (
            <div className="workout-stage">
              <div className="rest-block">
                <div className="rest-timer">
                  <Ring progress={Math.max(0, Math.min(1, remaining / REST_SECONDS))} size={240} width={7} />
                  <div className="rest-num num">{formatClock(remaining)}</div>
                </div>
                <div className="rest-caption">
                  Далее — подход {w.currentSetIndex + 1} из {w.plannedSets}
                </div>
                <button className="skip-btn" onClick={() => store.skipRest()}>
                  Пропустить отдых
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="workout-stage">
                <div className={`counter num ${reached ? 'reached' : ''}`}>{current?.done ?? 0}</div>
                <div className="counter-hint">
                  {w.kind === 'test'
                    ? 'максимум за подход, без отказа'
                    : reached
                      ? 'цель достигнута — можно закончить'
                      : `цель — ${target} ${plural(target ?? 0, 'повторение', 'повторения', 'повторений')}`}
                </div>
                <div className="stepper-row">
                  <HoldButton className="step-btn dec" label="Меньше" onFire={() => store.setReps((current?.done ?? 0) - 1)} onHold={() => store.setReps((current?.done ?? 0) - 1)}>
                    <IconMinus size={26} />
                  </HoldButton>
                  <HoldButton className="step-btn" label="Больше" onFire={() => store.setReps((current?.done ?? 0) + 1)} onHold={() => store.setReps((current?.done ?? 0) + 1)}>
                    <IconPlus size={26} />
                  </HoldButton>
                </div>
              </div>

              <div style={{ padding: '6px 18px calc(20px + env(safe-area-inset-bottom, 0px))' }}>
                <button
                  className="btn btn-primary workout-cta"
                  onClick={() => {
                    void store.completeSet()
                    vibrate(30)
                    if (w.currentSetIndex === w.sets.length - 1) {
                      toast('Все подходы выполнены')
                    } else {
                      toast(`Подход ${w.currentSetIndex + 1} записан — отдых ${formatClock(REST_SECONDS)}`)
                    }
                  }}
                >
                  {w.kind === 'test' ? 'Записать результат' : 'Завершить подход'}
                </button>
              </div>
            </>
          )}

          <div className="sets-track" role="list" aria-label="Подходы">
            {w.sets.map((s, i) => {
              const isDone = s.completedAt !== undefined
              const isCurrent = i === w.currentSetIndex && !resting
              const editable = isDone
              return (
                <button
                  key={i}
                  role="listitem"
                  className={`set-chip num ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${editable ? 'editable' : ''}`}
                  onClick={() => {
                    if (editable) {
                      setEditSet(i)
                      setEditValue(s.done)
                    }
                  }}
                  aria-label={isDone ? `Подход ${i + 1}: ${s.done}, изменить` : isCurrent ? `Подход ${i + 1}, текущий` : `Подход ${i + 1}`}
                >
                  <span>{isDone ? s.done : isCurrent ? (s.done > 0 ? s.done : '·') : '—'}</span>
                  <small>{i + 1}</small>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* правка выполненного подхода */}
      <Sheet
        open={editSet !== null}
        title={`Подход ${(editSet ?? 0) + 1}`}
        text="Скорректируйте фактически выполненные повторения"
        confirmLabel="Сохранить"
        onClose={() => setEditSet(null)}
        onConfirm={() => {
          if (editSet !== null) store.adjustSet(editSet, editValue)
          setEditSet(null)
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
          <div className="mini-stepper">
            <button onClick={() => setEditValue(Math.max(0, editValue - 1))} aria-label="Меньше">
              <IconMinus size={18} />
            </button>
            <span className="val num" style={{ fontSize: 26 }}>{editValue}</span>
            <button onClick={() => setEditValue(editValue + 1)} aria-label="Больше">
              <IconPlus size={18} />
            </button>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={confirmExit}
        title="Завершить тренировку?"
        text={
          doneSets === 0
            ? 'Ни один подход не записан — тренировка будет отменена.'
            : `Записано ${doneSets} ${plural(doneSets, 'подход', 'подхода', 'подходов')}. Тренировка сохранится как частичная.`
        }
        confirmLabel={doneSets === 0 ? 'Отменить' : 'Завершить'}
        danger={doneSets === 0}
        onClose={() => setConfirmExit(false)}
        onConfirm={() => {
          void store.abandonWorkout()
          onExit()
        }}
      />

      <Sheet
        open={confirmDone}
        title="Записать тренировку?"
        text="Подходы будут сохранены в журнал."
        confirmLabel="Сохранить"
        onClose={() => setConfirmDone(false)}
        onConfirm={() => {
          void store.confirmFinished()
          onExit()
          toast('Тренировка сохранена')
        }}
      />
    </div>
  )
}

function HoldButton({
  className,
  label,
  onFire,
  onHold,
  children,
}: {
  className?: string
  label: string
  onFire: () => void
  onHold: () => void
  children: React.ReactNode
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iv = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (iv.current) clearInterval(iv.current)
    timer.current = null
    iv.current = null
  }, [])

  useEffect(() => stop, [stop])

  const start = () => {
    timer.current = setTimeout(() => {
      iv.current = setInterval(onHold, 90)
    }, 380)
  }

  return (
    <button
      className={className}
      aria-label={label}
      onClick={onFire}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      {children}
    </button>
  )
}

function Summary({
  w,
  prevPr,
  onDone,
}: {
  w: import('../lib/db').Workout
  prevPr: number
  onDone: () => void
}) {
  const total = w.sets.reduce((s, x) => s + x.done, 0)
  const duration = ((w.finishedAt ?? Date.now()) - w.startedAt) / 1000
  const isRecord = w.kind === 'test' && w.sets[0]?.done > prevPr

  return (
    <div className="workout-stage">
      <div className="summary-card glass">
        <div className="t-caption">{w.kind === 'test' ? 'Контрольный тест' : 'Тренировка'}</div>
        <div className="summary-total num">{total}</div>
        <div className="counter-hint">
          {plural(total, 'повторение', 'повторения', 'повторений')}
          {isRecord ? ' — новый личный рекорд' : ''}
        </div>
        <div className="summary-rows">
          {w.sets.map((s, i) => (
            <div className="summary-row" key={i}>
              <span>Подход {i + 1}</span>
              <span className="v num">{s.done}</span>
            </div>
          ))}
          <div className="summary-row">
            <span>Начало</span>
            <span className="v num">{formatTime(w.startedAt)}</span>
          </div>
          <div className="summary-row">
            <span>Длительность</span>
            <span className="v num">{formatDuration(duration)}</span>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onDone}>
          Готово
        </button>
      </div>
    </div>
  )
}
