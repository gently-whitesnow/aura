import { useMemo, useState, useCallback, useEffect } from 'react'
import type { NewPromptVersionDto, PromptMessage } from '@/types'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { isValidKey } from '@/lib/validation'
import { KEY_HINT } from '@/lib/constants'
import AutoResizeTextarea from '../AutoResizeTextarea'
import { ResourceSelector } from './components/ResourceSelector'

type Props = {
  onSubmit: (key: string, payload: NewPromptVersionDto) => Promise<void>
  onClose: () => void
  initialKey?: string
  initialValues?: NewPromptVersionDto
  lockKey?: boolean
}

type UiMessage = { role: 'user' | 'assistant'; text?: string; resourceName?: string }
type UiArgument = { name: string; title?: string | null; description?: string | null; required?: boolean }

// Имя ключа нормализуем как раньше
function normalizeKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/\/{2,}/g, '/')
}

// Валидные плейсхолдеры {{name}} — буква/_, затем буквы/цифры/_ . / -
const PLACEHOLDER_VALID_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_./-]*)\s*\}\}/g
// Любые {{...}} (чтобы находить и некорректные тоже)
const PLACEHOLDER_ANY_RE = /\{\{\s*([^}]*)\s*\}\}/g

type ArgMeta = { title?: string; description?: string; required?: boolean }

