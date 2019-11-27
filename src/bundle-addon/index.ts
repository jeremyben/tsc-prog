import ts from 'typescript'
import { EmitOptions } from '../interfaces'
import { Color } from '../utils/log'
import { join } from 'path'
import { collectDirectives } from './directive-collector'
import { SymbolCollector } from './symbol-collector'
import { DeclarationCollector } from './declaration-collector'
import { print } from './printer'
import { ensureAbsolutePath } from '../utils/path'

/**
 * @internal
 */
export function getDtsInterceptor(dtsCache: Map<string, string>) {
	// https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/program.ts#L151-L171

	const writeFile: ts.WriteFileCallback = (fileName, data, writeByteOrderMark, onError, sourceFiles) => {
		try {
			if (fileName.endsWith(ts.Extension.Dts) || fileName.endsWith('.d.ts.map')) {
				dtsCache.set(fileName, data)
			} else {
				ts.sys.writeFile(fileName, data, writeByteOrderMark)
			}
		} catch (err) {
			if (onError) onError(err.message)
		}
	}

	return writeFile
}

/**
 * @internal
 */
export function bundleDts(
	program: ts.Program,
	dtsCache: Map<string, string>,
	{ entryPoint, fallbackOnError = true }: Required<EmitOptions>['bundleDeclaration']
) {
	const dtsOutDir = getDtsOutDir(program)
	const dtsProgram = createDtsProgram(program, dtsCache)
	const dtsOptions = dtsProgram.getCompilerOptions()

	let entryPoints = typeof entryPoint === 'string' ? [entryPoint] : entryPoint
	entryPoints = entryPoints.map((ep) => {
		ep = ep.replace(/(\.js|\.ts|\.d\.ts)$/m, '.d.ts')
		return ensureAbsolutePath(ep, dtsOutDir)
	})

	try {
		// Retrieve all bundles before writing them, to fail on error before any IO.
		entryPoints
			.map((path) => {
				const entryFile = dtsProgram.getSourceFile(path)
				if (!entryFile) throw Error('Unable to load entry point:' + path)

				const directives = collectDirectives(dtsProgram)
				const symbols = new SymbolCollector(entryFile, dtsProgram)
				const { declarations } = new DeclarationCollector(symbols, entryFile, dtsProgram)

				const bundled = print(
					[directives.typeRef, directives.libRef, declarations.imports, declarations.exports],
					dtsOptions.newLine
				)

				return [path, bundled] as const
			})
			.forEach(([path, bundled]) => ts.sys.writeFile(path, bundled))

		if (dtsOptions.listEmittedFiles) {
			console.log('Emitted files:\n' + entryPoints.join('\n'))
		}
	} catch (error) {
		if (!fallbackOnError) throw Color.red(error)

		console.error(Color.red(error.stack))
		console.log('Fallback to original declaration files')

		dtsCache.forEach((data, path) => ts.sys.writeFile(path, data))

		if (dtsOptions.listEmittedFiles) {
			console.log('Emitted files:\n' + Array.from(dtsCache.keys()).join('\n'))
		}
	}
}

/**
 * @internal
 */
function createDtsProgram(program: ts.Program, dtsCache: Map<string, string>): ts.Program {
	const options = program.getCompilerOptions()

	// https://stackoverflow.com/a/53764522/4776628
	const host = ts.createCompilerHost(options, true)

	const readFile0 = host.readFile
	host.readFile = (fileName) => {
		if (dtsCache.has(fileName)) return dtsCache.get(fileName)!
		return readFile0.call(host, fileName)
	}

	const fileExists0 = host.fileExists
	host.fileExists = (fileName) => {
		if (dtsCache.has(fileName)) return true
		return fileExists0.call(host, fileName)
	}

	const getSourceFile0 = host.getSourceFile
	host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
		if (dtsCache.has(fileName)) {
			return ts.createSourceFile(
				fileName,
				dtsCache.get(fileName)!,
				options.target || /* default */ ts.ScriptTarget.ES5,
				true,
				ts.ScriptKind.TS
			)
		}
		return getSourceFile0.call(host, fileName, languageVersion, onError, shouldCreate)
	}

	const rootNames = Array.from(dtsCache.keys())

	return ts.createProgram({ rootNames, options, host })
}

/**
 * Declaration output folder is either `declarationDir`, `outDir`, or the original root folder.
 * @internal
 */
function getDtsOutDir(program: ts.Program): string {
	const { declarationDir, outDir } = program.getCompilerOptions()
	return declarationDir || outDir || program.getCommonSourceDirectory()
}
