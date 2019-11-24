import * as fs from 'fs'
import { join, dirname } from 'path'
import { relativeToCWD } from './path'

/**
 * Copy file, create parent folders if necessary.
 * @internal
 */
export function cp(srcFilePath: string, destFilePath: string, force = true) {
	const copyFlag = force ? 0 : fs.constants.COPYFILE_EXCL
	const parentDir = dirname(destFilePath)
	fs.mkdirSync(parentDir, { recursive: true }) // no EEXIST error issue with recursive option
	fs.copyFileSync(srcFilePath, destFilePath, copyFlag)
}

/**
 * Delete file/folder recursively.
 * @internal
 */
export function rmrf(path: string) {
	// TODO: rely on ENOENT instead
	// https://nodejs.org/dist/latest/docs/api/fs.html#fs_fs_exists_path_callback
	if (!fs.existsSync(path)) return

	if (tryIsDirectory(path)) deleteRecursive(path)
	else tryDeleteFile(path)

	function deleteRecursive(dirPath: string) {
		const paths = readdirPaths(dirPath)

		for (const path_ of paths) {
			if (tryIsDirectory(path_)) deleteRecursive(path_)
			else tryDeleteFile(path_)
		}

		tryDeleteEmptyDir(dirPath)
	}
}

/**
 * `readdir` with full paths instead of names.
 * @internal
 */
export function readdirPaths(dir: string) {
	return fs.readdirSync(dir).map((name) => join(dir, name))
}

/**
 * @internal
 */
function tryIsDirectory(path: string): boolean {
	const stats = fsSyncRetry(fs.lstatSync, path, ['EPERM'], 2)
	return stats.isDirectory()
}

/**
 * @internal
 */
function tryDeleteFile(filePath: string) {
	fsSyncRetry(fs.unlinkSync, filePath, ['EBUSY', 'EPERM'])
}

/**
 * @internal
 */
function tryDeleteEmptyDir(dirPath: string) {
	fsSyncRetry(fs.rmdirSync, dirPath, ['EBUSY', 'EPERM', 'ENOTEMPTY'])
}

/**
 * Retry fs sync operations on some error codes, to bypass locks (especially on windows).
 * Inspired from https://github.com/isaacs/rimraf
 * @internal
 */
function fsSyncRetry<T extends (path: string) => any>(
	fsSyncFn: T,
	path: string,
	errorCodes: ('EBUSY' | 'EPERM' | 'ENOTEMPTY' | 'EMFILE')[],
	tries = 13
): ReturnType<T> {
	let round = 1

	do {
		if (round > 4) {
			console.log(`Try ${fsSyncFn.name} on ${relativeToCWD(path)} for the ${round}th time (out of ${tries})`)
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
		while (Date.now() < until) {}
	}

	function fixWindowsEPERM(path_: string) {
		if (process.platform === 'win32') fs.chmodSync(path_, 0o666)
	}
}
