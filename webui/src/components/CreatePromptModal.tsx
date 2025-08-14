import { useMemo, useState, useCallback } from 'react'
import type { NewPromptVersionDto } from '../types'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

type Props = {
  onSubmit: (key: string, payload: NewPromptVersionDto) => Promise<void>
  onClose: () => void
}

type UiMessage = { role: 'user' | 'assistant'; text: string }
type UiArgument = { name: string; title?: string; description?: string; required?: boolean }

const KEY_HINT = 'латиница, цифры, ".", "-", "_", "/", не короче 3 символов'

function normalizeKey(s: string) {
  // аккуратно нормализуем: трим, в нижний регистр, заменяем пробелы на "-", убираем лишние слэши
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/\/{2,}/g, '/')
}
function isValidKey(s: string) {
  return /^[a-z0-9._/\-]{3,}$/.test(s)
}

export default function CreatePromptModal({ onSubmit, onClose }: Props) {
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [messages, setMessages] = useState<UiMessage[]>([{ role: 'user', text: '' }])
  const [args, setArgs] = useState<UiArgument[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showMdHint, setShowMdHint] = useState(true)

  const preparedMessages = useMemo(
    () => messages.map(m => ({ role: m.role, text: m.text.trim() })).filter(m => m.text.length > 0),
    [messages]
  )
  const preparedArgs = useMemo(
    () =>
      args
        .map(a => ({
          name: a.name.trim(),
          title: a.title?.trim() || undefined,
          description: a.description?.trim() || undefined,
          required: a.required ?? undefined,
        }))
        .filter(a => a.name.length > 0),
    [args]
  )

  const valid =
    isValidKey(normalizeKey(key)) &&
    preparedMessages.length > 0 &&
    preparedMessages.every(m => m.role === 'user' || m.role === 'assistant')

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

  const addArg = () => setArgs(prev => [...prev, { name: '', title: '', description: '', required: false }])
  const removeArg = (idx: number) => setArgs(prev => prev.filter((_, i) => i !== idx))

  const submit = useCallback(async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const keyNorm = normalizeKey(key)
      const payload: NewPromptVersionDto = {
        title: title.trim() || undefined,
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
        <h3 className="font-bold text-lg">Создать промпт</h3>
        <p className="text-sm opacity-70">
          Промпт для MCP: задайте ключ, заголовок (опц.), одно или несколько сообщений и аргументы.
        </p>

        <div className="py-3 space-y-4">
          {/* Ключ и заголовок */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label">
                <span className="label-text">Ключ *</span>
                <span className="label-text-alt opacity-60">{KEY_HINT}</span>
              </span>
              <input
                className="input input-bordered"
                placeholder="например: mcp/prompts/generate-tests"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onBlur={() => setKey(k => normalizeKey(k))}
              />
              {!isValidKey(normalizeKey(key)) && (
                <span className="label-text-alt text-error mt-1">Неверный формат ключа</span>
              )}
            </label>

            <label className="form-control">
              <span className="label">
                <span className="label-text">Заголовок</span>
                <span className="label-text-alt opacity-60">опционально</span>
              </span>
              <input
                className="input input-bordered"
                placeholder="Например: Генерация юнит-тестов"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </div>

          {/* Сообщения */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="font-medium text-base flex-1">Сообщения *</h4>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowMdHint(v => !v)}>
                {showMdHint ? 'Скрыть подсказку' : 'Показать подсказку'}
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={addMessage}>
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>

            {showMdHint && (
              <div className="alert alert-info py-2">
                <span className="text-sm">
                  Поддерживается markdown. Добавьте несколько сообщений, если хотите задать
                  историю диалога (например, сначала <i>assistant</i> с инструкцией, затем <i>user</i> с шаблоном запроса).
                  Отправка: <kbd>Ctrl/⌘</kbd> + <kbd>Enter</kbd>.
                </span>
              </div>
            )}

            <ul className="space-y-3">
              {messages.map((m, idx) => (
                <li key={idx} className="card border border-base-200">
                  <div className="card-body p-3 lg:p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        className="select select-bordered select-sm w-32"
                        value={m.role}
                        onChange={(e) =>
                          setMessages(prev =>
                            prev.map((x, i) => (i === idx ? { ...x, role: e.target.value as UiMessage['role'] } : x))
                          )
                        }
                        aria-label="Роль"
                      >
                        <option value="user">user</option>
                        <option value="assistant">assistant</option>
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

                    <textarea
                      className="textarea textarea-bordered min-h-28"
                      placeholder={m.role === 'assistant' ? 'Инструкция ассистента...' : 'Текст пользователя…'}
                      value={m.text}
                      onChange={(e) =>
                        setMessages(prev => prev.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))
                      }
                    />
                    {m.text.trim().length === 0 && (
                      <span className="text-xs opacity-60">Это сообщение будет проигнорировано при пустом тексте</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Аргументы */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="font-medium text-base flex-1">Аргументы (опционально)</h4>
              <button type="button" className="btn btn-sm btn-primary" onClick={addArg}>
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>

            {args.length === 0 && (
              <div className="text-sm opacity-60">
                Аргументы позволяют параметризовать промпт из IDE/агента. Добавьте, если нужно.
              </div>
            )}

            <ul className="space-y-3">
              {args.map((a, idx) => (
                <li key={idx} className="card border border-base-200">
                  <div className="card-body p-3 lg:p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                      <label className="form-control lg:col-span-3">
                        <span className="label-text">Name *</span>
                        <input
                          className="input input-bordered"
                          placeholder="например: className"
                          value={a.name}
                          onChange={(e) =>
                            setArgs(prev => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                          }
                          onBlur={(e) =>
                            setArgs(prev =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, name: e.target.value.trim().replace(/\s+/g, '_') } : x
                              )
                            )
                          }
                        />
                        {a.name.trim().length === 0 && (
                          <span className="label-text-alt text-error">Обязательное поле</span>
                        )}
                      </label>

                      <label className="form-control lg:col-span-3">
                        <span className="label-text">Title</span>
                        <input
                          className="input input-bordered"
                          placeholder="Читабельное имя"
                          value={a.title ?? ''}
                          onChange={(e) =>
                            setArgs(prev => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))
                          }
                        />
                      </label>

                      <label className="form-control lg:col-span-5">
                        <span className="label-text">Description</span>
                        <input
                          className="input input-bordered"
                          placeholder="Подсказка для пользователя"
                          value={a.description ?? ''}
                          onChange={(e) =>
                            setArgs(prev =>
                              prev.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                            )
                          }
                        />
                      </label>

                      <label className="label cursor-pointer lg:col-span-1 items-center gap-2">
                        <span className="label-text">Required</span>
                        <input
                          type="checkbox"
                          className="toggle"
                          checked={!!a.required}
                          onChange={(e) =>
                            setArgs(prev => prev.map((x, i) => (i === idx ? { ...x, required: e.target.checked } : x)))
                          }
                        />
                      </label>

                      <div className="lg:col-span-12 flex justify-end">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => removeArg(idx)}
                        >
                          <Trash2 className="w-4 h-4" /> Удалить аргумент
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
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