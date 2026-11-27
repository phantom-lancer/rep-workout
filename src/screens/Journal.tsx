import { useState } from 'react'
import { store, useStore } from '../store'
import type { Workout } from '../lib/db'
import { formatDayShort, formatDuration, formatTime, parseDateKey, plural } from '../lib/time'
import { totalReps } from '../lib/stats'
import { Sheet } from '../components/Sheet'
import { IconTrash } from '../components/Icon'

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

export function Journal() {
  const { workouts } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const done = workouts
    .filter((w) => w.status !== 'in_progress')
    .sort((a, b) => b.startedAt - a.startedAt)

  let lastMonth = ''

  return (
    <>
      <header className="app-header">
        <h1 className="h-page">Журнал</h1>
      </header>

      {done.length === 0 && (
        <p className="empty-note" style={{ textAlign: 'center', padding: '40px 20px' }}>
          Здесь появится история тренировок. Начните первую с главного экрана.
        </p>
      )}

      {done.map((w) => {
        const d = parseDateKey(w.date)
        const month = MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '')
        const showMonth = month !== lastMonth
        lastMonth = month
        const open = openId === w.id
        return (
          <div key={w.id}>
            {showMonth && <div className="month-label">{month}</div>}
            <JournalItem
              w={w}
              open={open}
              onToggle={() => setOpenId(open ? null : w.id)}
              onDelete={() => setDeleteId(w.id)}
            />
          </div>
        )
      })}

      <Sheet
        open={deleteId !== null}
        title="Удалить тренировку?"
        text="Запись будет удалена из журнала и статистики."
        confirmLabel="Удалить"
        danger
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) void store.deleteWorkout(deleteId)
          setDeleteId(null)
        }}
      />
    </>
  )
}

function JournalItem({ w, open, onToggle, onDelete }: { w: Workout; open: boolean; onToggle: () => void; onDelete: () => void }) {
  const total = totalReps(w)
  const duration = (((w.finishedAt ?? w.startedAt) - w.startedAt) / 1000) | 0
  const setsText = w.sets.map((s) => s.done).join(', ')

  return (
    <article
      className="journal-item glass"
      style={{ marginBottom: 8, cursor: 'pointer' }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      aria-expanded={open}
    >
      <div className="journal-top">
        <span className="journal-date">{formatDayShort(parseDateKey(w.date))}</span>
        <span className="journal-time">{formatTime(w.startedAt)}</span>
      </div>
      <div className="journal-sets">
        {w.kind === 'test' ? `Тест: ${total}` : `${w.sets.length} ${plural(w.sets.length, 'подход', 'подхода', 'подходов')}: ${setsText}`}
      </div>
      <div className="journal-meta">
        <span className="num">{total}</span>
        <span>{plural(total, 'повторение', 'повторения', 'повторений')}</span>
        <span>{formatDuration(duration)}</span>
        {w.status === 'partial' && <span className="tag partial">частично</span>}
        {w.status === 'test' && <span className="tag test">тест</span>}
      </div>
      {open && (
        <div className="journal-expand">
          {w.sets.map((s, i) => (
            <div className="expand-row" key={i}>
              <span>Подход {i + 1}</span>
              <span className="num">
                {s.done}
                {s.target !== null && s.target !== s.done ? ` из ${s.target}` : ''}
              </span>
            </div>
          ))}
          <button
            className="btn btn-quiet btn-danger"
            style={{ marginTop: 6, height: 38, fontSize: 14 }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <IconTrash size={16} />
            Удалить
          </button>
        </div>
      )}
    </article>
  )
}
