import ts from 'typescript'

/**
 * Expose some internal typescript utilities. Probably not a good idea
 * since internal api can change without notice, but it's either that or duplicating.
 */
declare module 'typescript' {
	/**
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L7087-L7105
	 * @internal
	 */
	function createCompilerDiagnostic(message: DiagnosticMessage): Diagnostic

	/**
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L7107-L7117
	 * @internal
	 */
	function createCompilerDiagnosticFromMessageChain(chain: DiagnosticMessageChain): Diagnostic

	interface CompilerOptions {
		listFiles?: boolean
		listEmittedFiles?: boolean
		pretty?: boolean
	}

	interface Program {
		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/program.ts#L984-L1008
		 * @internal
		 */
		getCommonSourceDirectory: () => string
	}
}
