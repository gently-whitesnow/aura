import React, { useLayoutEffect, useRef } from 'react'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number
  maxRows?: number
}

export default function AutoResizeTextarea({
  value,
  minRows = 4,
  maxRows,
  className,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const cs = window.getComputedStyle(el)
    const border =
      parseFloat(cs.borderTopWidth || '0') + parseFloat(cs.borderBottomWidth || '0')
    const padding =
      parseFloat(cs.paddingTop || '0') + parseFloat(cs.paddingBottom || '0')
    const lhRaw = parseFloat(cs.lineHeight || '0')
    const lineHeight = Number.isFinite(lhRaw) && lhRaw > 0 ? lhRaw : 20

    const minH = Math.max(0, (minRows ?? 0) * lineHeight + padding + border)
    const maxH = maxRows ? maxRows * lineHeight + padding + border : Infinity

    el.style.height = 'auto'
    el.style.overflowY = 'hidden'
    const next = Math.min(Math.max(el.scrollHeight, minH), maxH)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
  }, [value, minRows, maxRows])

  return (
    <textarea
      ref={ref}
      value={value as any}
      className={
        `resize-none overflow-hidden ${className ?? ''}`
      }
      {...rest}
    />
  )
}