import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { api } from "@/lib/api";

type Option = { name: string; title?: string | null };

export function ResourceSelector({
    value,
    onChange,
}: { value: string; onChange: (v: string) => void }) {

    const [input, setInput] = useState<string>("");
    const debounced = useDebouncedValue(input, 300);

    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);

    // Флаг: следующий debounced-поиск пропускаем (при программных setInput)
    const skipNextFetchRef = useRef(false);
    // Для отслеживания смены внешнего value
    const prevValueRef = useRef<string | undefined>(undefined);

    // ── 1) Маунт: если value передан — НЕ делаем стартовый запрос
    useEffect(() => {
        let cancelled = false;

        async function initial() {
            if (value && value.trim().length > 0) {
                skipNextFetchRef.current = true;
                setInput(value);
                return;
            }

            // value пустой — один раз грузим пустым query
            setLoading(true);
            try {
                const list = await api.listResources("");
                if (!cancelled) {
                    setOptions(list.map((r: any) => ({ name: r.name, title: r.title })));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        initial();
        return () => { cancelled = true; };
    }, []);


    useEffect(() => {
        if (skipNextFetchRef.current) {
            skipNextFetchRef.current = false;
            return;
        }
        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                const q = debounced.trim();
                const list = await api.listResources(q);
                if (!cancelled) {
                    setOptions(list.map((r: any) => ({ name: r.name, title: r.title })));
                }
            } catch {
                if (!cancelled) setOptions([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [debounced]);

    useEffect(() => {
        if (prevValueRef.current === value) return;
        prevValueRef.current = value;

        const found = options.find(o => o.name === value);
        const label = found?.name || value || "";

        skipNextFetchRef.current = true; // не дергать поиск этим setInput
        setInput(label);
    }, [value]); // <— только value

    // Выбор из списка/по Enter
    function commitSelection(opt: Option) {
        const label = opt.title || opt.name;
        skipNextFetchRef.current = true; // не ищем по label
        setInput(label);                 // для пользователя — title
        onChange(opt.name);              // наружу — name
    }

    function handleEnter() {
        const exact = options.find(
            o => (o.title || o.name) === input || o.name === input
        );
        if (exact) { commitSelection(exact); return; }
        if (options[0]) { commitSelection(options[0]); }
    }

    return (
        <div className="form-control">
            <input
                className="input input-bordered"
                placeholder="Имя ресурса"
                value={input}
                onChange={(e) => {
                    setInput(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        handleEnter();
                    }
                }}
            />

            {loading ? (
                <div className="text-xs opacity-60 mt-1">Загрузка…</div>
            ) : options.length > 0 ? (
                <ul className="menu bg-base-200 rounded-box mt-2 shadow z-10">
                    {options.map(opt => {
                        return (
                            <li key={opt.name}>
                                <button type="button" onClick={() => commitSelection(opt)}>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs opacity-60">{opt.name} ({opt.title})</span>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : input.trim() ? (
                <div className="text-xs opacity-60 mt-1">Совпадений не найдено</div>
            ) : null}
        </div>
    );
}