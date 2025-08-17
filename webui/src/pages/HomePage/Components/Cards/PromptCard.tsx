import { Link } from 'react-router-dom'
import { WandSparkles } from 'lucide-react'
import type { PromptRecord } from '@/types'

export function PromptCard({ record }: { record: PromptRecord }) {
  return (
    <Link
      to={`/prompts/${encodeURIComponent(record.name)}`}
      className="card border border-base-200 bg-base-100 transition-shadow duration-200
                 hover:shadow-md focus:shadow-md focus:outline-none"
    >
      <div className="card-body p-4">
        <div className="flex items-center gap-2">
          <WandSparkles className="w-5 h-5 opacity-80" aria-hidden />
          <h3
            className="card-title text-base flex-1 truncate"
            title={record.title ?? ''}
          >
            {record.title ?? 'Без названия'}
          </h3>
          {record.version != null && (
            <span
              className="badge badge-sm"
              aria-label={`Активная версия ${record.version}`}
            >
              v{record.version}
            </span>
          )}
        </div>
        <div className="text-xs opacity-60 truncate" title={record.name}>
          {record.name}
        </div>
      </div>
    </Link>
  )
}