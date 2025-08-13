export type ArtifactType = 'Prompt' | 'Resource'

export type VersionStatus = 'Pending' | 'Approved' | 0 | 1

export type Artifact = {
  type: ArtifactType
  key: string
  title: string
  activeVersion?: number | null
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type ArtifactVersion = {
  type: ArtifactType | 0 | 1
  artifactKey: string
  version: number
  status: VersionStatus
  title: string
  body?: string | null
  template?: string | null
  placeholders?: string[] | null
  createdAt: string
  createdBy: string
  approvedAt?: string | null
  approvedBy?: string | null
}

export type UserInfo = {
  login: string | null
  isAdmin: boolean
}

export type NewVersionDto = {
  title: string
  body?: string | undefined
  template?: string | undefined
  placeholders?: string[] | undefined
}


