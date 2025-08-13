import { useMemo, useState } from 'react'
import type { ArtifactType, NewVersionDto } from '../types'
import { isValidKey, normalizeKey } from '../lib/validation'
import { extractPlaceholdersFromTemplate } from '../lib/api'

type Props = {
  type: ArtifactType
  onSubmit: (key: string, payload: NewVersionDto) => Promise<void>
  onClose: () => void
}

export default function CreateArtifactModal({ type, onSubmit, onClose }: Props) {
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [template, setTemplate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const placeholders = useMemo(
    () => (type === 'Resource' ? extractPlaceholdersFromTemplate(template) : []),
    [type, template],
  )

  const valid = useMemo(() => {
    if (!isValidKey(key)) return false
    if (title.length < 1 || title.length > 200) return false
    if (type === 'Prompt') return body.trim().length > 0
    return template.trim().length > 0
  }, [key, title, body, template, type])

  const submit = async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const normalizedKey = normalizeKey(key)
      const payload: NewVersionDto =
        type === 'Prompt'
          ? { title, body }
          : { title, template, placeholders }
      await onSubmit(normalizedKey, payload)
    } catch (e: any) {
      const code = e?.error?.error ?? 'Ошибка'
      setError(typeof code === 'string' ? code : 'Ошибка создания')
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog open className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Создать {type === 'Prompt' ? 'промпт' : 'ресурс'}</h3>
        <div className="py-2 space-y-2">
          <label className="form-control">
            <span className="label-text">Ключ</span>
            <input
              className="input input-bordered"
              placeholder="например: my/prompt.key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            {!isValidKey(key) && key.length > 0 && (
              <span className="label-text-alt text-warning">Неверный формат ключа</span>
            )}
          </label>
          <label className="form-control">
            <span className="label-text">Заголовок</span>
            <input
              className="input input-bordered"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          {type === 'Prompt' ? (
            <label className="form-control">
              <span className="label-text">Тело (markdown)</span>
              <textarea
                className="textarea textarea-bordered min-h-32"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label className="form-control">
                <span className="label-text">Шаблон</span>
                <textarea
                  className="textarea textarea-bordered min-h-32"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                />
              </label>
              <div className="form-control">
                <span className="label-text">Плейсхолдеры (извлекаются автоматически)</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {placeholders.length > 0 ? (
                    placeholders.map((p) => (
                      <span key={p} className="badge badge-outline">{p}</span>
                    ))
                  ) : (
                    <span className="text-sm opacity-60">Нет</span>
                  )}
                </div>
              </div>
            </>
          )}
          {error && <div className="alert alert-error">{error}</div>}
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" disabled={!valid || loading} onClick={submit}>Создать</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button aria-label="Закрыть" />
      </form>
    </dialog>
  )
}


