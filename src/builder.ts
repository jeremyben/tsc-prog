import * as ts from 'typescript'
import { CreateProgramFromConfigOptions, TsConfig, EmitOptions, BuildOptions } from './interfaces'
import { ensureAbsolutePath } from './utils/path'
import { logDiagnostics, Color } from './utils/log'
import cleanTargets, { protectSensitiveFolders } from './clean-addon'
import copyOtherFiles, { excludeKey } from './copy-addon'
import { bundleDts, getDtsInterceptor } from './bundle-addon'

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

	// https://github.com/Microsoft/TypeScript/issues/1863
	;(program as any)[excludeKey] = config.exclude

	return program
}

/**
 * Compiles TypeScript files and emits diagnostics if any.
 * @public
 */
export function emit(program: ts.Program, { basePath, clean, copyOtherToOutDir, bundleDeclaration }: EmitOptions = {}) {
	const options = program.getCompilerOptions()

	if (copyOtherToOutDir && !options.outDir) {
		throw Color.red('Cannot copy: you must define `outDir` in the compiler options')
	}

	// Write .d.ts files to an in memory Map in case of bundling.
	const dtsCache = new Map<string, string>()
	let dtsInterceptor: ts.WriteFileCallback | undefined

	if (bundleDeclaration) {
		if (!options.declaration) {
			throw Color.red('Cannot bundle declarations: you must turn `declaration` on in the compiler options')
		}
		if (options.declarationMap) {
			console.warn(Color.yellow("`declarationMap` won't work with declaration bundling"))
		}

		dtsInterceptor = getDtsInterceptor(dtsCache)
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

	if (options.listFiles) {
		console.log('Files to compile:\n' + program.getRootFileNames().join('\n'))
	}

	console.log('Compilation started')
	// tslint:disable-next-line: prefer-const
	let { diagnostics, emitSkipped, emittedFiles } = program.emit(undefined, dtsInterceptor)

	if (options.listEmittedFiles && emittedFiles) {
		if (bundleDeclaration) {
			emittedFiles = emittedFiles.filter((path) => !dtsCache.has(path))
		}
		console.log('Emitted files:\n' + emittedFiles.join('\n'))
	}

	// https://github.com/dsherret/ts-morph/issues/384
	const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(diagnostics)
	logDiagnostics(allDiagnostics, options.pretty)

	if (!options.noEmit && emitSkipped) {
		throw Color.red('Compilation failed')
	}

	if (copyOtherToOutDir) {
		console.log('Copying other files to `outDir`')
		const copiedFiles = copyOtherFiles(program)

		if (options.listEmittedFiles) {
			console.log('Copied files:\n' + copiedFiles.join('\n'))
		}
	}

	if (bundleDeclaration) {
		console.log('Bundling declarations')
		bundleDts(program, dtsCache, bundleDeclaration)
	}

	if (allDiagnostics.length) {
		console.log(Color.yellow(`Compilation done with ${allDiagnostics.length} errors`))
	} else {
		console.log(Color.green('Compilation successful'))
	}
}
