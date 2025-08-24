// components/PromptDetailsView.tsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { type PromptRecord, type NewPromptVersionDto, VersionStatus, type PromptMessage } from '@/types'
import { api } from '@/lib/api'
import { useUser } from '@/store/user'
import { HistoryPanel } from '@/pages/PrimitivePage/components/HistoryPanel'
import CreatePromptModal from '@/components/CreatePromptModal/CreatePromptModal'
import { MessageList } from './components/MessageList'

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

export function PromptView({ keyName }: { keyName: string }) {
    const { info } = useUser()
    const [active, setActive] = useState<PromptRecord | null>(null)
    const [history, setHistory] = useState<PromptRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    const [displayVersion, setDisplayVersion] = useState<number | null>()
    const [editingOpen, setEditingOpen] = useState(false)

    const displayed = useMemo<PromptRecord | null>(() => {
        if (displayVersion == null) return active
        return history.find(v => v.version === displayVersion) ?? active
    }, [active, history, displayVersion])

    const load = useCallback(async () => {
        setLoading(true); setErr(null)
        try {
            const [a, h] = await Promise.all([
                api.promptActive(keyName),
                api.promptHistory(keyName),
            ])
            setActive(a)
            setHistory(h)
            setDisplayVersion(a?.version ?? 0)
        } catch {
            setErr('Ошибка загрузки')
        } finally {
            setLoading(false)
        }
    }, [keyName])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        if (displayVersion != null && !history.some(v => v.version === displayVersion)) {
            setDisplayVersion(null)
        }
    }, [history, displayVersion])

    const onChangeStatus = async (v: number, status: number) => {
        try {
            await api.setPromptStatus(keyName, v, status)
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
            messages: (displayed.messages as PromptMessage[]) ?? [],
            arguments: displayed.arguments ?? [],
        }
        : undefined

    const isAdmin = !!info?.isAdmin
    const isPreviewing = displayVersion != active?.version
    const statusDescription = displayed?.status === VersionStatus.Approved ? 'Approved' : displayed?.status === VersionStatus.Pending ? 'Pending' : 'Declined'
    return (
        <div className="flex flex-col gap-4">
            <Section title={isPreviewing ? `Предпросмотр v${displayVersion}` : 'Активная версия'}>
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
                                    v{displayed.version} · статус: {statusDescription}
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                {isAdmin && displayed && (
                                    <button
                                        className="btn btn-ghost btn-xs text-error"
                                        title="Удалить эту версию"
                                        onClick={async () => {
                                            if (!displayed) return
                                            const ok = window.confirm(`Удалить версию v${displayed.version}?`)
                                            if (!ok) return
                                            try {
                                                await api.deletePromptVersion(keyName, displayed.version)
                                                setToast('Версия удалена')
                                                await load()
                                            } catch {
                                                setToast('Ошибка удаления')
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
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
                            <MessageList items={(displayed.messages as PromptMessage[]) ?? []} />
                        </div>

                    </div>
                )
                }
            </Section >

            <Section title="История версий">
                <HistoryPanel
                    items={history}
                    activeVersion={active?.version ?? 0}
                    displayVersion={displayVersion ?? 0}
                    isAdmin={isAdmin}
                    onSelectVersion={(v) => setDisplayVersion(v)}
                    onChangeStatus={onChangeStatus}
                />
            </Section>

            {
                editingOpen && (
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
                )
            }

            {
                toast && (
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
                )
            }
        </div >
    )
}