import type {
  UserInfo,
  PromptRecord,
  ResourceRecord,
  NewPromptVersionDto,
  NewResourceVersionDto,
} from '@/types'
import { toSnakeCaseDeep, toCamelCaseDeep } from './case'

const RUNTIME_BASE = typeof window !== 'undefined' ? window?.env?.API_URL : undefined
const API_BASE = (RUNTIME_BASE && RUNTIME_BASE.trim() !== '')
  ? RUNTIME_BASE
  : (import.meta.env.VITE_API_BASE as string | undefined)
// Не шумим в dev: при пустом BASE используем прокси Vite
if (!API_BASE && import.meta.env.PROD) {
  console.warn('VITE_API_BASE/UI_API_URL не задан. В production это может привести к ошибкам API.')
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = API_BASE ?? ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  // transform outgoing JSON body to snake_case
  let transformedInit: RequestInit | undefined = init
  if (init?.body !== undefined) {
    try {
      const originalBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body
      const snake = toSnakeCaseDeep(originalBody)
      transformedInit = { ...init, body: JSON.stringify(snake) }
    } catch {
      // if body is not JSON, keep as-is
      transformedInit = init
    }
  }

  const res = await fetch(`${base}${normalizedPath}`, {
    ...transformedInit,
    headers: { 'content-type': 'application/json', ...(transformedInit?.headers as Record<string, string>) },
  })
  if (!res.ok) {
    let error: unknown
    try {
      const errData = await res.json()
      error = toCamelCaseDeep(errData)
    } catch {
      error = await res.text()
    }
    throw { status: res.status, error }
  }
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    return undefined as T
  }
  const data = await res.json()
  return toCamelCaseDeep(data) as T
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

  setPromptStatus: (key: string, version: number, status: number) =>
    http<void>(
      `v1/prompts/${encodeURIComponent(key)}/versions/${version}/status`,
      { method: 'POST', body: JSON.stringify({ status }) },
    ),

  setResourceStatus: (key: string, version: number, status: number) =>
    http<void>(
      `v1/resources/${encodeURIComponent(key)}/versions/${version}/status`,
        { method: 'POST', body: JSON.stringify({ status }) },
      ),
  
  deletePromptVersion: (key: string, version: number) =>
    http<void>(
      `v1/prompts/${encodeURIComponent(key)}/versions/${version}`,
      { method: 'DELETE' },
    ),

  deleteResourceVersion: (key: string, version: number) =>
    http<void>(
      `v1/resources/${encodeURIComponent(key)}/versions/${version}`,
      { method: 'DELETE' },
    ),
}