import { sys, Program } from 'typescript'
import { resolve, relative, normalize } from 'path'
import { relativeToCWD } from './utils/path'
import { cp } from './utils/fs'
import { Color } from './utils/log'

/**
 * Copy non-typescript files to `outDir`.
 * @param emittedFiles files previously emitted by the compiler and protected from being overwritten
 * @internal
 */
export default function copyOtherFiles(program: Program, emittedFiles: string[] | undefined = []) {
	console.log('Copying other files')
	const { outDir, declarationDir, listEmittedFiles } = program.getCompilerOptions()

	if (outDir == null) {
		console.error(Color.red('Cannot copy: you must define `outDir` in the compiler options'))
		return
	}

	const srcDir = program.getCommonSourceDirectory()
	if (!srcDir) throw Error('Cannot copy: issue with internal typescript method `getCommonSourceDirectory`')

	// Exclude typescript files and outDir/declarationDir if previously emitted in the same folder
	const excludes = ['**/*.ts', outDir]
	if (declarationDir) excludes.push(declarationDir)
	const otherFiles = matchAllFilesBut(srcDir, excludes)

	// Track copied files to list them later if needed
	const copiedFiles: string[] = []

	for (const srcFile of otherFiles) {
		const destFile = resolve(outDir, relative(srcDir, srcFile))

		// Avoid overwriting precedently emitted files (js or json if resolveJsonModule is true)
		// Need to normalize because emitted files have unix separators in windows paths
		const alreadyEmitted = emittedFiles.some((emittedFile) => normalize(emittedFile) === destFile)
		if (alreadyEmitted) {
			console.warn(`Won't override previously emitted file: ${relativeToCWD(destFile)}`)
			continue
		}

		cp(srcFile, destFile, !alreadyEmitted)
		copiedFiles.push(destFile)
	}

	if (listEmittedFiles) console.log('Copied files:\n' + copiedFiles.join('\n'))
}

/**
 * @internal
 */
function matchAllFilesBut(path: string, excludes: string[] | undefined) {
	return sys.readDirectory(path, undefined, excludes, undefined)
}
