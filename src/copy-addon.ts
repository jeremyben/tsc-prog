import * as ts from 'typescript'
import { changeDir } from './utils/path'
import { cp } from './utils/fs'
import { Color } from './utils/log'

/**
 * Copy non-typescript files to `outDir`.
 * @internal
 */
export default function copyOtherFiles(program: ts.Program) {
	const srcDir = program.getCommonSourceDirectory()

	const options = program.getCompilerOptions()
	const outDir = options.outDir! // already checked before
	const declarationDir = options.declarationDir

	// https://github.com/Microsoft/TypeScript/issues/1863
	const excludes: string[] = (program as any)[excludeKey] || []
	// Exclude typescript files and outDir/declarationDir if previously emitted in the same folder
	excludes.push('**/*.ts', outDir, declarationDir || '')
	const otherFiles = matchAllFilesBut(srcDir, excludes)

	// Track copied files to list them later if needed
	const copiedFiles: string[] = []

	for (const srcOtherFile of otherFiles) {
		const destOtherFile = changeDir(srcOtherFile, srcDir, outDir)

		try {
			cp(srcOtherFile, destOtherFile)
		} catch (error: any) {
			if (error.code === 'EEXIST') console.warn(Color.yellow(error.message))
			else throw error
		}

		copiedFiles.push(destOtherFile)
	}

	return copiedFiles
}

/**
 * Attach exclude pattern to the program during creation,
 * to keep a reference when copying other files.
 * @internal
 */
export const excludeKey = Symbol('exclude')

/**
 * @internal
 */
function matchAllFilesBut(path: string, excludes: string[] | undefined) {
	return ts.sys.readDirectory(path, undefined, excludes, undefined)
}
