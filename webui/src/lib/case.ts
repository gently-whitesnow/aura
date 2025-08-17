export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

export function toSnakeKey(key: string): string {
    return key
        .replace(/([A-Z])/g, '_$1')
        .replace(/__/g, '_')
        .toLowerCase()
}

export function toCamelKey(key: string): string {
    return key.replace(/_([a-z])/g, (_, g1) => g1.toUpperCase())
}

export function mapKeysDeep<T>(value: T, keyMapper: (k: string) => string): T {
    if (Array.isArray(value)) {
        return value.map((v) => mapKeysDeep(v as unknown, keyMapper)) as unknown as T
    }
    if (isPlainObject(value)) {
        const result: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(value)) {
            result[keyMapper(k)] = mapKeysDeep(v as unknown, keyMapper)
        }
        return result as unknown as T
    }
    return value
}

export function toSnakeCaseDeep<T>(value: T): T {
    return mapKeysDeep(value, toSnakeKey)
}

export function toCamelCaseDeep<T>(value: T): T {
    return mapKeysDeep(value, toCamelKey)
}