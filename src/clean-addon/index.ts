import { CompilerOptions } from 'typescript'
import { EmitOptions } from '../interfaces'
import { ensureAbsolutePath, relativePath, normalizePath, parentPaths } from '../path.utils'
import rmrf from './rmrf'

/**
 * @internal
 */
export default function cleanTargets(
	targets: Required<EmitOptions>['clean'],
	compilerOptions: CompilerOptions,
	basePath: string = process.cwd()
) {
	protectSensitiveFolders(targets, compilerOptions, basePath)

	if (Array.isArray(targets)) {
		for (let target of targets) {
			target = ensureAbsolutePath(target, basePath)
			console.log('Cleaning:', relativePath(target))
			rmrf(target)
		}
	} else {
		const { outDir, outFile, declarationDir } = compilerOptions

		if (targets.outDir && outDir) {
			console.log('Cleaning outDir:', relativePath(outDir))
			rmrf(outDir)
		}

		if (targets.declarationDir && declarationDir) {
			console.log('Cleaning declarationDir:', relativePath(declarationDir))
			rmrf(declarationDir)
		}

		if (targets.outFile && outFile) {
			console.log('Cleaning outFile:', relativePath(outFile))
			rmrf(outFile)
		}
	}
}

/**
 * @internal
 */
function protectSensitiveFolders(
	targets: Required<EmitOptions>['clean'],
	compilerOptions: CompilerOptions,
	basePath: string
) {
	const { rootDir } = compilerOptions
	const cwd = process.cwd()

	const protectedDirs: (string | undefined)[] = [rootDir, cwd, ...parentPaths(cwd)]

	if (cwd !== basePath) {
		protectedDirs.push(basePath, ...parentPaths(basePath))
	}

	const check = (target: string) => {
		for (const dir of protectedDirs) {
			// `compilerOptions` properties returns unix separators in windows paths so we must normalize
			if (target === normalizePath(dir)) throw Error(`You cannot delete ${target}`)
		}
	}

	if (Array.isArray(targets)) {
		for (let target of targets) {
			target = ensureAbsolutePath(target, basePath)
			check(target)
		}
	} else {
		for (const target of Object.keys(targets) as (keyof typeof targets)[]) {
			if (compilerOptions[target]) {
				// We can have outDir/declarationDir to be the same as rootDir
				check(compilerOptions[target]!)
			}
		}
	}
}
