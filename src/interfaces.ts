/**
 * Mimics tsconfig.json file content.
 */
export type TsConfig = {
	/** Instructs the TypeScript compiler how to compile .ts files. */
	compilerOptions?: import('typescript').CompilerOptions
	include?: string[]
	exclude?: string[]
	files?: string[]
	extends?: string
	references?: { path: string }[]
	// compileOnSave?: boolean
	// typeAcquisition?: { enable: boolean; include: string[]; exclude: string[] }
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
}
