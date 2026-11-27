/**
 * Уведомления без серверов и Push API — только Notification API.
 * Системные уведомления срабатывают, когда страница открыта (в т.ч. свёрнута).
 * Напоминания при полностью закрытом приложении не гарантируются — это честно
 * указано в настройках.
 */

export function notificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationSupported() ? Notification.permission : 'unsupported'
}

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Показ через Service Worker, где доступно (надёжнее на Android), иначе из страницы. */
export async function showNotification(title: string, body: string, tag?: string): Promise<void> {
  if (!notificationSupported() || Notification.permission !== 'granted') return
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, { body, tag, icon: '/rep-workout/icons/icon-192.png', badge: '/rep-workout/icons/icon-192.png', silent: false })
        return
      }
    }
  } catch {
    /* упадём в вариант ниже */
  }
  try {
    const n = new Notification(title, { body, tag })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* уведомление не критично */
  }
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* не поддерживается */
  }
}
