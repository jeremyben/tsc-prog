import ts from 'typescript'

/**
 * Log compiler diagnostics to stderr.
 * @internal
 */
export function logDiagnostics(diagnostics: ts.Diagnostic[], better = false) {
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
 * @internal
 */
export function grey(text: string) {
	return formatColor(text, EscapeSequence.Grey)
}

/**
 * @internal
 */
export function red(text: string) {
	return formatColor(text, EscapeSequence.Red)
}

/**
 * @internal
 */
export function green(text: string) {
	return formatColor(text, EscapeSequence.Green)
}

/**
 * @internal
 */
export function yellow(text: string) {
	return formatColor(text, EscapeSequence.Yellow)
}

/**
 * @internal
 */
export function blue(text: string) {
	return formatColor(text, EscapeSequence.Blue)
}

/**
 * @internal
 */
export function magenta(text: string) {
	return formatColor(text, EscapeSequence.Magenta)
}

/**
 * @internal
 */
export function cyan(text: string) {
	return formatColor(text, EscapeSequence.Cyan)
}

/**
 * Apply foreground color to text.
 * @internal
 */
function formatColor(text: string, color: EscapeSequence) {
	return color + text + EscapeSequence.Reset
}

/**
 * Foreground color escape sequences.
 * Taken from https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/program.ts#L368
 */
enum EscapeSequence {
	Grey = '\u001b[90m',
	Red = '\u001b[91m',
	Green = '\u001b[92m',
	Yellow = '\u001b[93m',
	Blue = '\u001b[94m',
	Magenta = '\u001b[95m',
	Cyan = '\u001b[96m',
	Reset = '\u001b[0m',
}