export default function CreatePromptModal({ onSubmit, onClose, initialKey, initialValues, lockKey }: Props) {
  const [key, setKey] = useState(initialKey ?? '')
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [messages, setMessages] = useState<UiMessage[]>(() => {
    if (initialValues?.messages?.length) {
      return (initialValues.messages as PromptMessage[]).map(m => {
        if (m.role === 'user' && m.content?.type === 'text') return { role: 'user', text: m.content.text }
        if (m.role === 'assistant' && m.content?.type === 'resource_link') return { role: 'assistant', resourceName: m.content.internalName }
        return { role: m.role as UiMessage['role'], text: '' }
      })
    }
    return [{ role: 'user', text: '' }]
  })

  // Метаданные аргументов (name -> meta). Инициализируем из initialValues?.arguments
  const [argsMeta, setArgsMeta] = useState<Record<string, ArgMeta>>(() => {
    const meta: Record<string, ArgMeta> = {}
    for (const a of (initialValues?.arguments ?? []) as UiArgument[]) {
      meta[a.name] = {
        title: a.title ?? '',
        description: a.description ?? '',
        required: a.required ?? false,
      }
    }
    return meta
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Подготовленные сообщения
  const preparedMessages: PromptMessage[] = useMemo(() => {
    const result: PromptMessage[] = []
    for (const m of messages) {
      if (m.role === 'user') {
        const text = (m.text ?? '').trim()
        if (text.length === 0) continue
        result.push({ role: 'user', content: { type: 'text', text } })
      } else {
        const name = (m.resourceName ?? '').trim()
        if (name.length === 0) continue
        result.push({ role: 'assistant', content: { type: 'resource_link', internalName: name } })
      }
    }
    return result
  }, [messages])

  // Скан аргументов:
  // 1) все уникальные {{placeholders}} по порядку первого вхождения
  // 2) для user-сообщений без плейсхолдеров — синтетические user_{index+1}
  const computedArgNames = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []

    messages.forEach((m) => {
      const inText: string[] = []
      let match: RegExpExecArray | null

      // поддерживаем плейсхолдеры только в user-тексте
      if (m.role !== 'user') return
      const text = m.text ?? ''
      while ((match = PLACEHOLDER_VALID_RE.exec(text)) !== null) {
        inText.push(match[1])
      }
      // сброс lastIndex на всякий
      PLACEHOLDER_VALID_RE.lastIndex = 0

      // добавляем валидные плейсхолдеры
      inText.forEach(n => {
        if (!seen.has(n)) {
          seen.add(n)
          ordered.push(n)
        }
      })
    })

    return ordered
  }, [messages])

  // Вычисляем список любых {{...}} и определяем некорректные плейсхолдеры
  const invalidPlaceholders = useMemo(() => {
    const invalid: string[] = []
    messages.forEach(m => {
      if (m.role !== 'user') return
      const t = m.text ?? ''
      const any = [...t.matchAll(PLACEHOLDER_ANY_RE)].map(x => (x[1] ?? '').trim())
      const valid = new Set<string>([...t.matchAll(PLACEHOLDER_VALID_RE)].map(x => x[1]))
      any.forEach(raw => {
        if (!valid.has(raw) && raw.length > 0) invalid.push(raw)
      })
    })
    return invalid
  }, [messages])

  // Синхронизируем argsMeta с текущим набором имён (сохраняем существующее, удаляем исчезнувшее)
  useEffect(() => {
    setArgsMeta(prev => {
      const next: Record<string, ArgMeta> = {}
      for (const name of computedArgNames) next[name] = prev[name] ?? {}
      return next
    })
  }, [computedArgNames])

  // Готовим аргументы к отправке (имя + мета)
  const preparedArgs: UiArgument[] = useMemo(
    () =>
      computedArgNames.map(name => {
        const rawTitle = argsMeta[name]?.title?.trim() ?? ''
        const rawDesc = argsMeta[name]?.description?.trim() ?? ''
        const title: string | null = rawTitle.length > 0 ? rawTitle : null
        const description: string | null = rawDesc.length > 0 ? rawDesc : null
        const required = argsMeta[name]?.required
        return {
          name,
          title,
          description,
          ...(required !== undefined ? { required } : {}),
        }
      }),
    [computedArgNames, argsMeta]
  )

  const hasEmptyUser = messages.some(m => m.role === 'user' && ((m.text ?? '').trim().length === 0))
  const hasEmptyAssistant = messages.some(m => m.role === 'assistant' && ((m.resourceName ?? '').trim().length === 0))
  const valid =
    isValidKey(normalizeKey(key)) &&
    preparedMessages.length > 0 &&
    preparedMessages.every(m => m.role === 'user' || m.role === 'assistant') &&
    invalidPlaceholders.length === 0 &&
    title.trim().length > 0 &&
    !hasEmptyUser && !hasEmptyAssistant

  const addMessage = () => setMessages(prev => [...prev, { role: 'user', text: '' }])
  const removeMessage = (idx: number) => setMessages(prev => prev.filter((_, i) => i !== idx))
  const moveMessage = (idx: number, dir: -1 | 1) =>
    setMessages(prev => {
      const next = [...prev]
      const j = idx + dir
      if (j < 0 || j >= next.length) return prev
        ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })

  const submit = useCallback(async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const keyNorm = normalizeKey(key)
      const payload: NewPromptVersionDto = {
        title: title.trim(),
        messages: preparedMessages.length ? preparedMessages : [],
        arguments: preparedArgs.length ? preparedArgs : [],
      }
      await onSubmit(keyNorm, payload)
    } catch (e) {
      setError('Ошибка создания')
    } finally {
      setLoading(false)
    }
  }, [key, title, preparedMessages, preparedArgs, onSubmit, valid])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <dialog open className="modal" onKeyDown={onKeyDown}>
      <div className="modal-box max-w-4xl">
        <h3 className="font-bold text-lg">
          {lockKey ? 'Новая версия промпта' : 'Создание промпта'}
        </h3>
        <div className="py-3 space-y-4">
          {/* Ключ и заголовок */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label">
                <span className="label-text text-base font-semibold">Ключ *</span>
                <span className="label-text-alt opacity-60">{KEY_HINT}</span>
              </span>
              <input
                className="input input-bordered"
                placeholder="csharp-unit-tests"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onBlur={() => setKey(k => normalizeKey(k))}
                readOnly={!!lockKey}
              />
              {!isValidKey(normalizeKey(key)) && !lockKey && (
                <span className="label-text-alt text-error mt-1">Неверный формат ключа</span>
              )}
            </label>

            <label className="form-control">
              <span className="label">
                <span className="label-text text-base font-semibold">Заголовок *</span>
                <span className="label-text-alt opacity-60">3–6 слов, суть промпта</span>
              </span>
              <input
                className="input input-bordered"
                placeholder="Генерация C# юнит-тестов"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {title.trim().length === 0 && (
                <span className="label-text-alt text-error mt-1">Обязательное поле</span>
              )}
            </label>
          </div>

          {/* Сообщения */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="font-medium text-base flex-1 text-base font-semibold">Сообщения *</h4>
            </div>

            <ul className="space-y-3">
              {messages.map((m, idx) => (
                <li key={idx} className="card border border-base-200">
                  <div className="card-body p-3 lg:p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        className="select select-bordered select-sm w-26"
                        value={m.role}
                        onChange={(e) =>
                          setMessages(prev => prev.map((x, i) => (i === idx
                            ? (e.target.value === 'user'
                                ? { role: 'user', text: '' }
                                : { role: 'assistant', resourceName: '' }
                              )
                            : x)))
                        }
                        aria-label="Роль"
                      >
                        <option value="user">запрос</option>
                        <option value="assistant">ресурс</option>
                      </select>

                      <div className="flex-1" />

                      <div className="join hidden lg:inline-flex">
                        <button
                          type="button"
                          className="btn btn-sm join-item"
                          onClick={() => moveMessage(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Вверх"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm join-item"
                          onClick={() => moveMessage(idx, +1)}
                          disabled={idx === messages.length - 1}
                          aria-label="Вниз"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-ghost text-error"
                        onClick={() => removeMessage(idx)}
                        aria-label="Удалить сообщение"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {m.role === 'user' ? (
                      <AutoResizeTextarea
                        className="textarea textarea-bordered w-full min-h-28 max-h-[70vh] font-mono"
                        placeholder={'Сгенерируй юнит-тесты на {{framework}} для класса: {{className}}. Требования к ответу: 1) # Summary — кратко опиши стратегию покрытия. 2) # Tests — список тестов. 3) # Coverage — покрытие. 4) # Code — код тестов.'}
                        value={m.text ?? ''}
                        onChange={(e) =>
                          setMessages(prev => prev.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))
                        }
                        minRows={8}
                        maxRows={40}
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                    ) : (
                      <ResourceSelector
                        value={m.resourceName ?? ''}
                        onChange={(val) => setMessages(prev => prev.map((x, i) => (i === idx ? { ...x, resourceName: val } : x)))}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="text-xs opacity-60">
              Пример аргумента запроса: <code>{'{{className}}'}</code>
            </div>

            <div className="flex justify-between">
              {messages.every(m => m.role === 'user' && (m.text ?? '').trim().length === 0) ? (
                <span className="label-text-alt text-error mt-1">Необходимо добавить хотя бы одно сообщение</span>
              ) : <span />}
              <button
                type="button"
                className="btn btn-sm btn-primary btn-outline"
                onClick={addMessage}
                disabled={messages.some(m => (m.role === 'user' && (m.text ?? '').trim().length === 0) || (m.role === 'assistant' && (m.resourceName ?? '').trim().length === 0))}
              >
                <Plus className="w-4 h-4" /> Добавить сообщение
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="font-medium text-base flex-1">Аргументы запроса (определяются автоматически)</h4>
            </div>

            <ul className="space-y-3">
              {computedArgNames.map((name) => {
                const meta = argsMeta[name] ?? {}
                return (
                  <li key={name} className="card border border-base-200">
                    <div className="card-body p-3 lg:p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 grid-rows-2 gap-3">
                        {/* Первая строка, первые 3 столбца: Аргумент */}
                        <label className="form-control lg:col-start-1 lg:col-span-3 lg:row-start-1">
                          <span className="label-text">Аргумент</span>
                          <input
                            className="input input-bordered"
                            value={name}
                            readOnly
                            disabled
                          />
                        </label>

                        {/* Четвертый столбец на обе строки: Обязательный */}
                        <label className="label cursor-pointer lg:col-start-4 lg:row-start-1 lg:row-span-2 flex flex-col items-center justify-center gap-2">
                          <span className="label-text">Обязательный</span>
                          <input
                            type="checkbox"
                            className="toggle"
                            checked={!!meta.required}
                            onChange={(e) =>
                              setArgsMeta(prev => ({ ...prev, [name]: { ...prev[name], required: e.target.checked } }))
                            }
                          />
                        </label>

                        {/* Вторая строка, первые 3 столбца: Заголовок */}
                        <label className="form-control lg:col-start-1 lg:col-span-3 lg:row-start-2">
                          <span className="label-text">Заголовок</span>
                          <input
                            className="input input-bordered"
                            placeholder="Например: название класса"
                            value={meta.title ?? ''}
                            onChange={(e) =>
                              setArgsMeta(prev => ({ ...prev, [name]: { ...prev[name], title: e.target.value } }))
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="btn btn-primary" disabled={!valid || loading} onClick={submit}>
            Создать
          </button>
        </div>
      </div>

      {/* клик по подложке закрывает */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button aria-label="Закрыть" />
      </form>
    </dialog>
  )
}