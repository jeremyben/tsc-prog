import { sys } from 'typescript'
import { resolve, relative, normalize } from 'path'
import { relativeToCWD } from './utils/path'
import { cp } from './utils/fs'

/**
 * Copy non-typescript files to `outDir`.
 * @param emittedFiles files previously emitted by the compiler and protected from being overwritten
 * @internal
 */
export default function copyOtherFiles(
	srcDir: string,
	outDir: string,
	declarationDir: string | undefined,
	emittedFiles: string[] | undefined = []
) {
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
			console.log(`Won't override previously emitted file: ${relativeToCWD(destFile)}`)
			continue
		}

		cp(srcFile, destFile, !alreadyEmitted)
		copiedFiles.push(destFile)
	}

	return copiedFiles
}

/**
 * @internal
 */
function matchAllFilesBut(path: string, excludes: string[] | undefined) {
	return sys.readDirectory(path, undefined, excludes, undefined)
}
