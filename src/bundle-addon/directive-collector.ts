import * as ts from 'typescript'

/**
 * Retrieves possible directives from all internal files of the program.
 * @internal
 */
export function collectDirectives(program: ts.Program) {
	const typeRef = new Set<string>()
	const libRef = new Set<string>()

	for (const fileName of program.getRootFileNames()) {
		const sourceFile = program.getSourceFile(fileName)!

		for (const trd of sourceFile.typeReferenceDirectives) {
			// const name = sourceFile.text.substring(trd.pos, trd.end)
			typeRef.add(`/// <reference types="${trd.fileName}" />`)
		}

		for (const lrd of sourceFile.libReferenceDirectives) {
			libRef.add(`/// <reference lib="${lrd.fileName}" />`)
		}
	}

	return { typeRef, libRef }
}
