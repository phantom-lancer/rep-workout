import { useRef, useState } from 'react'
import { store, useStore } from '../store'
import { dayLabel, isTrainingDay, planDay, PLAN, scheduledFor, specTitle } from '../lib/plan'
import { downloadBackup } from '../lib/backup'
import { notificationPermission, requestPermission } from '../lib/notifications'
import { todayKey } from '../lib/time'
import { Sheet } from '../components/Sheet'
import { IconChevron, IconDownload, IconUpload } from '../components/Icon'

export function Settings({
  onBack,
  toast,
  onInstall,
  canInstall,
}: {
  onBack: () => void
  toast: (text: string) => void
  onInstall: () => void
  canInstall: boolean
}) {
  const { settings, workouts } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [newCycle, setNewCycle] = useState(false)
  const [resetPlan, setResetPlan] = useState(false)
  const [wipe, setWipe] = useState(false)
  const [pendingImport, setPendingImport] = useState<File | null>(null)

  const key = todayKey()
  const day = planDay(settings.planStart, key)
  const spec = day !== null ? scheduledFor(day, settings.override) : null
  const perm = notificationPermission()

  const phaseText =
    day === null
      ? 'до начала цикла'
      : day > PLAN.testDay
        ? 'цикл завершён'
        : `день ${day} из ${PLAN.testDay}, ${isTrainingDay(day) ? (spec ? (spec.kind === 'test' ? 'тест' : specTitle(spec)) : '') : 'отдых'}`

  const doImport = async (file: File) => {
    try {
      const text = await file.text()
      const n = await store.importAll(JSON.parse(text))
      toast(`Импортировано тренировок: ${n}`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Не удалось импортировать файл')
    }
  }

  return (
    <>
      <header className="app-header">
        <button className="icon-btn" onClick={onBack} aria-label="Назад">
          <IconChevron size={19} dir="left" />
        </button>
        <h1 className="h-page">Настройки</h1>
        <span style={{ width: 40 }} />
      </header>

      <section className="section glass" aria-label="План">
        <div className="section-title">План</div>
        <div className="settings-row" style={{ minHeight: 0, padding: '8px 0 12px' }}>
          <div>
            <div className="sub" style={{ marginTop: 0 }}>{phaseText}</div>
            {day !== null && <div className="sub">{dayLabel(day)}</div>}
          </div>
        </div>
        <div className="settings-row">
          <span className="k">Подходов</span>
          <MiniStepper
            value={settings.override?.sets ?? (day !== null && day > PLAN.phaseA.lastDay ? PLAN.phaseB.sets : PLAN.phaseA.sets)}
            min={1}
            max={10}
            onChange={(v) => void store.patchSettings({ override: { sets: v, reps: settings.override?.reps ?? 13 } })}
          />
        </div>
        <div className="settings-row">
          <span className="k">Повторений в подходе</span>
          <MiniStepper
            value={settings.override?.reps ?? 13}
            min={1}
            max={99}
            onChange={(v) => void store.patchSettings({ override: { sets: settings.override?.sets ?? 3, reps: v } })}
          />
        </div>
        <div className="settings-row" style={{ minHeight: 0, padding: '10px 0 14px' }}>
          <span className="sub" style={{ marginTop: 0 }}>
            Ручные параметры применяются к обычным тренировкам вместо плановых норм. Автоматического роста нагрузки нет.
          </span>
        </div>
        {settings.override && (
          <div className="settings-row">
            <button className="row-btn" onClick={() => setResetPlan(true)}>
              <span className="k t-ice">Вернуть плановые нормы</span>
              <span className="chev">↺</span>
            </button>
          </div>
        )}
        <div className="settings-row">
          <button className="row-btn" onClick={() => setNewCycle(true)}>
            <span className="k">Начать новый цикл</span>
            <IconChevron size={17} dir="right" className="chev" />
          </button>
        </div>
      </section>

      <section className="section glass" aria-label="Напоминание">
        <div className="section-title">Напоминание</div>
        <div className="settings-row">
          <div>
            <div className="k">О тренировке</div>
            <div className="sub">в тренировочные дни, раз в день</div>
          </div>
          <button
            className={`switch ${settings.reminder.enabled ? 'on' : ''}`}
            role="switch"
            aria-checked={settings.reminder.enabled}
            aria-label="Напоминание о тренировке"
            onClick={async () => {
              const enabling = !settings.reminder.enabled
              if (enabling && notificationPermission() === 'default') {
                await requestPermission()
              }
              void store.patchSettings({ reminder: { ...settings.reminder, enabled: enabling } })
            }}
          />
        </div>
        {settings.reminder.enabled && (
          <div className="settings-row">
            <span className="k">Время</span>
            <input
              className="time-input"
              type="time"
              value={settings.reminder.time}
              onChange={(e) => {
                if (e.target.value) void store.patchSettings({ reminder: { ...settings.reminder, time: e.target.value } })
              }}
            />
          </div>
        )}
        <div className="settings-row" style={{ minHeight: 0, padding: '8px 0 14px' }}>
          <span className="sub" style={{ marginTop: 0 }}>
            {perm === 'granted'
              ? 'Уведомления разрешены. Работают, пока приложение открыто; при полностью закрытом окне напоминание не гарантируется.'
              : perm === 'denied'
                ? 'Уведомления запрещены в настройках браузера.'
                : 'Нужно разрешение на уведомления.'}
          </span>
        </div>
        {perm !== 'granted' && perm !== 'denied' && (
          <div className="settings-row" style={{ minHeight: 0, paddingBottom: 14 }}>
            <button className="btn btn-quiet" onClick={() => void requestPermission()}>
              Разрешить уведомления
            </button>
          </div>
        )}
      </section>

      <section className="section glass" aria-label="Данные">
        <div className="section-title">Данные</div>
        <button
          className="row-btn"
          onClick={() => {
            downloadBackup(store.exportAll())
            toast('Резервная копия сохранена')
          }}
        >
          <span className="k">Экспорт в JSON</span>
          <IconDownload size={19} className="chev" />
        </button>
        <button className="row-btn" onClick={() => fileRef.current?.click()}>
          <span className="k">Импорт резервной копии</span>
          <IconUpload size={19} className="chev" />
        </button>
        <div className="settings-row" style={{ minHeight: 0, padding: '8px 0 14px' }}>
          <span className="sub" style={{ marginTop: 0 }}>
            Импорт заменяет текущие данные. Тренировок в базе: {workouts.length}.
          </span>
        </div>
        <button className="row-btn" style={{ color: 'var(--danger)' }} onClick={() => setWipe(true)}>
          <span className="k">Удалить все данные</span>
        </button>
      </section>

      <section className="section glass" aria-label="О приложении">
        <div className="section-title">О приложении</div>
        {canInstall && (
          <button className="row-btn" onClick={onInstall}>
            <span className="k t-ice">Установить приложение</span>
            <IconChevron size={17} dir="right" className="chev" />
          </button>
        )}
        <div className="settings-row" style={{ minHeight: 0, padding: '10px 0 16px' }}>
          <span className="sub" style={{ marginTop: 0 }}>
            REP 1.0. Все данные хранятся только на этом устройстве. Без серверов и регистрации.
          </span>
        </div>
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setPendingImport(f)
          e.target.value = ''
        }}
      />

      <Sheet
        open={newCycle}
        title="Начать новый цикл?"
        text="Сегодня станет днём 1. Нормы вернутся к плановым: 14 дней 3 × 13, затем 14 дней 4 × 13."
        confirmLabel="Начать"
        onClose={() => setNewCycle(false)}
        onConfirm={() => {
          void store.patchSettings({ planStart: todayKey(), override: null })
          toast('Новый цикл начат')
        }}
      />

      <Sheet
        open={resetPlan}
        title="Вернуть плановые нормы?"
        text="Ручные параметры будут сняты, вернутся нормы цикла."
        confirmLabel="Вернуть"
        onClose={() => setResetPlan(false)}
        onConfirm={() => {
          void store.patchSettings({ override: null })
          toast('Плановые нормы восстановлены')
        }}
      />

      <Sheet
        open={wipe}
        title="Удалить все данные?"
        text="Будут удалены история тренировок и настройки. Это нельзя отменить."
        confirmLabel="Удалить"
        danger
        onClose={() => setWipe(false)}
        onConfirm={() => {
          void store.wipeAll()
          toast('Данные удалены')
        }}
      />

      <Sheet
        open={pendingImport !== null}
        title="Импортировать копию?"
        text="Текущие данные будут заменены содержимым файла."
        confirmLabel="Заменить"
        danger
        onClose={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) void doImport(pendingImport)
          setPendingImport(null)
        }}
      />
    </>
  )
}

function MiniStepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="mini-stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} aria-label="Меньше" disabled={value <= min}>
        −
      </button>
      <span className="val num">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="Больше" disabled={value >= max}>
        +
      </button>
    </div>
  )
}
