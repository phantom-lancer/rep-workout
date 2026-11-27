import { useCallback, useEffect, useRef, useState } from 'react'
import { store, useStore } from './store'
import { TabBar, type View } from './components/TabBar'
import { Toast } from './components/Sheet'
import { Home } from './screens/Home'
import { Journal } from './screens/Journal'
import { Stats } from './screens/Stats'
import { Settings } from './screens/Settings'
import { Workout } from './screens/Workout'
import { checkReminder } from './app/reminder'
import type { WorkoutSpec } from './lib/plan'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function App() {
  const { loaded } = useStore()
  const { workouts } = useStore()
  const [view, setView] = useState<View>('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [workoutOpen, setWorkoutOpen] = useState(false)
  const [toastData, setToastData] = useState<{ id: number; text: string } | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const installEvt = useRef<BeforeInstallPromptEvent | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastData({ id: Date.now(), text })
    toastTimer.current = setTimeout(() => setToastData(null), 4000)
  }, [])

  /* инициализация базы */
  useEffect(() => {
    void store.init().then(() => {
      /* экран тренировки возвращается после перезагрузки вкладки, если был открыт */
      if (sessionStorage.getItem('rep.workoutOpen') === '1' && store.activeWorkout()) {
        setWorkoutOpen(true)
      }
    })
  }, [])

  const setWorkoutOpenPersisted = (v: boolean) => {
    setWorkoutOpen(v)
    if (v) sessionStorage.setItem('rep.workoutOpen', '1')
    else sessionStorage.removeItem('rep.workoutOpen')
  }

  /* напоминания: при запуске и далее раз в минуту, пока приложение открыто */
  useEffect(() => {
    if (!loaded) return
    checkReminder()
    const iv = setInterval(checkReminder, 60_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') checkReminder()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [loaded])

  /* кнопка установки PWA */
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      installEvt.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  /* восстановление: активная тренировка есть, а её экран закрыт — открываем по кнопке, не принуждаем */

  const openWorkout = (spec: WorkoutSpec | null) => {
    if (spec) {
      void store.startWorkout(spec.kind, spec.sets, spec.reps)
    }
    setWorkoutOpenPersisted(true)
  }

  if (!loaded) {
    return (
      <>
        <div className="ambient" />
        <div className="grain" />
        <div className="splash" aria-busy="true" />
      </>
    )
  }

  const active = workouts.find((w) => w.status === 'in_progress')

  return (
    <>
      <div className="ambient" />
      <div className="grain" />
      <div className="app">
        <div className="view" key={settingsOpen ? 'settings' : view}>
          {settingsOpen ? (
            <Settings
              onBack={() => setSettingsOpen(false)}
              toast={toast}
              canInstall={canInstall}
              onInstall={() => {
                void installEvt.current?.prompt()
              }}
            />
          ) : view === 'home' ? (
            <Home onOpen={openWorkout} onOpenSettings={() => setSettingsOpen(true)} />
          ) : view === 'journal' ? (
            <Journal />
          ) : (
            <Stats />
          )}
        </div>
      </div>

      {!settingsOpen && <TabBar view={view} onChange={setView} />}

      {workoutOpen && active && <Workout onExit={() => setWorkoutOpenPersisted(false)} toast={toast} />}

      <Toast toast={toastData} />
    </>
  )
}
