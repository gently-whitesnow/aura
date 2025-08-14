export type ArtifactType = 'Prompt' | 'Resource'

export type VersionStatus = 'Pending' | 'Approved' | 0 | 1

export type PromptMessage = { role: string; text: string }
export type PromptArgument = { name: string; title?: string | null; description?: string | null; required?: boolean }

export type PromptRecord = {
  name: string
  version: number
  status: VersionStatus
  title?: string | null
  messages: PromptMessage[]
  arguments?: PromptArgument[] | null
  createdAt: string
  createdBy: string
  approvedAt?: string | null
  approvedBy?: string | null
}

export type ResourceAnnotations = { audience?: string[] | null; priority?: number | null; lastModified?: string | null }

export type ResourceRecord = {
  name: string
  version: number
  status: VersionStatus
  title?: string | null
  uri: string
  text?: string | null
  description?: string | null
  mimeType?: string | null
  annotations?: ResourceAnnotations | null
  size?: number | null
  createdAt: string
  createdBy: string
  approvedAt?: string | null
  approvedBy?: string | null
}

export type UserInfo = {
  login: string | null
  isAdmin: boolean
}

export type NewPromptVersionDto = {
  title?: string
  messages: PromptMessage[]
  arguments?: PromptArgument[]
}

export type NewResourceVersionDto = {
  title?: string
  uri: string
  text?: string
  description?: string
  mimeType?: string
  annotations?: ResourceAnnotations
  size?: number
}


