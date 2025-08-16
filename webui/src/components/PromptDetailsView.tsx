// components/PromptDetailsView.tsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import type { PromptRecord, NewPromptVersionDto } from '../types'
import { api } from '../lib/api'
import { useUser } from '../store/user'
import { HistoryPanel } from './HistoryPanel.tsx'
import CreatePromptModal from './CreatePromptModal'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="card bg-base-100">
            <div className="card-body p-4">
                <h2 className="card-title text-base mb-2">{title}</h2>
                {children}
            </div>
        </section>
    )
}

export function PromptDetailsView({ keyName }: { keyName: string }) {
    const { info } = useUser()
    const [active, setActive] = useState<PromptRecord | null>(null)
    const [history, setHistory] = useState<PromptRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    // v == null -> показываем активную; v != null -> показываем превью конкретной версии
    const [previewVersion, setPreviewVersion] = useState<number | null>(null)
    const [editingOpen, setEditingOpen] = useState(false)

    const displayed = useMemo<PromptRecord | null>(() => {
        if (previewVersion == null) return active
        return history.find(v => v.version === previewVersion) ?? active
    }, [active, history, previewVersion])

    const load = useCallback(async () => {
        setLoading(true); setErr(null)
        try {
            const [a, h] = await Promise.all([
                api.promptActive(keyName),
                api.promptHistory(keyName),
            ])
            setActive(a)
            setHistory(h)
            // если превью указывает на версию, которой уже нет — сбрасываем
            if (a && previewVersion != null && !h.some(v => v.version === previewVersion)) {
                setPreviewVersion(null)
            }
        } catch {
            setErr('Ошибка загрузки')
        } finally {
            setLoading(false)
        }
    }, [keyName, previewVersion])

    useEffect(() => { load() }, [load])

    const onChangeStatus = async (v: number, status: number) => {
        try {
            await api.setStatus('Prompt', keyName, v, status)
            await load()
            setToast('Статус обновлён')
        } catch {
            setToast('Ошибка смены статуса')
        }
    }

    // Удалено: явная смена активной версии не поддерживается на бэкенде (активной считается последняя Approved)

    // редактируем ВСЕГДА ту версию, что отображается (активную или превью)
    const initialValues: NewPromptVersionDto | undefined = displayed
        ? {
            title: displayed.title ?? '',
            messages: displayed.messages?.length
                ? displayed.messages
                : [{ role: 'user', text: '' }],
            arguments: displayed.arguments ?? [],
        }
        : undefined

    const isAdmin = !!info?.isAdmin
    const isPreviewing = previewVersion != null
    const displayedIsActive = displayed && active && displayed.version === active.version

    return (
        <div className="flex flex-col gap-4">
            <Section title={isPreviewing ? `Предпросмотр v${previewVersion}` : 'Активная версия'}>
                {loading && <div className="loading loading-dots loading-lg" />}
                {err && <div className="alert alert-error">{err}</div>}

                {!loading && !displayed && (
                    <div className="text-sm opacity-70">Нет активной версии</div>
                )}

                {!loading && displayed && (
                    <div className="space-y-3">
                        <div className="flex items-start gap-2">
                            <div className="flex-1">
                                <div className="font-medium">{displayed.title || 'Без названия'}</div>
                                <div className="text-xs opacity-60">
                                    v{displayed.version} · статус: {displayed.status}
                                    {displayedIsActive ? ' · активная' : ''}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    className="btn btn-sm"
                                    onClick={() => setEditingOpen(true)}
                                    disabled={!displayed}
                                >
                                    Создать новую версию
                                </button>
                            </div>
                        </div>

                        {displayed.arguments?.length ? (
                            <div className="text-sm">
                                <div className="font-medium mb-1">Аргументы:</div>
                                <ul className="list-disc ml-5">
                                    {displayed.arguments.map(a => (
                                        <li key={a.name}>
                                            <span className="font-mono">{a.name}</span>
                                            {a.title ? ` — ${a.title}` : ''}
                                            {a.required ? ' (обязательный)' : ''}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        <div>
                            <div className="font-medium mb-1">Сообщения:</div>
                            {/* <pre className="p-3 bg-base-200 rounded text-sm overflow-auto"> */}
                            {displayed.messages?.map((m, i) => {
                                return <div key={i} className="flex items-center gap-2">
                                    <div className="font-bold w-28">{m.role === 'user' ? 'запрос' : 'ресурс'}:</div>
                                    <div className="flex-1 text-sm bg-base-200 p-1 rounded-md mt-1">{m.text}</div>
                                </div>
                            })}
                            {/* </pre> */}
                        </div>

                        {/* Активной считается последняя Approved версия */}
                    </div>
                )}
            </Section>

            <Section title="История версий">
                <HistoryPanel
                    items={history}
                    activeVersion={active?.version ?? null}
                    isAdmin={isAdmin}
                    // ВАЖНО: кликая по элементу истории, передаём его версию;
                    // кликая по активной версии — передаём null, что сбрасывает превью.
                    onPreview={(v: number | null) => {
                        if (v == null) {
                            setPreviewVersion(null)
                            return
                        }
                        if (active && v === active.version) {
                            setPreviewVersion(null)
                        } else {
                            setPreviewVersion(v)
                        }
                    }}
                    onChangeStatus={onChangeStatus}
                />
            </Section>

            {editingOpen && (
                <CreatePromptModal
                    onSubmit={async (_k, payload) => {
                        await api.createPromptVersion(keyName, payload)
                        setEditingOpen(false)
                        setToast('Версия отправлена на апрув')
                        await load()
                    }}
                    onClose={() => setEditingOpen(false)}
                    initialKey={keyName}
                    {...(initialValues ? { initialValues } : {})}
                    lockKey
                />
            )}

            {toast && (
                <div className="toast toast-end">
                    <div className="alert alert-info" role="status">
                        <span>{toast}</span>
                        <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setToast(null)}
                            aria-label="Закрыть"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}