import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { parseTypeFromPath } from '../lib/api'
import type { ArtifactType } from '../types'
import { PromptDetailsView } from '../components/PromptDetailsView'
import { ResourceDetailsView } from '../components/ResourceDetailsView'

export default function PrimitivePage() {
  const params = useParams()
  const urlType = params.type as string | undefined
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
        ? <PromptDetailsView keyName={keyName} />
        : <ResourceDetailsView keyName={keyName} />
      }
    </div>
  )
}