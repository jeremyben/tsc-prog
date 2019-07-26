import ts from 'typescript'

/**
 * Expose some internal typescript utilities. Probably not a good idea
 * since internal api can change without notice, but it's either that or duplicating.
 */
declare module 'typescript' {
	/**
	 * @param path directory of the tsconfig.json
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L8080-L8139
	 */
	function matchFiles(
		path: string,
		extensions: ReadonlyArray<string> | undefined,
		excludes: ReadonlyArray<string> | undefined,
		includes: ReadonlyArray<string> | undefined,
		useCaseSensitiveFileNames: boolean,
		currentDirectory: string,
		depth: number | undefined,
		getFileSystemEntries: (path: string) => FileSystemEntries,
		realpath: (path: string) => string
	): string[]

	/**
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L8045-L8048
	 */
	interface FileSystemEntries {
		readonly files: ReadonlyArray<string>
		readonly directories: ReadonlyArray<string>
	}

	/**
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L7087-L7105
	 */
	function createCompilerDiagnostic(message: DiagnosticMessage): Diagnostic

	/**
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L7107-L7117
	 */
	function createCompilerDiagnosticFromMessageChain(chain: DiagnosticMessageChain): Diagnostic

	enum ForegroundColorEscapeSequences {
		Grey,
		Red,
		Yellow,
		Blue,
		Cyan,
	}

	interface Program {
		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/program.ts#L982-L1006
		 */
		getCommonSourceDirectory: () => string
	}
}
