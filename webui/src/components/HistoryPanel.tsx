import { useMemo } from 'react'
import type { PromptRecord, ResourceRecord } from '../types'

type Item = PromptRecord | ResourceRecord

type Props = {
  items: Item[]
  activeVersion?: number | null
  isAdmin?: boolean
  onPreview: (version: number | null) => void // передаём номер для предпросмотра, null = снять предпросмотр
  onApprove?: (version: number) => Promise<void>
  onSetActive?: (version: number) => Promise<void>
}

export function HistoryPanel({
  items, activeVersion, isAdmin, onPreview, onApprove, onSetActive
}: Props) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.version - a.version),
    [items]
  )

  if (!sorted.length) return <div className="text-sm opacity-70">История пуста</div>

  return (
    <div className="space-y-2">
      {sorted.map(v => {
        const isActive = v.version === activeVersion
        const canApprove = isAdmin && v.status === 'Pending'
        const canSetActive = v.status === 'Approved' && !isActive
        return (
          <div className={`card border border-base-200 ${isActive ? 'border-success' : ''}`}>
            <div className="card-body p-3">
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm">v{v.version}</div>
                <span className={`badge badge-sm ${v.status === 'Approved' ? 'badge-success' : ''}`}>
                  {v.status}
                </span>
                {isActive && <span className="badge badge-sm">active</span>}
                <div className="flex-1" />
                <button className="btn btn-xs" onClick={() => onPreview(v.version)}>
                  Просмотр
                </button>
                {canSetActive && onSetActive && (
                  <button className="btn btn-xs btn-outline" onClick={() => onSetActive(v.version)}>
                    Сделать активной
                  </button>
                )}
                {canApprove && onApprove && (
                  <button className="btn btn-xs btn-primary" onClick={() => onApprove(v.version)}>
                    Апрув
                  </button>
                )}
              </div>
              <div className="text-xs opacity-60">
                Автор: {v.createdBy} • {new Date(v.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}