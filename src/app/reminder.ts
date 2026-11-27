import { store } from '../store'
import { isTrainingDay, planDay, scheduledFor } from '../lib/plan'
import { notificationPermission, showNotification } from '../lib/notifications'
import { todayKey } from '../lib/time'

/**
 * Напоминание о тренировке. Без Push и без фоновых сервисов:
 * проверка выполняется, пока приложение открыто (при загрузке и раз в минуту).
 * Не чаще одного уведомления в день и только в тренировочные дни.
 */

const WINDOW_MS = 60 * 60 * 1000 // уведомляем в течение часа после заданного времени

export function checkReminder(): void {
  const s = store.settings
  if (!s.reminder.enabled) return
  if (notificationPermission() !== 'granted') return
  const key = todayKey()
  if (s.lastReminderDate === key) return

  const [h, m] = s.reminder.time.split(':').map(Number)
  const due = new Date()
  due.setHours(h || 0, m || 0, 0, 0)
  const now = Date.now()
  if (now < due.getTime() || now - due.getTime() > WINDOW_MS) return

  const day = planDay(s.planStart, key)
  if (day === null || !isTrainingDay(day)) return
  if (store.workouts.some((w) => w.date === key)) return

  const spec = scheduledFor(day, s.override)
  const text = spec
    ? spec.kind === 'test'
      ? 'Сегодня контрольный тест: максимум повторений'
      : `Сегодня тренировка: ${spec.sets} × ${spec.reps}`
    : 'Сегодня тренировочный день'
  void showNotification('REP', text, 'reminder')
  void store.patchSettings({ lastReminderDate: key })
}
