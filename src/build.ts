import ts from 'typescript'
import { CreateProgramFromConfigOptions, TsConfig, EmitOptions, BuildOptions } from './interfaces'
import { ensureAbsolutePath } from './utils/path'
import { logDiagnostics, Color } from './utils/log'
import cleanTargets, { protectSensitiveFolders } from './clean-addon'
import copyOtherFiles from './copy-addon'

/**
 * Compile ts files by creating a compilation object using the compiler API and emitting js files.
 * @public
 */
export function build(options: BuildOptions) {
	const program = createProgramFromConfig(options)
	emit(program, options)
}

/**
 * Create a compilation object using the compiler API.
 * @public
 */
export function createProgramFromConfig({
	basePath,
	configFilePath,
	compilerOptions,
	include,
	exclude,
	files,
	extends: extend, // cuz keyword
	references,
}: CreateProgramFromConfigOptions) {
	let config: TsConfig = {}

	if (configFilePath) {
		configFilePath = ensureAbsolutePath(configFilePath, basePath)
		console.log(`Retrieving ${configFilePath}`)

		const readResult = ts.readConfigFile(configFilePath, ts.sys.readFile)
		if (readResult.error) logDiagnostics([readResult.error], true)

		config = readResult.config
	}

	config.compilerOptions = Object.assign({}, config.compilerOptions, compilerOptions)
	if (include) config.include = include
	if (exclude) config.exclude = exclude
	if (files) config.files = files
	if (extend) config.extends = extend
	if (references) config.references = references

	const { options, fileNames, projectReferences, errors } = ts.parseJsonConfigFileContent(
		config,
		ts.sys,
		basePath,
		undefined,
		configFilePath
	)

	logDiagnostics(errors, true)

	const program = ts.createProgram({
		options,
		rootNames: fileNames,
		projectReferences,
	})

	return program
}

/**
 * Compile Typescript files and emit diagnostics if any.
 * @public
 */
export function emit(program: ts.Program, { basePath, clean, copyOtherToOutDir }: EmitOptions = {}) {
	const options = program.getCompilerOptions()

	if (copyOtherToOutDir && !options.outDir) {
		throw Color.red('Cannot copy: you must define `outDir` in the compiler options')
	}

	if (clean) {
		let targets: string[] = []

		if (Array.isArray(clean)) {
			targets = clean.map((t) => ensureAbsolutePath(t, basePath))
		} else {
			if (clean.outDir && options.outDir) targets.push(options.outDir)
			if (clean.outFile && options.outFile) targets.push(options.outFile)
			if (clean.declarationDir && options.declarationDir) targets.push(options.declarationDir)
		}

		protectSensitiveFolders(targets, options.rootDir, basePath)
		cleanTargets(targets)
	}

	if (options.listFiles) console.log('Files to compile:\n' + program.getRootFileNames().join('\n'))

	console.log('Compilation started')
	const { diagnostics, emitSkipped, emittedFiles } = program.emit()

	if (options.listEmittedFiles && emittedFiles) console.log('Emitted files:\n' + emittedFiles.join('\n'))

	// https://github.com/dsherret/ts-morph/issues/384
	const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics)
	logDiagnostics(allDiagnostics, options.pretty as boolean | undefined)

	if (!options.noEmit && emitSkipped) {
		throw Color.red('Compilation failed')
	}

	if (copyOtherToOutDir) {
		console.log('Copying other files to `outDir`')

		const srcDir = program.getCommonSourceDirectory()
		// Should not happen
		if (!srcDir) throw Color.red('Cannot copy: issue with internal typescript method `getCommonSourceDirectory`')

		const copiedFiles = copyOtherFiles(srcDir, options.outDir!, options.declarationDir, emittedFiles)

		if (options.listEmittedFiles) console.log('Copied files:\n' + copiedFiles.join('\n'))
	}

	if (allDiagnostics.length) {
		console.log(Color.yellow(`Compilation done with ${allDiagnostics.length} errors`))
	} else {
		console.log(Color.green('Compilation successful'))
	}
}
