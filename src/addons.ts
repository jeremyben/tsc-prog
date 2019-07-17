import { readdirSync, existsSync, rmdirSync, unlinkSync, lstatSync, chmodSync } from 'fs'
import { join, relative } from 'path'

/**
 * Inspired from {@link https://github.com/isaacs/rimraf}
 * @internal
 */
export function rmrf(path: string) {
	// TODO: rely on ENOENT instead
	// https://nodejs.org/dist/latest/docs/api/fs.html#fs_fs_exists_path_callback
	if (!existsSync(path)) return

	if (tryIsDirectory(path)) deleteRecursive(path)
	else tryDeleteFile(path)

	function deleteRecursive(dirPath: string) {
		const fileNames = readdirSync(dirPath)
		// if (fileNames && fileNames.length)
		for (const fileName of fileNames) {
			const filePath = join(dirPath, fileName)

			if (tryIsDirectory(filePath)) deleteRecursive(filePath)
			else tryDeleteFile(filePath)
		}
		tryDeleteEmptyDir(dirPath)
	}
}

/**
 * @internal
 */
function tryIsDirectory(path: string): boolean {
	const stats = fsSyncRetry(lstatSync, path, ['EPERM'], 2)
	return stats.isDirectory()
}

/**
 * @internal
 */
function tryDeleteFile(filePath: string) {
	fsSyncRetry(unlinkSync, filePath, ['EBUSY', 'EPERM', 'ENOTEMPTY'])
}

/**
 * @internal
 */
function tryDeleteEmptyDir(dirPath: string) {
	fsSyncRetry(rmdirSync, dirPath, ['EBUSY', 'EPERM', 'ENOTEMPTY'])
}

/**
 * @internal
 */
function fsSyncRetry<T extends (path: string) => any>(
	fsSyncFn: T,
	path: string,
	errorCodes: string[],
	tries = 13
): ReturnType<T> {
	let round = 1

	do {
		if (round > 4) {
			console.log(`Try ${fsSyncFn.name} on ${relative(process.cwd(), path)} for the ${round}th time (out of ${tries})`)
		}

		try {
			return fsSyncFn(path)
		} catch (err) {
			if (!errorCodes.includes(err.code) || round > tries) throw err

			fixWindowsEPERM(path)
			pause(round * 100)
			round++
		}
	} while (true)

	function pause(ms: number) {
		const until = Date.now() + ms
		// tslint:disable-next-line: no-empty
		while (Date.now() < until) {}
	}
}

/**
 * @internal
 */
function fixWindowsEPERM(path: string) {
	if (process.platform === 'win32') chmodSync(path, 0o666)
}
