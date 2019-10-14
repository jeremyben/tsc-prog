import ts from 'typescript'
import { relativeToCWD, changeDir, changeExtension } from './utils/path'
import { cp } from './utils/fs'

/**
 * Copy non-typescript files to `outDir`.
 * @internal
 */
export default function copyOtherFiles(program: ts.Program, outDir: string, declarationDir: string | undefined) {
	const srcDir = program.getCommonSourceDirectory()

	// Retrieve a list of emitted .js files included in the program, by manipulating paths.
	// We could have retrieved them by changing the original `listEmittedFiles` option,
	// but we would have had to create another intermediary program and handle more complexity.
	const emittedFiles = program.getRootFileNames().map((srcFile) => {
		let destFile = changeDir(srcFile, srcDir, outDir)
		destFile = changeExtension(destFile, ['.ts'], '.js')
		return destFile
	})

	// Exclude typescript files and outDir/declarationDir if previously emitted in the same folder
	const excludes = ['**/*.ts', outDir, declarationDir || '']
	const otherFiles = matchAllFilesBut(srcDir, excludes)

	// Track copied files to list them later if needed
	const copiedFiles: string[] = []

	for (const srcOtherFile of otherFiles) {
		const destOtherFile = changeDir(srcOtherFile, srcDir, outDir)

		// Avoid overwriting precedently emitted js files
		const alreadyEmitted = emittedFiles.some((emittedFile) => emittedFile === destOtherFile)
		if (alreadyEmitted) {
			console.info(`Won't override previously emitted file: ${relativeToCWD(destOtherFile)}`)
			continue
		}

		cp(srcOtherFile, destOtherFile, !alreadyEmitted)
		copiedFiles.push(destOtherFile)
	}

	return copiedFiles
}

/**
 * @internal
 */
function matchAllFilesBut(path: string, excludes: string[] | undefined) {
	return ts.sys.readDirectory(path, undefined, excludes, undefined)
}
