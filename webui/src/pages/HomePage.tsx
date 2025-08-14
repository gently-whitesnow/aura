import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { PromptRecord, ResourceRecord } from '../types'
import { Boxes, SquarePen } from 'lucide-react'
import CreatePromptModal from '../components/CreatePromptModal'
import CreateResourceModal from '../components/CreateResourceModal'

export default function HomePage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const [prompts, setPrompts] = useState<PromptRecord[] | null>(null)
  const [resources, setResources] = useState<ResourceRecord[] | null>(null)

  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [loadingResources, setLoadingResources] = useState(false)

  const [errorPrompts, setErrorPrompts] = useState<string | null>(null)
  const [errorResources, setErrorResources] = useState<string | null>(null)

  const [showCreatePrompt, setShowCreatePrompt] = useState(false)
  const [showCreateResource, setShowCreateResource] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingPrompts(true)
    setErrorPrompts(null)
    api
      .listPrompts(q || undefined)
      .then((res) => !cancelled && setPrompts(res))
      .catch(() => !cancelled && setErrorPrompts('Ошибка загрузки списка'))
      .finally(() => !cancelled && setLoadingPrompts(false))
    return () => {
      cancelled = true
    }
  }, [q])

  useEffect(() => {
    let cancelled = false
    setLoadingResources(true)
    setErrorResources(null)
    api
      .listResources(q || undefined)
      .then((res) => !cancelled && setResources(res))
      .catch(() => !cancelled && setErrorResources('Ошибка загрузки списка'))
      .finally(() => !cancelled && setLoadingResources(false))
    return () => {
      cancelled = true
    }
  }, [q])

  const promptItems = useMemo(() => prompts ?? [], [prompts])
  const resourceItems = useMemo(() => resources ?? [], [resources])

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="input input-bordered flex items-center gap-2 max-w-2xl w-full">
          <span className="opacity-60">Поиск</span>
          <input
            aria-label="Поиск по названию или ключу"
            className="grow"
            placeholder="Сразу по промптам и ресурсам…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium flex-1">Промпты</h2>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowCreatePrompt(true)}>Добавить</button>
          </div>
          {loadingPrompts && <div className="loading loading-dots" aria-live="polite" />}
          {errorPrompts && <div className="alert alert-error">{errorPrompts}</div>}
          {!loadingPrompts && promptItems.length === 0 && (
            <div className="text-sm opacity-70">Ничего не найдено</div>
          )}
          <ul className="grid grid-cols-1 gap-3">
            {promptItems.map((a) => (
              <li key={`p-${a.name}`}>
                <Link
                  to={`/prompts/${encodeURIComponent(a.name)}`}
                  className="card bg-base-100 hover:shadow-md focus:shadow-md focus:outline-none"
                >
                  <div className="card-body p-4">
                    <div className="flex items-center gap-2">
                      <SquarePen className="w-5 h-5" aria-hidden />
                      <h3 className="card-title text-base flex-1 truncate" title={a.title ?? ''}>
                        {a.title}
                      </h3>
                      {a.version != null && (
                        <span className="badge badge-sm" aria-label={`Активная версия ${a.version}`}>
                          v{a.version}
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-70 truncate" title={a.name}>
                      {a.name}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium flex-1">Ресурсы</h2>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowCreateResource(true)}>Добавить</button>
          </div>
          {loadingResources && <div className="loading loading-dots" aria-live="polite" />}
          {errorResources && <div className="alert alert-error">{errorResources}</div>}
          {!loadingResources && resourceItems.length === 0 && (
            <div className="text-sm opacity-70">Ничего не найдено</div>
          )}
          <ul className="grid grid-cols-1 gap-3">
            {resourceItems.map((a) => (
              <li key={`r-${a.name}`}>
                <Link
                  to={`/resources/${encodeURIComponent(a.name)}`}
                  className="card bg-base-100 hover:shadow-md focus:shadow-md focus:outline-none"
                >
                  <div className="card-body p-4">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-5 h-5" aria-hidden />
                      <h3 className="card-title text-base flex-1 truncate" title={a.title ?? ''}>
                        {a.title}
                      </h3>
                      {a.version != null && (
                        <span className="badge badge-sm" aria-label={`Активная версия ${a.version}`}>
                          v{a.version}
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-70 truncate" title={a.name}>
                      {a.name}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {showCreatePrompt && (
        <CreatePromptModal
          onClose={() => setShowCreatePrompt(false)}
          onSubmit={async (key, title, body) => {
            const res = await api.createPromptVersion(key, { title, messages: [{ role: 'user', text: body }], arguments: [] })
            if (!res || typeof res.version !== 'number') throw new Error('CREATE_FAILED')
            setShowCreatePrompt(false)
            navigate(`/prompts/${encodeURIComponent(key)}`)
          }}
        />
      )}

      {showCreateResource && (
        <CreateResourceModal
          onClose={() => setShowCreateResource(false)}
          onSubmit={async (key, payload) => {
            const res = await api.createResourceVersion(key, payload)
            if (!res || typeof res.version !== 'number') throw new Error('CREATE_FAILED')
            setShowCreateResource(false)
            navigate(`/resources/${encodeURIComponent(key)}`)
          }}
        />
      )}
    </section>
  )
}


