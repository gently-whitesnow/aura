export type ArtifactType = 'Prompt' | 'Resource'

export const VersionStatus = {
  Pending: 0,
  Approved: 1,
  Declined: 2,
};

export type PromptTextContentBlock = { type: 'text'; text: string }
export type PromptResourceLinkBlock = { type: 'resource_link'; internalName: string }
export type PromptContentBlock = PromptTextContentBlock | PromptResourceLinkBlock
export type PromptMessage = { role: 'user' | 'assistant'; content: PromptContentBlock }
export type PromptArgument = { name: string; title?: string | null; description?: string | null; required?: boolean }

export type PromptRecord = {
  name: string
  version: number
  status: number
  title?: string | null
  messages: PromptMessage[]
  arguments?: PromptArgument[] | null
  createdAt: string
  createdBy: string
  updatedAt?: string | null
  updatedBy?: string | null
}

export type ResourceAnnotations = { audience?: string[] | null; priority?: number | null; lastModified?: string | null }

export type ResourceRecord = {
  name: string
  version: number
  status: number
  title?: string | null
  uri: string
  text?: string | null
  description?: string | null
  mimeType?: string | null
  annotations?: ResourceAnnotations | null
  size?: number | null
  createdAt: string
  createdBy: string
  updatedAt?: string | null
  updatedBy?: string | null
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
  title: string
  text?: string
  description?: string
  annotations?: ResourceAnnotations
}