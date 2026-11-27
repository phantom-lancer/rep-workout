interface RingProps {
  /** 0..1 */
  progress: number
  size?: number
  width?: number
  label?: string
  caption?: string
}

export function Ring({ progress, size = 92, width = 6, label, caption }: RingProps) {
  const r = (size - width) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={width}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringIce)"
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.34,1.4,0.5,1)' }}
        />
        <defs>
          <linearGradient id="ringIce" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c8e6f8" />
            <stop offset="100%" stopColor="#6ea6cc" />
          </linearGradient>
        </defs>
      </svg>
      {(label || caption) && (
        <div className="ring-label">
          {label && <span className="v num">{label}</span>}
          {caption && <span className="c">{caption}</span>}
        </div>
      )}
    </div>
  )
}
