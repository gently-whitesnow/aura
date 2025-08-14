import { useMemo, useState, useCallback } from 'react'
import type { NewResourceVersionDto } from '../types'


type Props = {
  onSubmit: (key: string, payload: NewResourceVersionDto) => Promise<void>
  onClose: () => void
}

const KEY_HINT = 'латиница, цифры, ".", "-", "_", "/", ≥ 3 символов'
const keyRegex = /^[a-z0-9._/\-]{3,}$/

function normalizeKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/\/{2,}/g, '/')
}

export default function CreateResourceModal({ onSubmit, onClose }: Props) {
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [annotationsRaw, setAnnotationsRaw] = useState('') // JSON (опционально)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const parsedAnnotations = useMemo(() => {
    if (!annotationsRaw.trim()) return { ok: true as const, value: null as Record<string, any> | null }
    try {
      const val = JSON.parse(annotationsRaw)
      if (val && typeof val === 'object' && !Array.isArray(val)) return { ok: true as const, value: val }
      return { ok: false as const, error: 'Annotations должен быть JSON-объектом' }
    } catch (e) {
      return { ok: false as const, error: 'Некорректный JSON' }
    }
  }, [annotationsRaw])

  const normalizedKey = useMemo(() => normalizeKey(key), [key])
  const keyValid = keyRegex.test(normalizedKey)


  const valid = keyValid && parsedAnnotations.ok

  const submit = useCallback(async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const payload: NewResourceVersionDto = {
        title: title.trim() ? title.trim() : undefined,
        text: text,
        description: description.trim() ? description.trim() : undefined,
        annotations: parsedAnnotations.ok ? parsedAnnotations.value : undefined
      }
      await onSubmit(normalizedKey, payload)
    } catch {
      setError('Ошибка создания')
    } finally {
      setLoading(false)
    }
  }, [valid, title, text, description, parsedAnnotations, onSubmit, normalizedKey])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <dialog open className="modal" onKeyDown={onKeyDown}>
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg">Создать ресурс</h3>
        <p className="text-sm opacity-70">Укажите ключ и либо URI, либо встроенный текст. Остальное — по желанию.</p>

        <div className="py-3 space-y-4">
          {/* key + title */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label">
                <span className="label-text">Ключ *</span>
                <span className="label-text-alt opacity-60">{KEY_HINT}</span>
              </span>
              <input
                className="input input-bordered"
                placeholder="например: data/my.resource"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onBlur={() => setKey(k => normalizeKey(k))}
              />
              {!keyValid && <span className="label-text-alt text-error mt-1">Неверный формат ключа</span>}
            </label>

            <label className="form-control">
              <span className="label">
                <span className="label-text">Заголовок</span>
                <span className="label-text-alt opacity-60">опционально</span>
              </span>
              <input
                className="input input-bordered"
                placeholder="Например: Правила коммита"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </div>


          {/* Text editors */}
            
            <label className="form-control">
              <span className="label-text">Текст *</span>
              <textarea
                className="textarea textarea-bordered min-h-40"
                placeholder="Вставьте содержимое ресурса (markdown, json, yaml и т.д.)"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            {!text && <span className="label-text-alt opacity-60">Введите содержимое</span>}
          </label>

          {/* description + mimeType */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <label className="form-control lg:col-span-3">
              <span className="label-text">Описание</span>
              <textarea
                className="textarea textarea-bordered min-h-24"
                placeholder="Коротко: что это и как использовать"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          {/* annotations json */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Аннотации (JSON, опционально)</h4>
              {annotationsRaw && parsedAnnotations.ok && (
                <span className="badge badge-ghost">OK</span>
              )}
              {annotationsRaw && !parsedAnnotations.ok && (
                <span className="badge badge-error">{/* короткий индикатор */}JSON</span>
              )}
            </div>
            <textarea
              className={`textarea textarea-bordered min-h-28 ${annotationsRaw && !parsedAnnotations.ok ? 'textarea-error' : ''}`}
              placeholder='Например: {"tags":["ci","tests"],"locale":"ru-RU"}'
              value={annotationsRaw}
              onChange={(e) => setAnnotationsRaw(e.target.value)}
            />
            {annotationsRaw && !parsedAnnotations.ok && (
              <div className="text-error text-sm">{(parsedAnnotations as any).error}</div>
            )}
          </div>

          {/* errors */}
          {error && <div className="alert alert-error">{error}</div>}
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="button" className="btn btn-primary" disabled={!valid || loading} onClick={submit}>
            Создать
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button aria-label="Закрыть" />
      </form>
    </dialog>
  )
}