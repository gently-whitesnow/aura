import { useEffect, useState } from 'react'

type State<T> = {
  data: T[] | null
  loading: boolean
  error: string | null
}

/**
 * Универсальный хук загрузки массивов с поддержкой отмены.
 * Передай loader без аргументов, он может замыкать любые параметры (например, query).
 */
export function useAsyncList<T>(loader: () => Promise<T[]>): State<T> {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    loader()
      .then((res) => {
        if (mounted) setData(res)
      })
      .catch((err) => {
        // Пропускаем AbortError, остальное показываем как пользовательскую ошибку
        if (mounted && err?.name !== 'AbortError') {
          setError('Ошибка загрузки списка')
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
      controller.abort()
    }
  }, [loader])

  return { data, loading, error }
}