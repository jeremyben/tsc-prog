import ts from 'typescript'
import { CreateProgramFromConfigOptions, TsConfig, EmitOptions } from './interfaces'
import { ensureAbsolutePath } from './path.utils'
import cleanTargets from './clean-addon'

/**
 * Compile ts files by creating a compilation object using the compiler API and emitting js files.
 * @public
 */
export function build(options: CreateProgramFromConfigOptions & EmitOptions) {
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
	extends: extend,
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

	// config.compilerOptions = Object.assign({}, config.compilerOptions, compilerOptions)
	if (include) config.include = include
	if (exclude) config.exclude = exclude
	if (files) config.files = files
	if (extend) config.extends = extend
	if (references) config.references = references

	const { options, fileNames, projectReferences, errors } = ts.parseJsonConfigFileContent(
		config,
		ts.sys,
		basePath,
		compilerOptions,
		configFilePath
	)

	logDiagnostics(errors, true)

	normalizeOptionValues(options, basePath)

	const program = ts.createProgram({
		options,
		rootNames: fileNames,
		projectReferences,
	})

	return program
}

/**
 * Compile Typescript files and emit diagnostics if any, throws an error if it fails.
 * @public
 */
export function emit(program: ts.Program, { betterDiagnostics, clean, basePath }: EmitOptions = {}) {
	if (clean) {
		const compilerOptions = program.getCompilerOptions()
		cleanTargets(clean, compilerOptions, basePath)
	}

	console.log('Compilation started')
	const { diagnostics, emitSkipped } = program.emit()

	// https://github.com/dsherret/ts-morph/issues/384
	const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics)

	logDiagnostics(allDiagnostics, betterDiagnostics)

	if (emitSkipped) throw Error('Compilation failed')

	console.log('Compilation successful')
}

/**
 * Log compiler diagnostics to stderr.
 * @internal
 */
function logDiagnostics(diagnostics: ts.Diagnostic[], better = false) {
	if (!diagnostics.length) return

	const formatHost: ts.FormatDiagnosticsHost = {
		getCanonicalFileName: (path) => path,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		getNewLine: () => ts.sys.newLine,
	}

	const message = better
		? ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)
		: ts.formatDiagnostics(diagnostics, formatHost)

	console.warn(message)
}

/**
 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/commandLineParser.ts#L2528
 * @internal
 */
function normalizeOptionValues(options: ts.CompilerOptions, basePath: string) {
	// https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/commandLineParser.ts#L76
	const pathOptions = [
		'outFile',
		'outDir',
		'rootDir',
		'tsBuildInfoFile',
		'baseUrl',
		'rootDirs',
		'typeRoots',
		'declarationDir',
	]

	for (const o of pathOptions) {
		if (options[o] == null) continue

		options[o] = Array.isArray(options[o])
			? (options[o] as string[]).map((value) => ensureAbsolutePath(value, basePath))
			: ensureAbsolutePath(options[o] as string, basePath)
	}
}
