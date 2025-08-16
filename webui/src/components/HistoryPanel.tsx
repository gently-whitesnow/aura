import { useEffect, useMemo, useState } from 'react'
import type { PromptRecord, ResourceRecord } from '../types'
import { VersionStatus } from '../types'

type Item = PromptRecord | ResourceRecord

type Props = {
  items: Item[]
  activeVersion: number | null
  isAdmin?: boolean
  onPreview: (version: number | null) => void // передаём номер для предпросмотра, null = снять предпросмотр
  onChangeStatus?: (version: number, status: number) => Promise<void>
}

export function HistoryPanel({
  items, activeVersion, isAdmin, onPreview, onChangeStatus
}: Props) {
  const [previewVersion, setPreviewVersion] = useState<number | null>(activeVersion)

  // Если активная версия изменилась (после загрузки данных), подсветим её по умолчанию
  useEffect(() => {
    setPreviewVersion(activeVersion)
  }, [activeVersion])
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.version - a.version),
    [items]
  )

  const onPreviewClick = (version: number) => {
    setPreviewVersion(version)
    onPreview(version)
  }

  if (!sorted.length) return <div className="text-sm opacity-70">История пуста</div>

  return (
    <div className="space-y-2">
      {sorted.map(v => {
        const isActive = v.version === activeVersion
        const status = v.status === VersionStatus.Approved ? 'Approved' : v.status === VersionStatus.Pending ? 'Pending' : 'Declined'
        const theme = status === 'Approved' ? 'success' : status === 'Pending' ? 'warning' : 'error'
        return (
          <div className="flex gap-2 justify-between" key={v.version}>
            <div className={`flex-1 card border cursor-pointer hover:shadow-md ${previewVersion === v.version ? `border-${theme}` : 'border-base-200'}`} onClick={() => onPreviewClick(v.version)}>
              <div className="card-body p-3">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm">v{v.version}</div>
                  <span className={`badge badge-sm badge-${theme}`}>
                    {status}
                  </span>
                  {isActive && <span className="badge badge-sm badge-success">active</span>}
                </div>
                <div className="text-xs opacity-60">
                  Автор: {v.createdBy} • {new Date(v.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            {isAdmin && onChangeStatus && (
              <select
                className="select select-xs select-bordered"
                value={status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onChangeStatus(v.version, Number(e.target.value))}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}