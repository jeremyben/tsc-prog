import * as p from 'path'

/**
 * @internal
 */
export function ensureAbsolutePath(path: string, basePath: string = process.cwd()): string {
	return p.isAbsolute(path) ? path : p.join(basePath, path)
}

/**
 * @internal
 */
export function relativeToCWD(path: string): string {
	return p.relative(process.cwd(), path)
}

/**
 * @internal
 */
export function normalizePath(path: string | undefined): string | undefined {
	if (!path) return path
	return p.normalize(path)
}

/**
 * @internal
 */
export function parentPaths(path: string): string[] {
	// tslint:disable-next-line: prefer-const
	let { root, dir } = p.parse(path)
	const parents: string[] = []

	while (dir !== root) {
		parents.push(dir)
		dir = p.dirname(dir)
	}

	return parents
}
