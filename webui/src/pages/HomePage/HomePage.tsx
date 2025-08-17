import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import type { PromptRecord, ResourceRecord, NewPromptVersionDto, NewResourceVersionDto } from '@/types'
import CreatePromptModal from '@/components/CreatePromptModal/CreatePromptModal'
import CreateResourceModal from '@/components/CreateResourceModal'
import { SearchBar } from './Components/SearchBar'
import { EntitySection } from './Components/EntitySection'
import { PromptCard } from './Components/Cards/PromptCard'
import { ResourceCard } from './Components/Cards/ResourceCard'
import { useAsyncList } from '@/hooks/useAsyncList'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export default function HomePage() {
  const navigate = useNavigate()

  // Поиск с небольшим дебаунсом, чтобы не спамить API
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 250)

  // Лоадеры завязаны на debouncedQ и мемоизированы
  const loadPrompts = useCallback(
    () => api.listPrompts(debouncedQ || undefined),
    [debouncedQ]
  )
  const loadResources = useCallback(
    () => api.listResources(debouncedQ || undefined),
    [debouncedQ]
  )

  const {
    data: prompts,
    loading: loadingPrompts,
    error: errorPrompts
  } = useAsyncList<PromptRecord>(loadPrompts)

  const {
    data: resources,
    loading: loadingResources,
    error: errorResources
  } = useAsyncList<ResourceRecord>(loadResources)

  const promptItems = useMemo(() => prompts ?? [], [prompts])
  const resourceItems = useMemo(() => resources ?? [], [resources])

  const [showCreatePrompt, setShowCreatePrompt] = useState(false)
  const [showCreateResource, setShowCreateResource] = useState(false)

  return (
    <section className="container mx-auto px-4 lg:px-8 space-y-10 mt-10">
      {/* Поиск */}
      <div className="sticky top-4 z-10">
        <div className="grid grid-cols-[1fr_minmax(20rem,48rem)_1fr] items-center">
          <h3 className="justify-self-start text-3xl text-primary">OpenMCP</h3>

          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Поиск по заголовкам"
            className="justify-self-center w-full max-w-md"
          />

          <div /> {/* симметрия справа */}
        </div>
      </div>

      {/* Две секции: Промпты / Ресурсы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EntitySection
          title="Промпты"
          loading={loadingPrompts}
          error={errorPrompts}
          isEmpty={!loadingPrompts && promptItems.length === 0}
          onAdd={() => setShowCreatePrompt(true)}
        >
          <ul className="grid grid-cols-1 gap-3">
            {promptItems.map((a: PromptRecord) => (
              <li key={`p-${a.name}`}>
                <PromptCard record={a} />
              </li>
            ))}
          </ul>
        </EntitySection>

        <EntitySection
          title="Ресурсы"
          loading={loadingResources}
          error={errorResources}
          isEmpty={!loadingResources && resourceItems.length === 0}
          onAdd={() => setShowCreateResource(true)}
        >
          <ul className="grid grid-cols-1 gap-3">
            {resourceItems.map((a: ResourceRecord) => (
              <li key={`r-${a.name}`}>
                <ResourceCard record={a} />
              </li>
            ))}
          </ul>
        </EntitySection>
      </div>

      {/* Модалки создания */}
      {showCreatePrompt && (
        <CreatePromptModal
          onClose={() => setShowCreatePrompt(false)}
          onSubmit={async (key: string, payload: NewPromptVersionDto) => {
            const res = await api.createPromptVersion(key, payload)
            if (!res || typeof res.version !== 'number') throw new Error('CREATE_FAILED')
            setShowCreatePrompt(false)
            navigate(`/prompts/${encodeURIComponent(key)}`)
          }}
        />
      )}

      {showCreateResource && (
        <CreateResourceModal
          onClose={() => setShowCreateResource(false)}
          onSubmit={async (key: string, payload: NewResourceVersionDto) => {
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