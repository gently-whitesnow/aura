import { useMemo, useState, useCallback, useEffect } from 'react'
import type { NewPromptVersionDto } from '../types'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { isValidKey } from '../lib/validation'
import { KEY_HINT } from '../lib/constants'
import AutoResizeTextarea from './AutoResizeTextarea'

type Props = {
  onSubmit: (key: string, payload: NewPromptVersionDto) => Promise<void>
  onClose: () => void
  initialKey?: string
  initialValues?: NewPromptVersionDto
  lockKey?: boolean
}

type UiMessage = { role: 'user' | 'assistant'; text: string }
type UiArgument = { name: string; title?: string; description?: string; required?: boolean }

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
  const [messages, setMessages] = useState<UiMessage[]>(
    (initialValues?.messages?.length
      ? initialValues.messages
      : [{ role: 'user', text: '' }]) as UiMessage[]
  )

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
  const preparedMessages = useMemo(
    () => messages.map(m => ({ role: m.role, text: m.text.trim() })).filter(m => m.text.length > 0),
    [messages]
  )

  // Скан аргументов:
  // 1) все уникальные {{placeholders}} по порядку первого вхождения
  // 2) для user-сообщений без плейсхолдеров — синтетические user_{index+1}
  const computedArgNames = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []

    messages.forEach((m, idx) => {
      const inText: string[] = []
      let match: RegExpExecArray | null

      // валидные
      while ((match = PLACEHOLDER_VALID_RE.exec(m.text)) !== null) {
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
      const any = [...m.text.matchAll(PLACEHOLDER_ANY_RE)].map(x => (x[1] ?? '').trim())
      const valid = new Set<string>([...m.text.matchAll(PLACEHOLDER_VALID_RE)].map(x => x[1]))
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
      computedArgNames.map(name => ({
        name,
        title: argsMeta[name]?.title?.trim() || undefined,
        description: argsMeta[name]?.description?.trim() || undefined,
        required: argsMeta[name]?.required ?? undefined,
      })),
    [computedArgNames, argsMeta]
  )

  const valid =
    isValidKey(normalizeKey(key)) &&
    preparedMessages.length > 0 &&
    preparedMessages.every(m => m.role === 'user' || m.role === 'assistant') &&
    invalidPlaceholders.length === 0

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
        title: title.trim() || '',
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
        <h3 className="font-bold text-lg">Создание промпта</h3>
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
                          setMessages(prev =>
                            prev.map((x, i) => (i === idx ? { ...x, role: e.target.value as UiMessage['role'] } : x))
                          )
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

                    <AutoResizeTextarea
                      className="textarea textarea-bordered w-full min-h-28 max-h-[70vh] font-mono"
                      placeholder={
                        m.role === 'assistant'
                          ? '// пример идеального теста (сокращённо)\n' +
                          'using FluentAssertions;\n' +
                          'using Xunit;\n' +
                          '\n' +
                          'public class ExampleTests\n' +
                          '{\n' +
                          '    [Fact]\n' +
                          '    public void DoWork_Should_Return_Expected()\n' +
                          '    {\n' +
                          '        // Arrange\n' +
                          '        var sut = new Example();\n' +
                          '        // Act\n' +
                          '        var result = sut.DoWork(42);\n' +
                          '        // Assert\n' +
                          '        result.Should().Be(42);\n' +
                          '    }\n' +
                          '}'
                          : 'Сгенерируй юнит-тесты на {{framework}} для класса: {{className}}. Требования к ответу: 1) # Summary — кратко опиши стратегию покрытия. 2) # Tests — список тестов. 3) # Coverage — покрытие. 4) # Code — код тестов.'
                      }
                      value={m.text}
                      onChange={(e) =>
                        setMessages(prev => prev.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))
                      }
                      minRows={8}
                      maxRows={40}
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="text-xs opacity-60">
              Пример аргумента запроса: <code>{'{{className}}'}</code>
            </div>

            <div className="flex justify-between">
              {messages.every(m => m.role === 'user' && m.text.trim().length === 0) ? (
                <span className="label-text-alt text-error mt-1">Необходимо добавить хотя бы одно сообщение</span>
              ) : <span />}
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={addMessage}
                disabled={messages.some(m => m.role === 'user' && m.text.trim().length === 0)}
              >
                <Plus className="w-4 h-4" /> Добавить
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