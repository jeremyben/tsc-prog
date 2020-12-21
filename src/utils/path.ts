import * as p from 'path'

/**
 * @internal
 */
export function ensureAbsolutePath(path: string | undefined, basePath: string = process.cwd()): string {
	if (!path) return ''
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

/**
 * @internal
 */
export function fileIsWithin(file: string, dir: string) {
	const rel = p.relative(dir, file)
	return !rel.startsWith('../') && rel !== '..'
}

/**
 * @internal
 */
export function changeDir(file: string, fromDir: string, toDir: string): string {
	return p.resolve(toDir, p.relative(fromDir, file))
}

/**
 * @param matchExtensions - extensions to replace, match everything if empty. Items should start with a dot.
 * @param newExtension - should start with a dot.
 * @internal
 */
export function changeExtension(file: string, matchExtensions: readonly string[], newExtension: string): string {
	const oldExtension = p.extname(file)

	if (matchExtensions.length === 0 || matchExtensions.includes(oldExtension)) {
		return p.join(p.dirname(file), p.basename(file, oldExtension) + newExtension)
	}

	return file
}
