import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import type { ArtifactType } from '../../types'
import { PromptView } from './components/PromptView'
import { ResourceView } from './components/ResourceView'

export default function PrimitivePage() {
  const params = useParams()
  const urlType = params.type as string | undefined

  const parseTypeFromPath = (segment: string): ArtifactType => {
    const s = segment.toLowerCase()
    if (s === 'prompt' || s === 'prompts') return 'Prompt'
    if (s === 'resource' || s === 'resources') return 'Resource'
    throw new Error('BAD_TYPE')
  }

  const routeType: ArtifactType = useMemo(() => {
    if (urlType) return parseTypeFromPath(urlType)
    const p = location.pathname.split('/')[1]
    return parseTypeFromPath(p)
  }, [urlType])
  const keyName = params.key as string

  return (
    <div className="space-y-4">
      <nav className="text-sm breadcrumbs">
        <ul>
          <li><Link to="/">Главная</Link></li>
          <li className="truncate">{keyName}</li>
        </ul>
      </nav>

      {routeType === 'Prompt'
        ? <PromptView keyName={keyName} />
        : <ResourceView keyName={keyName} />
      }
    </div>
  )
}