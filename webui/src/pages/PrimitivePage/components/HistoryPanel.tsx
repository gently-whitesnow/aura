import { useMemo } from 'react'
import type { PromptRecord, ResourceRecord } from '@/types'
import { VersionStatus } from '@/types'

type Item = PromptRecord | ResourceRecord

type Props = {
  items: Item[]
  activeVersion: number
  isAdmin: boolean
  displayVersion: number
  onSelectVersion: (version: number) => void
  onChangeStatus?: (version: number, status: number
  ) => Promise<void>
}

export function HistoryPanel({
  items, activeVersion, isAdmin, onSelectVersion, onChangeStatus, displayVersion
}: Props) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.version - a.version),
    [items]
  )

  const onPreviewClick = (version: number) => onSelectVersion(version)

  if (!sorted.length) return <div className="text-sm opacity-70">История пуста</div>

  const borderClassByTheme: Record<number, string> = {
    [VersionStatus.Approved]: 'border-info',
    [VersionStatus.Pending]: 'border-warning',
    [VersionStatus.Declined]: 'border-error',
  };

  const badgeClassByTheme: Record<number, string> = {
    [VersionStatus.Approved]: 'badge-info',
    [VersionStatus.Pending]: 'badge-warning',
    [VersionStatus.Declined]: 'badge-error',
  };

  return (
    <div className="space-y-2">
      {sorted.map(v => {
        const isActive = v.version === activeVersion
        const statusDescription = v.status === VersionStatus.Approved ? 'Approved' : v.status === VersionStatus.Pending ? 'Pending' : 'Declined'
        return (
          <div className="flex gap-2 justify-between" key={v.version}>
            <div className={`flex-1 card border cursor-pointer hover:shadow-md ${displayVersion === v.version ? borderClassByTheme[v.status] : 'border-base-200'}`} onClick={() => onPreviewClick(v.version)}>
              <div className="card-body p-3">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm">v{v.version}</div>
                  <span className={`badge badge-sm ${badgeClassByTheme[v.status]}`}>
                    {statusDescription}
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
                value={v.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onChangeStatus(v.version, Number(e.target.value))}
              >
                <option value={VersionStatus.Pending}>Pending</option>
                <option value={VersionStatus.Approved}>Approved</option>
                <option value={VersionStatus.Declined}>Declined</option>
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}