import { useLayoutEffect, useRef, useState } from 'react'

export interface ChartPoint {
  date: string
  total: number
  test: boolean
}

/**
 * График изменения результатов: одна холодная линия с мягкой заливкой,
 * точки контрольных тестов выделены. Без разноцветья.
 */
export function Chart({ points }: { points: ChartPoint[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(320)
  const h = 150
  const pad = { top: 14, right: 10, bottom: 22, left: 10 }

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width && width > 0) setW(width)
    })
    ro.observe(el)
    setW(el.clientWidth || 320)
    return () => ro.disconnect()
  }, [])

  if (points.length === 0) {
    return (
      <div className="chart-card glass">
        <div className="chart-title">Изменение результатов</div>
        <p className="empty-note" style={{ padding: '10px 0 12px' }}>
          График появится после первых тренировок
        </p>
      </div>
    )
  }

  const max = Math.max(...points.map((p) => p.total), 1)
  const iw = w - pad.left - pad.right
  const ih = h - pad.top - pad.bottom
  const x = (i: number) => pad.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw)
  const y = (v: number) => pad.top + ih - (v / max) * ih

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)},${pad.top + ih} L${x(0).toFixed(1)},${pad.top + ih} Z`

  const gridLines = [0.25, 0.5, 0.75]
  const first = points[0]
  const last = points[points.length - 1]

  return (
    <div className="chart-card glass" ref={ref}>
      <div className="chart-title">Изменение результатов</div>
      <svg width={w} height={h} style={{ display: 'block', width: '100%' }} role="img" aria-label="Объём по тренировкам">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(156,208,240,0.22)" />
            <stop offset="100%" stopColor="rgba(156,208,240,0)" />
          </linearGradient>
          <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6ea6cc" />
            <stop offset="100%" stopColor="#c8e6f8" />
          </linearGradient>
        </defs>
        {gridLines.map((g) => (
          <line
            key={g}
            x1={pad.left}
            x2={w - pad.right}
            y1={pad.top + ih * g}
            y2={pad.top + ih * g}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#chartFill)" />
        <path
          d={line}
          fill="none"
          stroke="url(#chartLine)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) =>
          p.test ? (
            <circle key={p.date + i} cx={x(i)} cy={y(p.total)} r="4" fill="#0d1016" stroke="#9cd0f0" strokeWidth="2" />
          ) : null,
        )}
        <text x={pad.left} y={h - 6} fontSize="10.5" fill="rgba(154,163,178,0.85)">
          {formatChartDate(first.date)}
        </text>
        <text x={w - pad.right} y={h - 6} fontSize="10.5" fill="rgba(154,163,178,0.85)" textAnchor="end">
          {formatChartDate(last.date)}
        </text>
      </svg>
    </div>
  )
}

function formatChartDate(key: string): string {
  const [, m, d] = key.split('-')
  return `${d}.${m}`
}
