import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, parseTypeFromPath } from '../lib/api'
import type { ArtifactType, PromptRecord, ResourceRecord, NewPromptVersionDto, NewResourceVersionDto } from '../types'
import { useUser } from '../store/user'

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

export default function DetailsPage() {
  const params = useParams()
  const urlType = params.type as string | undefined
  const routeType: ArtifactType = useMemo(() => {
    if (urlType) return parseTypeFromPath(urlType)
    const p = location.pathname.split('/')[1]
    return parseTypeFromPath(p)
  }, [urlType])
  const key = params.key as string
  const { info } = useUser()

  const [activePrompt, setActivePrompt] = useState<PromptRecord | null>(null)
  const [activeResource, setActiveResource] = useState<ResourceRecord | null>(null)
  const [history, setHistory] = useState<Array<PromptRecord | ResourceRecord>>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [formPrompt, setFormPrompt] = useState<NewPromptVersionDto>({ title: '', messages: [{ role: 'user', text: '' }], arguments: [] })
  const [formResource, setFormResource] = useState<NewResourceVersionDto>({ title: '', uri: '', text: '', description: '', mimeType: '' })
  const [formError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr(null)
    const load = routeType === 'Prompt'
      ? Promise.all([api.promptActive(key), api.promptHistory(key)])
      : Promise.all([api.resourceActive(key), api.resourceHistory(key)])

    load
      .then(([a, h]) => {
        if (cancelled) return
        if (routeType === 'Prompt') {
          setActivePrompt(a as PromptRecord | null)
        } else {
          setActiveResource(a as ResourceRecord | null)
        }
        setHistory(h as Array<PromptRecord | ResourceRecord>)
      })
      .catch(() => !cancelled && setErr('Ошибка загрузки'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [routeType, key])

  const canSubmit = useMemo(() => {
    if (routeType === 'Prompt') {
      const f = formPrompt
      return Boolean((f.title ?? '').length >= 0 && f.messages && f.messages.length > 0 && f.messages[0].text.trim().length > 0)
    }
    const r = formResource
    return Boolean((r.title ?? '').length >= 0 && r.uri && r.uri.length > 0)
  }, [formPrompt, formResource, routeType])

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      if (routeType === 'Prompt') {
        await api.createPromptVersion(key, formPrompt)
      } else {
        await api.createResourceVersion(key, formResource)
      }
      setToast('Версия отправлена на апрув')
      const h = routeType === 'Prompt' ? await api.promptHistory(key) : await api.resourceHistory(key)
      setHistory(h as Array<PromptRecord | ResourceRecord>)
    } catch {
      setToast('Ошибка сохранения')
    } finally {
      setSubmitting(false)
    }
  }

  const onApprove = async (v: number) => {
    try {
      await api.approve(routeType, key, v)
      if (routeType === 'Prompt') {
        const [a, h] = await Promise.all([api.promptActive(key), api.promptHistory(key)])
        setActivePrompt(a)
        setHistory(h as Array<PromptRecord | ResourceRecord>)
      } else {
        const [a, h] = await Promise.all([api.resourceActive(key), api.resourceHistory(key)])
        setActiveResource(a)
        setHistory(h as Array<PromptRecord | ResourceRecord>)
      }
      setToast('Версия апрувнута')
    } catch {
      setToast('Ошибка апрува')
    }
  }

  return (
    <div className="space-y-4">
      <nav className="text-sm breadcrumbs">
        <ul>
          <li>
            <Link to={routeType === 'Prompt' ? '/prompts' : '/resources'}>
              {routeType === 'Prompt' ? 'Промпты' : 'Ресурсы'}
            </Link>
          </li>
          <li className="truncate">{key}</li>
        </ul>
      </nav>

      {loading && <div className="loading loading-dots loading-lg" aria-live="polite" />}
      {err && <div className="alert alert-error">{err}</div>}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
             <Section title="Активная версия">
              {routeType === 'Prompt' ? (!activePrompt ? (
                <div className="text-sm opacity-70">Нет активной версии</div>
              ) : (
                <div className="space-y-2">
                  <div className="font-medium">{activePrompt.title}</div>
                  <pre className="p-3 bg-base-200 rounded text-sm overflow-auto" aria-label="Сообщение промпта">
                    {activePrompt.messages?.map((m) => `${m.role}: ${m.text}`).join('\n')}
                  </pre>
                </div>
              )) : (!activeResource ? (
                <div className="text-sm opacity-70">Нет активной версии</div>
              ) : (
                <div className="space-y-2">
                  <div className="font-medium">{activeResource.title}</div>
                  <div className="text-sm opacity-70 break-all">URI: {activeResource.uri}</div>
                  {activeResource.text && (
                    <pre className="p-3 bg-base-200 rounded text-sm overflow-auto" aria-label="Текст ресурса">
                      {activeResource.text}
                    </pre>
                  )}
                </div>
              ))}
            </Section>

             <Section title="Новая версия">
              {routeType === 'Prompt' ? (
                <div className="form-control gap-2">
                  <label className="label">
                    <span className="label-text">Заголовок</span>
                  </label>
                  <input
                    className="input input-bordered"
                    value={formPrompt.title ?? ''}
                    onChange={(e) => setFormPrompt((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Краткое название версии"
                  />
                  <label className="label">
                    <span className="label-text">Сообщение</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered min-h-40"
                    value={formPrompt.messages[0]?.text ?? ''}
                    onChange={(e) => setFormPrompt((f) => ({ ...f, messages: [{ role: 'user', text: e.target.value }] }))}
                    placeholder="Текст сообщения"
                  />
                  {formError && <div className="alert alert-warning mt-2">{formError}</div>}
                  <div className="mt-2">
                    <button className="btn btn-primary" disabled={!canSubmit || submitting} onClick={onSubmit}>
                      Отправить на апрув
                    </button>
                  </div>
                </div>
              ) : (
                <div className="form-control gap-2">
                  <label className="label">
                    <span className="label-text">Заголовок</span>
                  </label>
                  <input
                    className="input input-bordered"
                    value={formResource.title ?? ''}
                    onChange={(e) => setFormResource((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Краткое название версии"
                  />
                  <label className="label">
                    <span className="label-text">URI</span>
                  </label>
                  <input
                    className="input input-bordered"
                    value={formResource.uri}
                    onChange={(e) => setFormResource((f) => ({ ...f, uri: e.target.value }))}
                    placeholder="Например: s3://bucket/key"
                  />
                  <label className="label">
                    <span className="label-text">Текст</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered min-h-40"
                    value={formResource.text ?? ''}
                    onChange={(e) => setFormResource((f) => ({ ...f, text: e.target.value }))}
                    placeholder="Опционально: текстовый payload"
                  />
                  {formError && <div className="alert alert-warning mt-2">{formError}</div>}
                  <div className="mt-2">
                    <button className="btn btn-primary" disabled={!canSubmit || submitting} onClick={onSubmit}>
                      Отправить на апрув
                    </button>
                  </div>
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-4">
             <Section title="История версий">
              {history.length === 0 ? (
                <div className="text-sm opacity-70">История пуста</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Версия</th>
                        <th>Статус</th>
                        <th>Автор</th>
                        <th>Создано</th>
                        <th>Апрувер</th>
                        <th>Апрув</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((v) => (
                        <tr key={`${(v as any).name}-${v.version}`}>
                          <td>v{v.version}</td>
                          <td>
                            <span className={`badge badge-sm ${v.status === 'Approved' ? 'badge-success' : ''}`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="text-xs">{v.createdBy}</td>
                          <td className="text-xs">{new Date(v.createdAt).toLocaleString()}</td>
                          <td className="text-xs">{v.approvedBy ?? '—'}</td>
                          <td className="text-xs">{v.approvedAt ? new Date(v.approvedAt).toLocaleString() : '—'}</td>
                          <td className="text-right">
                            {info?.isAdmin && v.status === 'Pending' && (
                              <button className="btn btn-xs" onClick={() => onApprove(v.version)}>Апрув</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast toast-end">
          <div className="alert alert-info" role="status">
            <span>{toast}</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setToast(null)} aria-label="Закрыть">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


