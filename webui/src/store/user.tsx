import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { UserInfo } from '../types'

type UserContextValue = {
  info: UserInfo | null
  loading: boolean
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const load = () => {
    let cancelled = false
    setLoading(true)
    api
      .user()
      .then((u) => {
        if (!cancelled) setInfo(u)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }

  useEffect(() => load(), [])

  const value = useMemo(() => ({ info, loading }), [info, loading])
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}


