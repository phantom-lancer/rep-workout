import { IconHome, IconJournal, IconStats } from './Icon'

export type View = 'home' | 'journal' | 'stats'

const tabs: { id: View; label: string; icon: (p: { size?: number }) => React.ReactNode }[] = [
  { id: 'home', label: 'Сегодня', icon: IconHome },
  { id: 'journal', label: 'Журнал', icon: IconJournal },
  { id: 'stats', label: 'Статистика', icon: IconStats },
]

interface TabBarProps {
  view: View
  onChange: (v: View) => void
}

export function TabBar({ view, onChange }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Разделы">
      {tabs.map((t) => {
        const Icon = t.icon
        return (
          <button
            key={t.id}
            className={`tab ${view === t.id ? 'active' : ''}`}
            onClick={() => onChange(t.id)}
            aria-current={view === t.id ? 'page' : undefined}
          >
            <Icon size={23} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
