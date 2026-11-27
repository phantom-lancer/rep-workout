interface IconProps {
  size?: number
  className?: string
}

function base(size?: number, className?: string) {
  return {
    width: size ?? 24,
    height: size ?? 24,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true as const,
    className,
  }
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconHome({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.5 10.4 12 4.6l7.5 5.8V19a1.4 1.4 0 0 1-1.4 1.4H5.9A1.4 1.4 0 0 1 4.5 19v-8.6Z" {...stroke} />
    </svg>
  )
}

export function IconJournal({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M7 4.8h10a2 2 0 0 1 2 2v12.4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.8a2 2 0 0 1 2-2Z" {...stroke} />
      <path d="M9 9.4h6M9 12.7h6M9 16h3.4" {...stroke} />
    </svg>
  )
}

export function IconStats({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.6 19.4V4.6" {...stroke} />
      <path d="M4.6 19.4h14.8" {...stroke} />
      <path d="M7.6 15.4v-3M12 15.4V8.6m4.4 6.8v-5" {...stroke} />
    </svg>
  )
}

export function IconGear({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="3.1" {...stroke} />
      <path
        d="M12 3.2c.9 0 1.7.14 2.5.4l.4 2a6.9 6.9 0 0 1 1.7 1l1.9-.7c.5.5.94 1.1 1.3 1.7l-1.3 1.6c.14.6.22 1.2.22 1.8s-.08 1.2-.22 1.8l1.3 1.6c-.36.6-.8 1.2-1.3 1.7l-1.9-.7a6.9 6.9 0 0 1-1.7 1l-.4 2c-.8.26-1.6.4-2.5.4s-1.7-.14-2.5-.4l-.4-2a6.9 6.9 0 0 1-1.7-1l-1.9.7c-.5-.5-.94-1.1-1.3-1.7l1.3-1.6A7.2 7.2 0 0 1 4.72 12c0-.6.08-1.2.22-1.8L3.64 8.6c.36-.6.8-1.2 1.3-1.7l1.9.7a6.9 6.9 0 0 1 1.7-1l.4-2c.8-.26 1.6-.4 2.5-.4Z"
        {...stroke}
      />
    </svg>
  )
}

export function IconPlus({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 5.4v13M5.4 12h13" {...stroke} strokeWidth={2.1} />
    </svg>
  )
}

export function IconMinus({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5.4 12h13" {...stroke} strokeWidth={2.1} />
    </svg>
  )
}

export function IconClose({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" {...stroke} />
    </svg>
  )
}

export function IconCheck({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m5 12.6 4.4 4.4L19 7.4" {...stroke} strokeWidth={2.1} />
    </svg>
  )
}

export function IconBell({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6.2 10.4a5.8 5.8 0 0 1 11.6 0c0 3 .8 4.7 1.6 5.7.3.4 0 1-.5 1H5.1c-.5 0-.8-.6-.5-1 .8-1 1.6-2.7 1.6-5.7Z" {...stroke} />
      <path d="M10 19.6a2.2 2.2 0 0 0 4 0" {...stroke} />
    </svg>
  )
}

export function IconDownload({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 4.4v10.2m0 0 4-4m-4 4-4-4" {...stroke} />
      <path d="M5 17.6v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" {...stroke} />
    </svg>
  )
}

export function IconUpload({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 14.6V4.4m0 0 4 4m-4-4-4 4" {...stroke} />
      <path d="M5 17.6v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" {...stroke} />
    </svg>
  )
}

export function IconTrash({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5.6 7h12.8M9.4 7V5.4a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4V7m3.2 0-.7 11a1.8 1.8 0 0 1-1.8 1.7H8.7a1.8 1.8 0 0 1-1.8-1.7L6.2 7" {...stroke} />
    </svg>
  )
}

export function IconChevron({ size, className, dir = 'down' }: IconProps & { dir?: 'down' | 'right' | 'left' }) {
  const transform = dir === 'right' ? undefined : dir === 'down' ? 'rotate(90deg)' : 'rotate(180deg)'
  return (
    <svg {...base(size, className)} style={transform ? { transform } : undefined}>
      <path d="m9.4 5.6 6 6.4-6 6.4" {...stroke} strokeWidth={2} />
    </svg>
  )
}
