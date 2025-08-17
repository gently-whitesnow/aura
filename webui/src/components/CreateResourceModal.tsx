import { useMemo, useState, useCallback } from 'react'
import type { NewResourceVersionDto } from '@/types'
import { KEY_HINT } from '@/lib/constants'
import { normalizeKey, isValidKey } from '@/lib/validation'
import AutoResizeTextarea from './AutoResizeTextarea'

type Props = {
  onSubmit: (key: string, payload: NewResourceVersionDto) => Promise<void>
  onClose: () => void
  initialKey?: string
  initialValues?: NewResourceVersionDto
  lockKey?: boolean
}

export default function CreateResourceModal({ onSubmit, onClose, initialKey, initialValues, lockKey }: Props) {
  const [key, setKey] = useState(initialKey ?? '')
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [text, setText] = useState(initialValues?.text ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const normalizedKey = useMemo(() => normalizeKey(key), [key])
  const keyValid = isValidKey(normalizedKey) || !!lockKey
  const textValid = text.trim().length > 0
  const valid = keyValid && textValid && title.trim().length > 0

  const submit = useCallback(async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const payload: NewResourceVersionDto = {
        title: title.trim(),
        text,
        description: description.trim() ? description.trim() : ''
      }
      await onSubmit(normalizedKey, payload)
    } catch {
      setError('Ошибка создания')
    } finally {
      setLoading(false)
    }
  }, [valid, title, text, description, onSubmit, normalizedKey])

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
          {lockKey ? 'Новая версия ресурса' : 'Создание ресурса'}
        </h3>

        <div className="py-3 space-y-4">
          {/* Ключ и заголовок — как в CreatePromptModal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label">
                <span className="label-text text-base font-semibold">Ключ *</span>
                <span className="label-text-alt opacity-60">{KEY_HINT}</span>
              </span>
              <input
                className="input input-bordered"
                placeholder="например: data/my.resource"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onBlur={() => { if (!lockKey) setKey(k => normalizeKey(k)) }}
                readOnly={!!lockKey}
              />
              {!keyValid && !lockKey && (
                <span className="label-text-alt text-error mt-1">Неверный формат ключа</span>
              )}
            </label>

            <label className="form-control">
              <span className="label">
                <span className="label-text text-base font-semibold">Заголовок *</span>
                <span className="label-text-alt opacity-60">3-6 слов что за ресурс</span>
              </span>
              <input
                className="input input-bordered"
                placeholder="Например: Правила коммита"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {title.trim().length === 0 && (
                <span className="label-text-alt text-error">Обязательное поле</span>
              )}
            </label>
          </div>

          {/* Контент ресурса */}
          <div className="space-y-2">
            <h4 className="font-medium text-base">Содержимое *</h4>
            <AutoResizeTextarea
              className="textarea textarea-bordered w-full min-h-28 max-h-[70vh] font-mono"
              placeholder={
                '# Пример ресурса (Markdown)\n' +
                '\n' +
                '- Описание правил\n' +
                '- Шаблоны коммитов\n' +
                '\n' +
                '```json\n' +
                '{ "example": true }\n' +
                '```'
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              minRows={8}
              maxRows={40}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
            {!textValid && (
              <span className="label-text-alt text-error">Обязательное поле</span>
            )}
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <h4 className="font-medium text-base">Описание</h4>
            <AutoResizeTextarea
              className="textarea textarea-bordered w-full min-h-24 max-h-[50vh]"
              placeholder="Коротко: что это и как mcp клиент это может использовать"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minRows={4}
              maxRows={20}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          {/* Ошибки */}
          {error && <div className="alert alert-error">{error}</div>}
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid || loading}
            onClick={submit}
          >
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