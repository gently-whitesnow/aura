import { useState } from 'react'

type Props = {
  onSubmit: (key: string, title: string, body: string) => Promise<void>
  onClose: () => void
}

export default function CreatePromptModal({ onSubmit, onClose }: Props) {
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const valid = key.trim().length >= 3 && title.trim().length > 0 && body.trim().length > 0

  const submit = async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(key.trim().toLowerCase(), title.trim(), body)
    } catch {
      setError('Ошибка создания')
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog open className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Создать промпт</h3>
        <div className="py-2 space-y-2">
          <label className="form-control">
            <span className="label-text">Ключ</span>
            <input
              className="input input-bordered"
              placeholder="например: my/prompt.key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text">Заголовок</span>
            <input className="input input-bordered" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text">Сообщение (markdown)</span>
            <textarea
              className="textarea textarea-bordered min-h-32"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
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
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button aria-label="Закрыть" />
      </form>
    </dialog>
  )
}


