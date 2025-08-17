import { Search } from 'lucide-react'

type Props = {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    className?: string
}

export function SearchBar({ value, onChange, placeholder, className }: Props) {
    return (
        <label
            className={`input input-bordered rounded-full shadow-sm bg-base-100/95 backdrop-blur
                  flex items-center gap-2 w-full ${className ?? ''}`}
        >
            <Search className="w-4 h-4 opacity-60" aria-hidden />
            <input
                className="grow min-w-0"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label="Поиск"
            />
        </label>
    )
}