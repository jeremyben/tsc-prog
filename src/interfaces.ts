export type CompilerOptions = import('typescript').CompilerOptions

export type TsConfig = {
	/**
	 * Instructs the TypeScript compiler how to compile .ts files.
	 */
	compilerOptions?: CompilerOptions

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

export type CreateProgramFromConfigOptions = TsConfig & {
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

export type EmitOptions = {
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
