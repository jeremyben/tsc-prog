import ts from 'typescript'

/**
 * @internal
 */
export function print(collections: (Set<string> | Map<string, string>)[], newLine?: ts.NewLineKind): string {
	const stringBuilder = new StringBuilder(newLine)

	for (const collection of collections) {
		if (collection instanceof Set) {
			for (const declaration of collection) stringBuilder.addLine(declaration)
			if (collection.size) stringBuilder.addLine()
		}

		if (collection instanceof Map) {
			for (const [declaration, comment] of collection) {
				if (comment) stringBuilder.addLine(comment)
				stringBuilder.addLine(declaration).addLine()
			}
		}
	}

	stringBuilder.addLine('export {}')

	return stringBuilder.toString()
}

/**
 * Allows a large text string to be constructed incrementally by appending small chunks.
 * The final string can be obtained by calling StringBuilder.toString().
 *
 * A naive approach might use the `+=` operator to append strings:
 * This would have the downside of copying the entire string each time a chunk is appended.
 *
 * @internal
 */
class StringBuilder {
	private chunks: string[] = []
	private newLine: '\n' | '\r\n'

	constructor(newLineKind?: ts.NewLineKind) {
		this.newLine =
			newLineKind === ts.NewLineKind.CarriageReturnLineFeed
				? '\r\n'
				: newLineKind === ts.NewLineKind.LineFeed
				? '\n'
				: (ts.sys.newLine as '\r\n' | '\n')
	}

	add(text: string) {
		this.chunks.push(text)
		return this
	}

	addLine(text: string = '') {
		if (text.length > 0) this.add(text)
		return this.add(this.newLine)
	}

	toString(): string {
		if (this.chunks.length === 0) return ''

		if (this.chunks.length > 1) {
			const joined = this.chunks.join('')
			this.chunks.length = 1
			this.chunks[0] = joined
		}

		return this.chunks[0]
	}
}
