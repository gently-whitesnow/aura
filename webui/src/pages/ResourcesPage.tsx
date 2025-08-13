import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { Artifact } from '../types'
import { Link, useNavigate } from 'react-router-dom'
import { Boxes, Plus } from 'lucide-react'
import { useUser } from '../store/user'
import CreateArtifactModal from '../components/CreateArtifactModal'

export default function ResourcesPage() {
  const navigate = useNavigate()
  useUser() // keep subscribed for future admin-only features
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Artifact[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .list('Resource', q || undefined)
      .then((res) => !cancelled && setList(res))
      .catch(() => !cancelled && setError('Ошибка загрузки списка'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [q])

  const items = useMemo(() => list ?? [], [list])

  return (
    <section aria-label="Список ресурсов" className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="input input-bordered flex items-center gap-2 max-w-xl">
          <span className="opacity-60">Поиск</span>
          <input
            aria-label="Поиск по названию или ключу"
            className="grow"
            placeholder="Начните вводить…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Создать
        </button>
      </div>

      {loading && <div className="loading loading-dots loading-lg" aria-live="polite" />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="text-sm opacity-70">Ничего не найдено</div>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((a) => (
          <li key={a.key}>
            <Link
              to={`/resources/${encodeURIComponent(a.key)}`}
              className="card bg-base-100 hover:shadow-md focus:shadow-md focus:outline-none"
            >
              <div className="card-body p-4">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5" aria-hidden />
                  <h3 className="card-title text-base flex-1 truncate" title={a.title}>{a.title}</h3>
                  {a.activeVersion != null && (
                    <span className="badge badge-sm" aria-label={`Активная версия ${a.activeVersion}`}>
                      v{a.activeVersion}
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-70 truncate" title={a.key}>{a.key}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {showCreate && (
        <CreateArtifactModal
          type="Resource"
          onClose={() => setShowCreate(false)}
          onSubmit={async (key, payload) => {
            await api.createVersion('Resource', key, payload)
            navigate(`/resources/${encodeURIComponent(key)}`)
          }}
        />
      )}
    </section>
  )
}


