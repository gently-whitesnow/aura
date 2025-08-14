import type {
  ArtifactType,
  UserInfo,
  PromptRecord,
  ResourceRecord,
  NewPromptVersionDto,
  NewResourceVersionDto,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE as string | undefined
// Не шумим в dev: при пустом BASE используем прокси Vite
if (!API_BASE && import.meta.env.PROD) {
  console.warn('VITE_API_BASE не задан. В production это может привести к ошибкам API.')
}

type PrimitivePath = 'prompt' | 'prompts' | 'resource' | 'resources'

function primitivePath(type: ArtifactType): PrimitivePath {
  return type === 'Prompt' ? 'prompts' : 'resources'
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = API_BASE ?? ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const res = await fetch(`${base}${normalizedPath}`, {
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

  listPrompts: (q?: string) => http<PromptRecord[]>(`v1/prompts${q ? `?query=${encodeURIComponent(q)}` : ''}`),
  listResources: (q?: string) => http<ResourceRecord[]>(`v1/resources${q ? `?query=${encodeURIComponent(q)}` : ''}`),

  promptActive: (key: string) => http<PromptRecord | null>(`v1/prompts/${encodeURIComponent(key)}`),
  resourceActive: (key: string) => http<ResourceRecord | null>(`v1/resources/${encodeURIComponent(key)}`),

  promptHistory: (key: string) => http<PromptRecord[]>(`v1/prompts/${encodeURIComponent(key)}/versions`),
  resourceHistory: (key: string) => http<ResourceRecord[]>(`v1/resources/${encodeURIComponent(key)}/versions`),

  createPromptVersion: (key: string, payload: NewPromptVersionDto) =>
    http<{ version: number; status: string }>(`v1/prompts/${encodeURIComponent(key)}/versions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createResourceVersion: (key: string, payload: NewResourceVersionDto) =>
    http<{ version: number; status: string }>(`v1/resources/${encodeURIComponent(key)}/versions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

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

// no-op helpers kept for compatibility if needed later


