import type { Artifact, ArtifactType, ArtifactVersion, NewVersionDto, UserInfo } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE as string | undefined
// Не шумим в dev: при пустом BASE используем прокси Vite
if (!API_BASE && import.meta.env.PROD) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_BASE не задан. В production это может привести к ошибкам API.')
}

type PrimitivePath = 'prompt' | 'prompts' | 'resource' | 'resources'

function primitivePath(type: ArtifactType): PrimitivePath {
  return type === 'Prompt' ? 'prompts' : 'resources'
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = API_BASE ?? ''
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers as Record<string, string>) },
  })
  if (!res.ok) {
    let error: unknown
    try {
      error = await res.json()
    } catch {
      error = await res.text()
    }
    throw { status: res.status, error }
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? ((await res.json()) as T) : (undefined as T)
}

export const api = {
  user: () => http<UserInfo>('v1/user'),

  list: (type: ArtifactType, q?: string) =>
    http<Artifact[]>(`v1/${primitivePath(type)}${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  active: (type: ArtifactType, key: string) =>
    http<ArtifactVersion | null>(`v1/${primitivePath(type)}/${encodeURIComponent(key)}`),

  history: (type: ArtifactType, key: string) =>
    http<ArtifactVersion[]>(`v1/${primitivePath(type)}/${encodeURIComponent(key)}/versions`),

  createVersion: (type: ArtifactType, key: string, payload: NewVersionDto) =>
    http<{ version: number; status: string }>(
      `v1/${primitivePath(type)}/${encodeURIComponent(key)}/versions`,
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  approve: (type: ArtifactType, key: string, version: number) =>
    http<void>(
      `v1/${primitivePath(type)}/${encodeURIComponent(key)}/versions/${version}/approve`,
      { method: 'POST' },
    ),
}

export function parseTypeFromPath(segment: string): ArtifactType {
  const s = segment.toLowerCase()
  if (s === 'prompt' || s === 'prompts') return 'Prompt'
  if (s === 'resource' || s === 'resources') return 'Resource'
  throw new Error('BAD_TYPE')
}

export function extractPlaceholdersFromTemplate(template: string): string[] {
  const regex = /{{\s*([A-Za-z0-9_]+)\s*}}/g
  const found = new Set<string>()
  let match: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(template))) {
    found.add(match[1])
  }
  return Array.from(found.values())
}


