export interface CreateProgramFromConfigOptions extends TsConfig {
	/**
	 * A root directory to resolve relative path entries in the config file to.
	 */
	basePath: string
	/**
	 * Config file to look for and inherit from.
	 * Either an absolute path or relative to `basePath`.
	 */
	configFilePath?: string
}

export interface EmitOptions {
	/**
	 * Format diagnostics with colors and context, instead of single lines.
	 */
	betterDiagnostics?: boolean

	/**
	 * List of files or folders to recursively delete before compilation :
	 * accepts absolute paths or relative to `basePath`.
	 *
	 * Also accepts a map of common compiler options targets.
	 */
	clean?: string[] | { outDir?: true; outFile?: true; declarationDir?: true }

	/**
	 * A root directory to resolve relative paths in the `clean` option to.
	 */
	basePath?: string
}

/**
 * Mimicks part of tsconfig.json file.
 *
 * Retrieved with the help of:
 * https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/tsconfig.json
 * and
 * https://app.quicktype.io?share=EJs8p76127qNWGILyTBD
 */
export interface TsConfig {
	/**
	 * Instructs the TypeScript compiler how to compile .ts files.
	 */
	compilerOptions?: TsConfigCompilerOptions

	/**
	 * Specifies a list of glob patterns that match files to be included in compilation.
	 * If no 'files' or 'include' property is present in a tsconfig.json, the compiler
	 * defaults to including all files in the containing directory and subdirectories
	 * except those specified by 'exclude'.
	 */
	include?: string[]

	/**
	 * Specifies a list of files to be excluded from compilation.
	 * The 'exclude' property only affects the files included via the 'include' property
	 * and not the 'files' property.
	 */
	exclude?: string[]

	/**
	 * If no 'files' or 'include' property is present in a tsconfig.json, the compiler
	 * defaults to including all files in the containing directory and subdirectories
	 * except those specified by 'exclude'. When a 'files' property is specified,
	 * only those files and those specified by 'include' are included.
	 */
	files?: string[]

	/**
	 * Path to base configuration file to inherit from.
	 */
	extends?: string

	/**
	 * Referenced projects.
	 */
	references?: Array<{
		/** Path to referenced tsconfig or to folder containing tsconfig */
		path: string
	}>
}

/**
 * Instructs the TypeScript compiler how to compile .ts files.
 */
