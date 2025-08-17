import type { ReactNode } from 'react'

type Props = {
    title: string
    loading?: boolean
    error?: string | null
    isEmpty?: boolean
    onAdd?: () => void
    children: ReactNode
}

export function EntitySection({
    title,
    loading,
    error,
    isEmpty,
    onAdd,
    children
}: Props) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium flex-1">{title}</h2>
                {onAdd && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline btn-info"
                        onClick={onAdd}
                    >
                        Добавить
                    </button>
                )}
            </div>

            {loading && <div className="loading loading-dots" aria-live="polite" />}

            {error && <div className="alert alert-error">{error}</div>}

            {isEmpty && (
                <div className="text-sm opacity-70">Ничего не найдено</div>
            )}

            {!loading && !error && !isEmpty && children}
        </div>
    )
}