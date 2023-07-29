import * as ts from 'typescript'
import { isExternalLibraryAugmentation } from './syntax-check'

/**
 * Retrieves external module augmentations.
 * `declare module 'lib' {}`
 * @internal
 */
export function collectExternalAugmentations(program: ts.Program) {
	const augmentations = new Set<string>()

	nextSourceFile: for (const fileName of program.getRootFileNames()) {
		const sourceFile = program.getSourceFile(fileName)!

		// Ambient file
		if (!sourceFile.externalModuleIndicator) {
			for (const statement of sourceFile.statements) {
				// There can't be any `declare global` or `declare "./relative-module"` in ambient context.
				// - TS2669: Augmentations for the global scope can only be directly nested in external modules or ambient module declarations.
				// - TS2436: Ambient module declaration cannot specify relative module name.
				if (isExternalLibraryAugmentation(statement)) {
					augmentations.add(statement.getText())
				}
			}

			continue nextSourceFile
		}

		// Module file
		for (const node of sourceFile.moduleAugmentations || []) {
			if (isExternalLibraryAugmentation(node.parent)) {
				augmentations.add(node.parent.getText())
			}
		}
	}

	return augmentations
}
