import { useEffect, useMemo, useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import type { NewResourceVersionDto, ResourceRecord } from '@/types'
import { VersionStatus } from '@/types'
import { api } from '@/lib/api'
import { useUser } from '@/store/user'
import { HistoryPanel } from '@/pages/PrimitivePage/components/HistoryPanel'
import CreateResourceModal from '@/components/CreateResourceModal'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card bg-base-100">
      <div className="card-body p-4">
        <h2 className="card-title text-base mb-2">{title}</h2>
        {children}
      </div>
    </section>
  )
}

export function ResourceView({ keyName }: { keyName: string }) {
  const { info } = useUser()
  const [active, setActive] = useState<ResourceRecord | null>(null)
  const [history, setHistory] = useState<ResourceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [displayVersion, setDisplayVersion] = useState<number | null>(null)
  const [editingOpen, setEditingOpen] = useState(false)

  const displayed = useMemo<ResourceRecord | null>(() => {
    if (displayVersion == null) return active
    return history.find(v => v.version === displayVersion) ?? active
  }, [active, history, displayVersion])

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const [a, h] = await Promise.all([
        api.resourceActive(keyName),
        api.resourceHistory(keyName),
      ])
      setActive(a)
      setHistory(h)
      setDisplayVersion(a?.version ?? 0)
    } catch {
      setErr('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [keyName])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (displayVersion != null && !history.some(v => v.version === displayVersion)) {
      setDisplayVersion(null)
    }
  }, [history, displayVersion])

  const onChangeStatus = async (v: number, status: number) => {
    try {
      await api.setResourceStatus(keyName, v, status)
      await load()
      setToast('Статус обновлён')
    } catch {
      setToast('Ошибка смены статуса')
    }
  }

  const initialValuesForEditing: NewResourceVersionDto | undefined = displayed
    ? {
      title: displayed.title ?? '',
      text: displayed.text ?? '',
      description: displayed.description ?? ''
    }
    : undefined

  const isAdmin = !!info?.isAdmin
  const displayedIsActive = displayed && active && displayed.version === active.version
  const statusDescription =
    displayed?.status === VersionStatus.Approved ? 'Approved'
      : displayed?.status === VersionStatus.Pending ? 'Pending'
        : 'Declined'

  return (
    <div className="flex flex-col gap-4">
      <Section title={displayVersion != active?.version ? `Предпросмотр v${displayVersion}` : 'Активная версия'}>
        {loading && <div className="loading loading-dots loading-lg" />}
        {err && <div className="alert alert-error">{err}</div>}

        {!loading && !displayed && (
          <div className="text-sm opacity-70">Нет активной версии</div>
        )}

        {!loading && displayed && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="font-medium">{displayed.title || 'Без названия'}</div>
                <div className="text-xs opacity-60">
                  v{displayed.version} · статус: {statusDescription}
                  {displayedIsActive ? ' · активная' : ''}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  className="btn btn-sm"
                  onClick={() => setEditingOpen(true)}
                  disabled={!displayed}
                >
                  Создать новую версию
                </button>

                {isAdmin && displayed && (
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    title="Удалить эту версию"
                    onClick={async () => {
                      const ok = window.confirm(`Удалить версию v${displayed.version}?`)
                      if (!ok) return
                      try {
                        await api.deleteResourceVersion(keyName, displayed.version)
                        setToast('Версия удалена')
                        await load()
                      } catch {
                        setToast('Ошибка удаления')
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Описание (если есть) */}
            {displayed.description?.trim() && (
              <div className="text-sm">{displayed.description}</div>
            )}

            {/* Контент */}
            {displayed.uri && (
              <div className="text-sm break-all">
                <span className="opacity-60">URI: </span>{displayed.uri}
              </div>
            )}
            {displayed.text && (
              <pre className="p-3 bg-base-200/60 rounded text-sm overflow-auto whitespace-pre-wrap break-words leading-relaxed select-text">
                {displayed.text}
              </pre>
            )}
          </div>
        )}
      </Section>

      <Section title="История версий">
        <HistoryPanel
          items={history}
          activeVersion={active?.version ?? 0}
          displayVersion={displayVersion ?? 0}
          isAdmin={isAdmin}
          onSelectVersion={(v) => setDisplayVersion(v)}
          onChangeStatus={onChangeStatus}
        />
      </Section>

      {editingOpen && (
        <CreateResourceModal
          initialKey={keyName}
          lockKey
          {...(initialValuesForEditing ? { initialValues: initialValuesForEditing } : {})}
          onSubmit={async (_ignored, payload) => {
            await api.createResourceVersion(keyName, payload)
            setEditingOpen(false)
            setToast('Версия отправлена на апрув')
            await load()
          }}
          onClose={() => setEditingOpen(false)}
        />
      )}

      {toast && (
        <div className="toast toast-end">
          <div className="alert alert-info" role="status">
            <span>{toast}</span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setToast(null)}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}