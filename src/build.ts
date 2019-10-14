import ts from 'typescript'
import { CreateProgramFromConfigOptions, TsConfig, EmitOptions, BuildOptions } from './interfaces'
import { ensureAbsolutePath } from './utils/path'
import { logDiagnostics, Color } from './utils/log'
import cleanTargets, { protectSensitiveFolders } from './clean-addon'
import copyOtherFiles, { excludeKey } from './copy-addon'

/**
 * Compiles .ts files by creating a compilation object with the compiler API and emitting .js files.
 * @public
 */
export function build(options: BuildOptions) {
	const program = createProgramFromConfig(options)
	emit(program, options)
}

/**
 * Creates a compilation object using the compiler API.
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
	host,
}: CreateProgramFromConfigOptions) {
	let config: TsConfig = {}

	if (configFilePath) {
		configFilePath = ensureAbsolutePath(configFilePath, basePath)
		console.log(`Retrieving ${configFilePath}`)

		const readResult = ts.readConfigFile(configFilePath, ts.sys.readFile)

		if (readResult.error) {
			const isTTY = !!ts.sys.writeOutputIsTTY && ts.sys.writeOutputIsTTY()
			logDiagnostics([readResult.error], isTTY)
		}

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

	if (errors && errors.length) {
		const isTTY = !!ts.sys.writeOutputIsTTY && ts.sys.writeOutputIsTTY()
		logDiagnostics(errors, isTTY)
	}

	const program = ts.createProgram({
		options,
		rootNames: fileNames,
		projectReferences,
		host,
	})

	// @ts-ignore https://github.com/Microsoft/TypeScript/issues/1863
	program[excludeKey] = config.exclude

	return program
}

/**
 * Compiles TypeScript files and emits diagnostics if any.
 * @public
 */
export function emit(program: ts.Program, { basePath, clean, copyOtherToOutDir }: EmitOptions = {}) {
	const options = program.getCompilerOptions()
	const { outDir, outFile, rootDir, declarationDir, listFiles, listEmittedFiles, noEmit, pretty } = options

	if (copyOtherToOutDir && !outDir) {
		throw Color.red('Cannot copy: you must define `outDir` in the compiler options')
	}

	if (clean) {
		let targets: string[] = []

		if (Array.isArray(clean)) {
			targets = clean.map((t) => ensureAbsolutePath(t, basePath))
		} else {
			if (clean.outDir && outDir) targets.push(outDir)
			if (clean.outFile && outFile) targets.push(outFile)
			if (clean.declarationDir && declarationDir) targets.push(declarationDir)
		}

		protectSensitiveFolders(targets, rootDir, basePath)
		cleanTargets(targets)
	}

	if (listFiles) {
		console.log('Files to compile:\n' + program.getRootFileNames().join('\n'))
	}

	console.log('Compilation started')
	const { diagnostics, emitSkipped, emittedFiles } = program.emit()

	if (listEmittedFiles && emittedFiles) {
		console.log('Emitted files:\n' + emittedFiles.join('\n'))
	}

	// https://github.com/dsherret/ts-morph/issues/384
	const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics)
	logDiagnostics(allDiagnostics, pretty)

	if (!noEmit && emitSkipped) {
		throw Color.red('Compilation failed')
	}

	if (copyOtherToOutDir) {
		console.log('Copying other files to `outDir`')
		const copiedFiles = copyOtherFiles(program)

		if (listEmittedFiles) {
			console.log('Copied files:\n' + copiedFiles.join('\n'))
		}
	}

	if (allDiagnostics.length) {
		console.log(Color.yellow(`Compilation done with ${allDiagnostics.length} errors`))
	} else {
		console.log(Color.green('Compilation successful'))
	}
}
