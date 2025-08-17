import type { PromptMessage } from '@/types';
import { MessageSquare, BookMarked, ArrowBigRightDash, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type MessageListProps = { items: PromptMessage[] }
export function MessageList({ items }: MessageListProps) {
  if (!items?.length) return null
  return (
    <div className="space-y-2">
      {items.map((m, i) => (
        <MessageRow key={i} idx={i} msg={m} />
      ))}
    </div>
  )
}

export function MessageRow({ msg, idx }: { msg: PromptMessage; idx: number }) {
  const navigate = useNavigate()
  const c = msg.content as any
  const isText = c?.type === 'text'
  const isRes = c?.type === 'resource_link'
  const Icon = isText ? MessageSquare : BookMarked
  const iconTone = isText ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10'

  const simplifiedRole = msg.role === 'user' ? 'запрос' : 'ресурс'

  async function copy(v: string) {
    try { await navigator.clipboard.writeText(v) } catch { /* ignore */ }
  }

  return (
    <div
      className="group relative flex items-center gap-3 rounded-xl border border-base-300/80
                 bg-base-100/90 p-3 shadow-sm transition"
    >
      <div className={`mt-0.5 shrink-0 rounded-lg p-2 ring-1 ring-base-300/60 ${iconTone}`}>
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-xs text-base-content/60">
          <span className="badge badge-ghost">{simplifiedRole}</span>
          <span className="opacity-60">#{idx + 1}</span>
          {isRes && c?.internalName && (
            <>
              <span className="font-bold text-base">{c.internalName}</span>
              <button
                className="btn btn-ghost btn-xs btn-square"
                onClick={() => copy(c.internalName)}
                title="Скопировать"
              >
                <Copy size={20} />
              </button>
              <button
                className="btn btn-ghost btn-xs btn-square"
                onClick={() => navigate(`/resources/${encodeURIComponent(c.internalName)}`)}
              >
                <ArrowBigRightDash size={20} />
              </button>
            </>
          )}
        </div>

        {isText && (
          <div className="whitespace-pre-wrap break-words leading-relaxed select-text">
            {c.text}
          </div>
        )}

        {!isText && !isRes && (
          <div className="opacity-60 text-sm">Неизвестный тип контента</div>
        )}
      </div>
    </div>
  )
}