export interface TsConfigCompilerOptions {
	/**
	 * Allow javascript files to be compiled.
	 */
	allowJs?: boolean
	/**
	 * Allow default imports from modules with no default export. This does not affect code
	 * emit, just typechecking.
	 */
	allowSyntheticDefaultImports?: boolean
	/**
	 * Allow accessing UMD globals from modules.
	 */
	allowUmdGlobalAccess?: boolean
	/**
	 * Do not report errors on unreachable code.
	 */
	allowUnreachableCode?: boolean
	/**
	 * Do not report errors on unused labels.
	 */
	allowUnusedLabels?: boolean
	/**
	 * Parse in strict mode and emit 'use strict' for each source file. Requires TypeScript
	 * version 2.1 or later.
	 */
	alwaysStrict?: boolean
	/**
	 * Base directory to resolve non-relative module names.
	 */
	baseUrl?: string
	/**
	 * The character set of the input files.
	 */
	charset?: string
	/**
	 * Report errors in .js files. Requires TypeScript version 2.3 or later.
	 */
	checkJs?: boolean
	/**
	 * Enables building for project references.
	 */
	composite?: boolean
	/**
	 * Generates corresponding d.ts files.
	 */
	declaration?: boolean
	/**
	 * Specify output directory for generated declaration files. Requires TypeScript version 2.0
	 * or later.
	 */
	declarationDir?: string
	/**
	 * Generates a sourcemap for each corresponding '.d.ts' file. Requires TypeScript version
	 * 2.9 or later.
	 */
	declarationMap?: boolean
	/**
	 * Show diagnostic information.
	 */
	diagnostics?: boolean
	/**
	 * Disable size limit for JavaScript project. Requires TypeScript version 2.0 or later.
	 */
	disableSizeLimit?: boolean
	/**
	 * Provide full support for iterables in 'for-of', spread, and destructuring when targeting
	 * 'ES5' or 'ES3'. Requires TypeScript version 2.3 or later.
	 */
	downlevelIteration?: boolean
	/**
	 * Emit a UTF-8 Byte Order Mark (BOM) in the beginning of output files.
	 */
	emitBOM?: boolean
	/**
	 * Only emit '.d.ts' declaration files.
	 */
	emitDeclarationOnly?: boolean
	/**
	 * Emit design-type metadata for decorated declarations in source.
	 */
	emitDecoratorMetadata?: boolean
	/**
	 * Emit '__importStar' and '__importDefault' helpers for runtime babel ecosystem
	 * compatibility and enable '--allowSyntheticDefaultImports' for typesystem compatibility.
	 * Requires TypeScript version 2.7 or later.
	 */
	esModuleInterop?: boolean
	/**
	 * Enables experimental support for ES7 decorators.
	 */
	experimentalDecorators?: boolean
	/**
	 * Disallow inconsistently-cased references to the same file.
	 */
	forceConsistentCasingInFileNames?: boolean
	/**
	 * Import emit helpers (e.g. '__extends', '__rest', etc..) from tslib. Requires TypeScript
	 * version 2.1 or later.
	 */
	importHelpers?: boolean
	/**
	 * Enable incremental compilation.
	 */
	incremental?: boolean
	/**
	 * Emit a single file with source maps instead of having a separate file.
	 */
	inlineSourceMap?: boolean
	/**
	 * Emit the source alongside the sourcemaps within a single file; requires --inlineSourceMap
	 * to be set.
	 */
	inlineSources?: boolean
	/**
	 * Unconditionally emit imports for unresolved files.
	 */
	isolatedModules?: boolean
	/**
	 * Specify JSX code generation: 'preserve', 'react', or 'react-native'.
	 */
	jsx?: 'preserve' | 'react' | 'react-native'
	/**
	 * Specify the JSX factory function to use when targeting react JSX emit, e.g.
	 * 'React.createElement' or 'h'. Requires TypeScript version 2.1 or later.
	 */
	jsxFactory?: string
	/**
	 * Resolve 'keyof' to string valued property names only (no numbers or symbols). Requires
	 * TypeScript version 2.9 or later.
	 */
	keyofStringsOnly?: boolean
	/**
	 * Specify library file to be included in the compilation. Requires TypeScript version 2.0
	 * or later.
	 */
	lib?: Array<
		| 'dom'
		| 'dom.iterable'
		| 'es2015'
		| 'es2015.collection'
		| 'es2015.core'
		| 'es2015.generator'
		| 'es2015.iterable'
		| 'es2015.promise'
		| 'es2015.proxy'
		| 'es2015.reflect'
		| 'es2015.symbol'
		| 'es2015.symbol.wellknown'
		| 'es2016'
		| 'es2016.array.include'
		| 'es2017'
		| 'es2017.intl'
		| 'es2017.object'
		| 'es2017.sharedmemory'
		| 'es2017.string'
		| 'es2017.typedarrays'
		| 'es2018'
		| 'es2018.asynciterable'
		| 'es2018.intl'
		| 'es2018.promise'
		| 'es2018.regexp'
		| 'es2019'
		| 'es2019.array'
		| 'es2019.object'
		| 'es2019.string'
		| 'es2019.symbol'
		| 'es2020'
		| 'es2020.string'
		| 'es2020.symbol.wellknown'
		| 'es5'
		| 'es6'
		| 'es7'
		| 'esnext'
		| 'esnext.array'
		| 'esnext.asynciterable'
		| 'esnext.bigint'
		| 'esnext.intl'
		| 'esnext.symbol'
		| 'scripthost'
		| 'webworker'
		| 'webworker.importscripts'
	>
	/**
	 * Enable to list all emitted files. Requires TypeScript version 2.0 or later.
	 */
	listEmittedFiles?: boolean
	/**
	 * Print names of files part of the compilation.
	 */
	listFiles?: boolean
	/**
	 * Specifies the location where debugger should locate map files instead of generated
	 * locations
	 */
	mapRoot?: string
	/**
	 * The maximum dependency depth to search under node_modules and load JavaScript files. Only
	 * applicable with --allowJs.
	 */
	maxNodeModuleJsDepth?: number
	/**
	 * Specify module code generation.
	 */
	module?: 'none' | 'commonjs' | 'amd' | 'system' | 'umd' | 'es2015' | 'esnext'
	/**
	 * Specifies module resolution strategy: 'node' (Node) or 'classic' (TypeScript pre 1.6) .
	 */
	moduleResolution?: 'node' | 'classic'
	/**
	 * Specifies the end of line sequence to be used when emitting files: 'CRLF' (dos) or 'LF'
	 * (unix).
	 */
	newLine?: 'CRLF' | 'LF'
	/**
	 * Do not emit output.
	 */
	noEmit?: boolean
	/**
	 * Do not generate custom helper functions like __extends in compiled output.
	 */
	noEmitHelpers?: boolean
	/**
	 * Do not emit outputs if any type checking errors were reported.
	 */
	noEmitOnError?: boolean
	/**
	 * Do not truncate error messages.
	 */
	noErrorTruncation?: boolean
	/**
	 * Report errors for fallthrough cases in switch statement.
	 */
	noFallthroughCasesInSwitch?: boolean
	/**
	 * Warn on expressions and declarations with an implied 'any' type.
	 */
	noImplicitAny?: boolean
	/**
	 * Report error when not all code paths in function return a value.
	 */
	noImplicitReturns?: boolean
	/**
	 * Raise error on 'this' expressions with an implied any type.
	 */
	noImplicitThis?: boolean
	/**
	 * Do not emit 'use strict' directives in module output.
	 */
	noImplicitUseStrict?: boolean
	/**
	 * Do not include the default library file (lib.d.ts).
	 */
	noLib?: boolean
	/**
	 * Do not add triple-slash references or module import targets to the list of compiled files.
	 */
	noResolve?: boolean
	/**
	 * Disable strict checking of generic signatures in function types.
	 */
	noStrictGenericChecks?: boolean
	/**
	 * Report errors on unused locals. Requires TypeScript version 2.0 or later.
	 */
	noUnusedLocals?: boolean
	/**
	 * Report errors on unused parameters. Requires TypeScript version 2.0 or later.
	 */
	noUnusedParameters?: boolean
	/**
	 * Redirect output structure to the directory.
	 */
	outDir?: string
	/**
	 * Concatenate and emit output to single file.
	 */
	outFile?: string
	/**
	 * Specify path mapping to be computed relative to baseUrl option.
	 */
	paths?: { [key: string]: string[] }
	/**
	 * List of TypeScript language server plugins to load. Requires TypeScript version 2.3 or
	 * later.
	 */
	plugins?: Array<{
		/** Plugin name. */
		name?: string
	}>
	/**
	 * Do not erase const enum declarations in generated code.
	 */
	preserveConstEnums?: boolean
	/**
	 * Do not resolve symlinks to their real path; treat a symlinked file like a real one.
	 */
	preserveSymlinks?: boolean
	/**
	 * Keep outdated console output in watch mode instead of clearing the screen.
	 */
	preserveWatchOutput?: boolean
	/**
	 * Stylize errors and messages using color and context (experimental).
	 */
	pretty?: boolean
	/**
	 * Specifies the object invoked for createElement and __spread when targeting 'react' JSX
	 * emit.
	 */
	reactNamespace?: string
	/**
	 * Do not emit comments to output.
	 */
	removeComments?: boolean
	/**
	 * Include modules imported with '.json' extension. Requires TypeScript version 2.9 or later.
	 */
	resolveJsonModule?: boolean
	/**
	 * Specifies the root directory of input files. Use to control the output directory
	 * structure with --outDir.
	 */
	rootDir?: string
	/**
	 * Specify list of root directories to be used when resolving modules.
	 */
	rootDirs?: string[]
	/**
	 * Skip type checking of declaration files. Requires TypeScript version 2.0 or later.
	 */
	skipLibCheck?: boolean
	skipDefaultLibCheck?: boolean
	/**
	 * Generates corresponding '.map' file.
	 */
	sourceMap?: boolean
	/**
	 * Specifies the location where debugger should locate TypeScript files instead of source
	 * locations.
	 */
	sourceRoot?: string
	/**
	 * Enable all strict type checking options. Requires TypeScript version 2.3 or later.
	 */
	strict?: boolean
	/**
	 * Enable stricter checking of of the `bind`, `call`, and `apply` methods on functions.
	 */
	strictBindCallApply?: boolean
	/**
	 * Disable bivariant parameter checking for function types. Requires TypeScript version 2.6
	 * or later.
	 */
	strictFunctionTypes?: boolean
	/**
	 * Enable strict null checks. Requires TypeScript version 2.0 or later.
	 */
	strictNullChecks?: boolean
	/**
	 * Ensure non-undefined class properties are initialized in the constructor. Requires
	 * TypeScript version 2.7 or later.
	 */
	strictPropertyInitialization?: boolean
	/**
	 * Do not emit declarations for code that has an '@internal' annotation.
	 */
	stripInternal?: boolean
	/**
	 * Suppress excess property checks for object literals.
	 */
	suppressExcessPropertyErrors?: boolean
	/**
	 * Suppress noImplicitAny errors for indexing objects lacking index signatures.
	 */
	suppressImplicitAnyIndexErrors?: boolean
	/**
	 * Specify ECMAScript target version. Permitted values are 'es3', 'es5', 'es6', 'es2015',
	 * 'es2016', 'es2017', 'es2018', 'es2019', 'es2020' or 'esnext'.
	 */
	target?: 'es3' | 'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'esnext'
	/**
	 * Enable tracing of the name resolution process.
	 */
	traceResolution?: boolean
	/**
	 * Specify file to store incremental compilation information.
	 */
	tsBuildInfoFile?: string
	/**
	 * Specify list of directories for type definition files to be included. Requires TypeScript
	 * version 2.0 or later.
	 */
	typeRoots?: string[]
	/**
	 * Type declaration files to be included in compilation. Requires TypeScript version 2.0 or
	 * later.
	 */
	types?: string[]
	/**
	 * Watch input files.
	 */
	// watch?: boolean
}

