import * as ts from 'typescript'
import { EmitOptions } from '../interfaces'

/**
 * @internal
 */
export function print({
	typeDirectivesCollection,
	libDirectivesCollection,
	importsCollection,
	exportsCollection,
	globalsCollection,
	augmentationsCollection,
	extrasCollection,
	newLine,
}: {
	typeDirectivesCollection: Set<string>
	libDirectivesCollection: Set<string>
	importsCollection: Set<string>
	exportsCollection: Map<string, string>
	globalsCollection?: Map<string, string>
	augmentationsCollection?: Set<string>
	extrasCollection?: EmitOptions.Bundle.Extra[]
	newLine?: ts.NewLineKind
}): string {
	const stringBuilder = new StringBuilder(newLine)

	extrasCollection = filterExtras(extrasCollection, [
		typeDirectivesCollection,
		libDirectivesCollection,
		importsCollection,
		exportsCollection,
		globalsCollection,
		augmentationsCollection,
	])

	for (const directive of typeDirectivesCollection) {
		stringBuilder.addLine(directive)
	}
	if (typeDirectivesCollection.size) stringBuilder.addLine()

	for (const directive of libDirectivesCollection) {
		stringBuilder.addLine(directive)
	}
	if (libDirectivesCollection.size) stringBuilder.addLine()

	for (const declaration of importsCollection) {
		stringBuilder.addLine(declaration)
	}
	if (importsCollection.size) stringBuilder.addLine()

	for (const extra of extrasCollection) {
		if (extra.position === 'after-imports') {
			stringBuilder.addLine(extra.declaration).addLine()
		}
	}

	for (const [declaration, comment] of exportsCollection) {
		if (comment) stringBuilder.addLine(comment)
		stringBuilder.addLine(declaration).addLine()
	}

	for (const extra of extrasCollection) {
		if (extra.position === 'after-exports') {
			stringBuilder.addLine(extra.declaration).addLine()
		}
	}

	if (globalsCollection?.size) {
		stringBuilder.addLine('declare global {')

		for (const [declaration, comment] of globalsCollection) {
			if (comment) stringBuilder.addLine(comment)
			stringBuilder.addLine(declaration)
		}

		stringBuilder.addLine('}').addLine()
	}

	if (augmentationsCollection?.size) {
		for (const declaration of augmentationsCollection) {
			stringBuilder.addLine(declaration).addLine()
		}
	}

	stringBuilder.addLine('export {}')

	return stringBuilder.toString()
}

function filterExtras(
	extras: EmitOptions.Bundle.Extra[] | undefined,
	collections: (Set<string> | Map<string, string> | undefined)[]
): EmitOptions.Bundle.Extra[] {
	if (!extras) return []

	const declarationsCollections = collections.map((col) => {
		return col instanceof Set ? Array.from(col) : col instanceof Map ? Array.from(col.values()) : []
	})

	return extras.filter((extra) => {
		return declarationsCollections.every((declarations) => !declarations.includes(extra.declaration))
	})
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
