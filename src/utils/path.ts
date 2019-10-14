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
export function changeDir(filePath: string, oldDirPath: string, newDirPath: string): string {
	return p.resolve(newDirPath, p.relative(oldDirPath, filePath))
}

/**
 * @param matchExtensions - extensions to replace, match everything if empty. Items should start with a dot.
 * @param newExtension - should start with a dot.
 * @internal
 */
export function changeExtension(filePath: string, matchExtensions: string[], newExtension: string) {
	const oldExtension = p.extname(filePath)

	if (matchExtensions.length === 0 || matchExtensions.includes(oldExtension)) {
		return p.join(p.dirname(filePath), p.basename(filePath, oldExtension) + newExtension)
	}

	return filePath
}
