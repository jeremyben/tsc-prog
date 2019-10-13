import { relativeToCWD, parentPaths } from './utils/path'
import { rmrf } from './utils/fs'
import { normalize } from 'path'
import { Color } from './utils/log'

/**
 * Delete files and folders created by a previous build.
 * @internal
 */
export default function cleanTargets(targets: string[]) {
	if (!targets.length) return

	for (const target of targets) {
		console.log('Clean:', relativeToCWD(target))
		rmrf(target)
	}

	// Pause on windows to try to work around eventual lingering file handles
	if (process.platform === 'win32') {
		const until = Date.now() + 500
		while (Date.now() < until) {}
	}
}

/**
 * @internal
 */
export function protectSensitiveFolders(targets: string[], rootDir: string | undefined, basePath: string | undefined) {
	const cwd = process.cwd()
	let protectedDirs: string[] = [cwd, ...parentPaths(cwd)]

	if (basePath && basePath !== cwd) {
		protectedDirs.push(basePath, ...parentPaths(basePath))
	}

	// compilerOptions properties returns unix separators in windows paths so we must normalize
	rootDir = rootDir ? normalize(rootDir) : undefined
	if (rootDir && rootDir !== cwd && rootDir !== basePath) {
		protectedDirs.push(rootDir, ...parentPaths(rootDir))
	}

	// Dedupe
	protectedDirs = [...new Set(protectedDirs)]

	for (const target of targets) {
		for (const dir of protectedDirs) {
			if (target === dir) {
				throw Color.red(`You cannot delete ${target}`)
			}
		}
	}
}
