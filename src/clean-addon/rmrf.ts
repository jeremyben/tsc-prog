import { readdirSync, existsSync, rmdirSync, unlinkSync, lstatSync, chmodSync } from 'fs'
import { join, relative } from 'path'

/**
 * Inspired from {@link https://github.com/isaacs/rimraf}
 * @internal
 */
export default function rmrf(path: string) {
	// TODO: rely on ENOENT instead
	// https://nodejs.org/dist/latest/docs/api/fs.html#fs_fs_exists_path_callback
	if (!existsSync(path)) return

	if (tryIsDirectory(path)) deleteRecursive(path)
	else tryDeleteFile(path)

	function deleteRecursive(dirPath: string) {
		const names = readdirSync(dirPath)
		for (const name of names) {
			const path_ = join(dirPath, name)

			if (tryIsDirectory(path_)) deleteRecursive(path_)
			else tryDeleteFile(path_)
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

	function fixWindowsEPERM(path_: string) {
		if (process.platform === 'win32') chmodSync(path_, 0o666)
	}
}
