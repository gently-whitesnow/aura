import { useMemo, useState } from 'react'

type Props = {
  onSubmit: (key: string, payload: {
    title?: string
    uri: string
    text?: string
    description?: string
    mimeType?: string
    size?: number
  }) => Promise<void>
  onClose: () => void
}

export default function CreateResourceModal({ onSubmit, onClose }: Props) {
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [uri, setUri] = useState('')
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [mimeType, setMimeType] = useState('')
  const [size, setSize] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const valid = useMemo(() => key.trim().length >= 3 && uri.trim().length > 0, [key, uri])

  const submit = async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const payload: {
        uri: string
        title?: string
        text?: string
        description?: string
        mimeType?: string
        size?: number
      } = {
        uri: uri.trim(),
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(text.trim() ? { text: text.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(mimeType.trim() ? { mimeType: mimeType.trim() } : {}),
        ...(size ? { size: Number(size) } : {}),
      }
      await onSubmit(key.trim().toLowerCase(), payload)
    } catch {
      setError('Ошибка создания')
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog open className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Создать ресурс</h3>
        <div className="py-2 space-y-2">
          <label className="form-control">
            <span className="label-text">Ключ</span>
            <input
              className="input input-bordered"
              placeholder="например: data/my.resource"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text">Заголовок</span>
            <input className="input input-bordered" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text">URI</span>
            <input className="input input-bordered" value={uri} onChange={(e) => setUri(e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text">Текст</span>
            <textarea className="textarea textarea-bordered min-h-24" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text">Описание</span>
            <textarea className="textarea textarea-bordered min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="form-control">
              <span className="label-text">MIME type</span>
              <input className="input input-bordered" value={mimeType} onChange={(e) => setMimeType(e.target.value)} />
            </label>
            <label className="form-control">
              <span className="label-text">Размер (bytes)</span>
              <input className="input input-bordered" value={size} onChange={(e) => setSize(e.target.value)} />
            </label>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
        </div>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="button" className="btn btn-primary" disabled={!valid || loading} onClick={submit}>Создать</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button aria-label="Закрыть" />
      </form>
    </dialog>
  )
}


