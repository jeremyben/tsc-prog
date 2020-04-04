/**
 * @internal
 */
export type MapEntry<T> = T extends Map<infer K, infer V> ? [K, V] : never

/**
 * @internal
 */
export type EitherOne<T, K = keyof T> = K extends keyof T
	? { [P in K]: T[K] } & Partial<{ [P in Exclude<keyof T, K>]: never }>
	: never

/**
 * @internal
 */
export function mapToSet<K, V, R>(
	map: Map<K, V>,
	{ mapper, filter }: { mapper: (value: V, key: K) => R; filter?: (value: V, key: K) => boolean }
): Set<R> {
	const set = new Set<R>()

	map.forEach((value, key) => {
		if (!filter || (filter && filter(value, key))) {
			const item = mapper(value, key)
			set.add(item)
		}
	})

	return set
}

/**
 * Manages creating and pushing to sub-arrays.
 * @internal
 */
export function pushDeep<T>(arrayOfArrays: T[][], index: number, item: T) {
	if (arrayOfArrays[index]) {
		arrayOfArrays[index].push(item)
	} else {
		arrayOfArrays[index] = [item]
	}
}
