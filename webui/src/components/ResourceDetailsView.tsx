// components/ResourceDetailsView.tsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import type { ResourceRecord } from '../types'
import { api } from '../lib/api'
import { useUser } from '../store/user'
import { HistoryPanel } from './HistoryPanel'
import CreateResourceModal from './CreateResourceModal'

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

export function ResourceDetailsView({ keyName }: { keyName: string }) {
  const { info } = useUser()
  const [active, setActive] = useState<ResourceRecord | null>(null)
  const [history, setHistory] = useState<ResourceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [previewVersion, setPreviewVersion] = useState<number | null>(null)
  const [editingOpen, setEditingOpen] = useState(false)

  const displayed = useMemo<ResourceRecord | null>(() => {
    if (previewVersion == null) return active
    return history.find(v => v.version === previewVersion) ?? active
  }, [active, history, previewVersion])

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const [a, h] = await Promise.all([api.resourceActive(keyName), api.resourceHistory(keyName)])
      setActive(a)
      setHistory(h)
    } catch {
      setErr('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [keyName])

  useEffect(() => { load() }, [load])

  const onChangeStatus = async (v: number, status: number) => {
    try {
      await api.setStatus('Resource', keyName, v, status)
      await load()
      setToast('Статус обновлён')
    } catch {
      setToast('Ошибка смены статуса')
    }
  }

  // Явная смена активной версии не поддерживается: активной считается последняя Approved

  // Для ресурсов модалка создания не принимает initialValues

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Section title={previewVersion == null ? 'Активная версия' : `Предпросмотр v${previewVersion}`}>
          {loading && <div className="loading loading-dots loading-lg" />}
          {err && <div className="alert alert-error">{err}</div>}
          {!loading && !displayed && <div className="text-sm opacity-70">Нет активной версии</div>}
          {!loading && displayed && (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="font-medium flex-1">{displayed.title}</div>
                {previewVersion == null && (
                  <button className="btn btn-sm" onClick={() => setEditingOpen(true)}>
                    Редактировать
                  </button>
                )}
              </div>
              <div className="text-sm opacity-70 break-all">URI: {displayed.uri}</div>
              {displayed.text && (
                <pre className="p-3 bg-base-200 rounded text-sm overflow-auto">{displayed.text}</pre>
              )}
              {/* Активной считается последняя Approved версия */}
            </div>
          )}
        </Section>
      </div>

      <div className="space-y-4">
        <Section title="История версий">
          <HistoryPanel
            items={history}
            activeVersion={active?.version ?? null}
            isAdmin={!!info?.isAdmin}
            onPreview={setPreviewVersion}
            onChangeStatus={onChangeStatus}
          />
        </Section>
      </div>

      {editingOpen && (
        <CreateResourceModal
          onSubmit={async (_, payload) => {
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
            <button className="btn btn-ghost btn-xs" onClick={() => setToast(null)} aria-label="Закрыть">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}