import { sys, Program } from 'typescript'
import { resolve, relative, normalize } from 'path'
import { relativeToCWD } from './path.utils'
import { cp } from './fs.utils'
import { red } from './log.utils'

/**
 * Copy non-typescript files to `outDir`.
 * @param emittedFiles files previously emitted by the compiler and protected from being overwritten
 * @internal
 */
export default function copyOtherFiles(program: Program, emittedFiles: string[] | undefined = []) {
	console.log('Copying other files')
	const { outDir, listEmittedFiles } = program.getCompilerOptions()

	if (outDir == null) {
		console.error(red('Cannot copy: you must define `outDir` in the compiler options'))
		return
	}

	const srcDir = program.getCommonSourceDirectory()
	if (!srcDir) throw Error('Cannot copy: issue with internal typescript method `getCommonSourceDirectory`')

	const otherFiles = matchAllFilesBut(srcDir, ['**/*.ts'])
	const copiedFiles: string[] = [] // Track copied files to list them later if needed

	for (const srcFile of otherFiles) {
		const destFile = resolve(outDir, relative(srcDir, srcFile))

		// Avoid overwriting precedently emitted files (js or json if resolveJsonModule is true)
		// Need to normalize because emitted files have unix separators in windows paths
		const wasEmitted = emittedFiles.some((emittedFile) => normalize(emittedFile) === destFile)
		if (wasEmitted) {
			console.warn(`Won't override previously emitted file: ${relativeToCWD(destFile)}`)
			continue
		}

		cp(srcFile, destFile, wasEmitted)
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
