import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, extractPlaceholdersFromTemplate, parseTypeFromPath } from '../lib/api'
import type { ArtifactType, ArtifactVersion, NewVersionDto } from '../types'
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

export default function ArtifactDetailsPage() {
  const params = useParams()
  const urlType = params.type as string | undefined
  const routeType: ArtifactType = useMemo(() => {
    if (urlType) return parseTypeFromPath(urlType)
    // fallback: check from known static routes by parent path
    const p = location.pathname.split('/')[1]
    return parseTypeFromPath(p)
  }, [urlType])
  const key = params.key as string
  const { info } = useUser()

  const [active, setActive] = useState<ArtifactVersion | null>(null)
  const [history, setHistory] = useState<ArtifactVersion[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [form, setForm] = useState<NewVersionDto>({ title: '', body: '', template: '', placeholders: [] })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr(null)
    Promise.all([api.active(routeType, key), api.history(routeType, key)])
      .then(([a, h]) => {
        if (cancelled) return
        setActive(a)
        setHistory(h)
      })
      .catch(() => !cancelled && setErr('Ошибка загрузки'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [routeType, key])

  // validate form for Resource
  useEffect(() => {
    if (routeType === 'Resource') {
      const fromTemplate = extractPlaceholdersFromTemplate(form.template || '')
      const fromInputs = new Set((form.placeholders ?? []).filter(Boolean))
      const sameSize = fromTemplate.length === fromInputs.size
      const equal = sameSize && fromTemplate.every((p) => fromInputs.has(p))
      if (!equal) setFormError('Плейсхолдеры не совпадают с шаблоном')
      else setFormError(null)
    } else {
      setFormError(null)
    }
  }, [routeType, form.template, form.placeholders])

  const canSubmit = useMemo(() => {
    if (!form.title || form.title.length < 1 || form.title.length > 200) return false
    if (routeType === 'Prompt') return Boolean(form.body && form.body.length > 0)
    return Boolean(form.template && !formError)
  }, [form, formError, routeType])

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      await api.createVersion(routeType, key, {
        title: form.title,
        body: routeType === 'Prompt' ? form.body : undefined,
        template: routeType === 'Resource' ? form.template : undefined,
        placeholders: routeType === 'Resource' ? form.placeholders : undefined,
      })
      setToast('Версия отправлена на апрув')
      const h = await api.history(routeType, key)
      setHistory(h)
    } catch (e: any) {
      const code = e?.error?.error ?? 'Ошибка'
      setToast(typeof code === 'string' ? code : 'Ошибка сохранения')
    } finally {
      setSubmitting(false)
    }
  }

  const onApprove = async (v: number) => {
    try {
      await api.approve(routeType, key, v)
      const [a, h] = await Promise.all([api.active(routeType, key), api.history(routeType, key)])
      setActive(a)
      setHistory(h)
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
              {!active ? (
                <div className="text-sm opacity-70">Артефакт не содержит активной версии</div>
              ) : (
                <div className="space-y-2">
                  <div className="font-medium">{active.title}</div>
                  {routeType === 'Prompt' ? (
                    <pre className="p-3 bg-base-200 rounded text-sm overflow-auto" aria-label="Текст промпта">
                      {active.body}
                    </pre>
                  ) : (
                    <div className="space-y-2">
                      <pre className="p-3 bg-base-200 rounded text-sm overflow-auto" aria-label="Шаблон ресурса">
                        {active.template}
                      </pre>
                      <div className="text-sm opacity-70">
                        Плейсхолдеры: {(active.placeholders ?? []).join(', ') || '—'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            <Section title="Новая версия">
              <div className="form-control gap-2">
                <label className="label">
                  <span className="label-text">Заголовок</span>
                </label>
                <input
                  className="input input-bordered"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Краткое название версии"
                />
                {routeType === 'Prompt' ? (
                  <>
                    <label className="label">
                      <span className="label-text">Тело (markdown)</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered min-h-40"
                      value={form.body}
                      onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                      placeholder="Текст промпта"
                    />
                  </>
                ) : (
                  <>
                    <label className="label">
                      <span className="label-text">Шаблон</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered min-h-40"
                      value={form.template}
                      onChange={(e) => {
                        const template = e.target.value
                        const phs = extractPlaceholdersFromTemplate(template)
                        setForm((f) => ({ ...f, template, placeholders: phs }))
                      }}
                      placeholder="Пример: Hello {{NAME}}"
                    />
                    <label className="label">
                      <span className="label-text">Плейсхолдеры</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(form.placeholders ?? []).map((p, idx) => (
                        <span key={p + idx} className="badge badge-outline">
                          {p}
                        </span>
                      ))}
                      {(form.placeholders ?? []).length === 0 && (
                        <span className="text-sm opacity-60">Нет плейсхолдеров</span>
                      )}
                    </div>
                  </>
                )}
                {formError && <div className="alert alert-warning mt-2">{formError}</div>}
                <div className="mt-2">
                  <button className="btn btn-primary" disabled={!canSubmit || submitting} onClick={onSubmit}>
                    Отправить на апрув
                  </button>
                </div>
              </div>
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="История версий">
              {!history || history.length === 0 ? (
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
                        <tr key={`${v.type}-${v.artifactKey}-${v.version}`}>
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


