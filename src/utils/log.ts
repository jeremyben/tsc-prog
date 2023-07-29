import * as ts from 'typescript'

/**
 * Log compiler diagnostics to stderr.
 * @internal
 */
export function logDiagnostics(diagnostics: ts.Diagnostic[], pretty = false) {
	if (!diagnostics.length) return

	const formatHost: ts.FormatDiagnosticsHost = {
		getCanonicalFileName: (path) => path,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		getNewLine: () => ts.sys.newLine,
	}

	const message = pretty
		? ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)
		: ts.formatDiagnostics(diagnostics, formatHost)

	console.warn(message)
}

/**
 * @internal
 */
export namespace Color {
	const isTTY = !!ts.sys.writeOutputIsTTY && ts.sys.writeOutputIsTTY()

	export const grey = (text: string) => (isTTY ? EscSeq.Grey + text + EscSeq.Reset : text)

	export const red = (text: string) => (isTTY ? EscSeq.Red + text + EscSeq.Reset : text)

	export const green = (text: string) => (isTTY ? EscSeq.Green + text + EscSeq.Reset : text)

	export const yellow = (text: string) => (isTTY ? EscSeq.Yellow + text + EscSeq.Reset : text)

	export const blue = (text: string) => (isTTY ? EscSeq.Blue + text + EscSeq.Reset : text)

	export const magenta = (text: string) => (isTTY ? EscSeq.Magenta + text + EscSeq.Reset : text)

	export const cyan = (text: string) => (isTTY ? EscSeq.Cyan + text + EscSeq.Reset : text)

	/**
	 * Foreground color escape sequences.
	 * Taken from https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/program.ts#L368
	 */
	enum EscSeq {
		Grey = '\u001b[90m',
		Red = '\u001b[91m',
		Green = '\u001b[92m',
		Yellow = '\u001b[93m',
		Blue = '\u001b[94m',
		Magenta = '\u001b[95m',
		Cyan = '\u001b[96m',
		Reset = '\u001b[0m',
	}
}