enum CompilerTarget {
	Es3 = 'es3',
	Es5 = 'es5',
	Es6 = 'es6',
	Es2015 = 'es2015',
	Es2016 = 'es2016',
	Es2017 = 'es2017',
	Es2018 = 'es2018',
	Es2019 = 'es2019',
	Es2020 = 'es2020',
	Esnext = 'esnext',
}

enum CompilerLib {
	DOM = 'dom',
	DOMIterable = 'dom.iterable',
	Es2015 = 'es2015',
	Es2015Collection = 'es2015.collection',
	Es2015Core = 'es2015.core',
	Es2015Generator = 'es2015.generator',
	Es2015Iterable = 'es2015.iterable',
	Es2015Promise = 'es2015.promise',
	Es2015Proxy = 'es2015.proxy',
	Es2015Reflect = 'es2015.reflect',
	Es2015Symbol = 'es2015.symbol',
	Es2015SymbolWellknown = 'es2015.symbol.wellknown',
	Es2016 = 'es2016',
	Es2016ArrayInclude = 'es2016.array.include',
	Es2017 = 'es2017',
	Es2017Intl = 'es2017.intl',
	Es2017Object = 'es2017.object',
	Es2017Sharedmemory = 'es2017.sharedmemory',
	Es2017String = 'es2017.string',
	Es2017Typedarrays = 'es2017.typedarrays',
	Es2018 = 'es2018',
	Es2018Asynciterable = 'es2018.asynciterable',
	Es2018Intl = 'es2018.intl',
	Es2018Promise = 'es2018.promise',
	Es2018Regexp = 'es2018.regexp',
	Es2019 = 'es2019',
	Es2019Array = 'es2019.array',
	Es2019Object = 'es2019.object',
	Es2019String = 'es2019.string',
	Es2019Symbol = 'es2019.symbol',
	Es2020 = 'es2020',
	Es2020String = 'es2020.string',
	Es2020SymbolWellknown = 'es2020.symbol.wellknown',
	Es5 = 'es5',
	Es6 = 'es6',
	Es7 = 'es7',
	Esnext = 'esnext',
	EsnextArray = 'esnext.array',
	EsnextAsynciterable = 'esnext.asynciterable',
	EsnextBigint = 'esnext.bigint',
	EsnextIntl = 'esnext.intl',
	EsnextSymbol = 'esnext.symbol',
	Scripthost = 'scripthost',
	Webworker = 'webworker',
	WebworkerImportscripts = 'webworker.importscripts',
}
