import ts from 'typescript'
import { strictEqual } from 'assert'
import { Color } from '../utils/log'
import { EitherOne } from '../utils/manipulation'
import { getModifier, getNextKeyword, getDeclarationIdentifier } from './syntax-retrieval'
import { isTopLevelVariableDeclaration } from './syntax-check'

/**
 * @internal
 */
export type Replacement = {
	replace: ts.Node
	by: string
}

/**
 * Registrar dedicated to the actual storage of bundled declarations.
 * To use with the Declaration Collector.
 * @internal
 */
export class DeclarationRegistrar {
	imports: Set<string>
	exports: Map<string, string>
	globals: Map<string, string>

	constructor() {
		this.imports = new Set<string>()
		this.exports = new Map<string, string>()
		this.globals = new Map<string, string>()
	}

	registerInternal(
		origSymbol: ts.Symbol,
		options: {
			export: boolean
			default: boolean
			newName?: ts.__String | string
			symbolReplacements?: Replacement[][]
		}
	) {
		const isNamespace = origSymbol.declarations.some(ts.isSourceFile)
		if (isNamespace) {
			throw Error(`File ${origSymbol.escapedName} is imported as a namespace, and thus can't be bundled.`)
		}

		const { export: exportKeyword, default: defaultKeyword, newName, symbolReplacements = [] } = options

		// tslint:disable-next-line: prefer-for-of
		for (let index = 0; index < origSymbol.declarations.length; index++) {
			const declaration = origSymbol.declarations[index]
			const declarationReplacements = symbolReplacements[index]

			const declarationText = this.getDeclarationText(declaration, {
				newName,
				replacements: declarationReplacements,
				exportKeyword,
				defaultKeyword,
			})

			const jsdocText = this.getJSDocComment(declaration)

			this.exports.set(declarationText, jsdocText)
		}
	}

	registerAlias(name: ts.__String, alias?: EitherOne<{ as: ts.__String; default: true }>): void {
		if (alias && alias.as != null) {
			this.exports.set(`export { ${name} as ${alias.as} };`, '')
		} else if (alias && alias.default) {
			this.exports.set(`export default ${name};`, '')
		} else {
			this.exports.set(`export { ${name} };`, '')
		}
	}

	/**
	 * Don't bundle original declarations from external libraries or from JSON files (with `resolveJsonModule`).
	 */
	registerExternal(
		symbol: ts.Symbol,
		importKind: ts.SyntaxKind,
		importName: ts.__String,
		modulePath: string,
		reExport = false
	): void {
		const name = symbol.escapedName

		if (symbol.declarations.length > 1) {
			console.warn(Color.yellow(`External/Json symbol with multiple/merged declarations not supported: ${name}`))
		}

		switch (importKind) {
			case ts.SyntaxKind.ExportSpecifier:
			case ts.SyntaxKind.ImportSpecifier:
				// Same name than imported name or default export.
				if (name === importName || name === ts.InternalSymbolName.Default) {
					this.imports.add(`import { ${importName} } from "${modulePath}";`)
				}
				// Different name than imported name.
				else {
					this.imports.add(`import { ${importName} as ${name} } from "${modulePath}";`)
				}
				break

			case ts.SyntaxKind.ImportClause: // default import
				this.imports.add(`import ${importName} from "${modulePath}";`)
				break

			case ts.SyntaxKind.NamespaceImport:
				this.imports.add(`import * as ${importName} from "${modulePath}";`)
				break

			case ts.SyntaxKind.ImportEqualsDeclaration:
				this.imports.add(`import ${importName} = require("${modulePath}");`)
				break

			default:
				throw Error(`External/Json import not handled: ${importName} from "${modulePath}", kind: ${importKind}`)
		}

		if (reExport) {
			if (name === ts.InternalSymbolName.Default) {
				this.exports.set(`export default ${importName};`, '')
			} else {
				this.exports.set(`export { ${name} };`, '')
			}
		}
	}

	registerStar(modulePath: string) {
		this.exports.set(`export * from "${modulePath}";`, '')
	}

	registerGlobal(origSymbol: ts.Symbol) {
		for (const declaration of origSymbol.declarations) {
			const sourceFile = declaration.getSourceFile()

			let declarationText = declaration.getText(sourceFile)

			// Remove `declare` keyword of individual declarations.
			const declareModifier = getModifier(declaration, ts.SyntaxKind.DeclareKeyword)

			if (declareModifier) {
				const start = declareModifier.getStart(sourceFile) - declaration.getStart(sourceFile)
				const end = declareModifier.getEnd() - declaration.getStart(sourceFile)

				strictEqual(
					declarationText.slice(start, end),
					declareModifier.getText(sourceFile),
					`Declare modifier not found at start:${start} - end:${end}`
				)

				declarationText = declarationText.slice(0, start) + declarationText.slice(end + 1)
			}

			const jsdocText = this.getJSDocComment(declaration)

			this.globals.set(declarationText, jsdocText)
		}
	}

	/**
	 * Retrieves declaration text and applies changes on-the-fly.
	 */
	private getDeclarationText(
		declaration: ts.Declaration,
		options: {
			newName?: ts.__String | string
			replacements?: Replacement[]
			exportKeyword?: boolean
			defaultKeyword?: boolean
		} = {}
	): string {
		const { newName, defaultKeyword, exportKeyword, replacements = [] } = options
		const sourceFile = declaration.getSourceFile()
		let text = declaration.getText(sourceFile)
		let prefix = ''

		if (newName) {
			const name = getDeclarationIdentifier(declaration as ts.Declaration)

			if (name) {
				replacements.push({ replace: name, by: newName as string })
			}
			// Unnamed default declaration like `default function()`.
			else {
				const defaultModifier = getModifier(declaration, ts.SyntaxKind.DefaultKeyword)
				if (!defaultModifier) throw Error('Declaration without name: ' + text)

				// To insert the new name, we get the position of the keyword following `default` like `function` and add it.
				const nextKeyword = getNextKeyword(defaultModifier)
				if (!nextKeyword) throw Error("Can't find declaration keyword: " + text)

				const keywordAndNewName = nextKeyword.getText(sourceFile) + ' ' + newName

				// Move the end by one space to remove the empty space after the function name when inserting it.
				// @ts-expect-error readonly end
				if (nextKeyword.kind === ts.SyntaxKind.FunctionKeyword) nextKeyword.end++

				replacements.push({ replace: nextKeyword, by: keywordAndNewName })
			}
		}

		if (replacements.length) {
			// Reorder replacements to make changes starting from the end of the declaration,
			// to not affect their start position.
			replacements.sort(({ replace: a }, { replace: b }) => b.getStart(sourceFile) - a.getStart(sourceFile))

			for (const { replace, by } of replacements) {
				const start = replace.getStart(sourceFile) - declaration.getStart(sourceFile)
				const end = replace.getEnd() - declaration.getStart(sourceFile)

				strictEqual(
					text.slice(start, end),
					replace.getText(sourceFile),
					`Entity name for replacement not found at start:${start} - end:${end}`
				)

				text = text.slice(0, start) + by + text.slice(end)
			}
		}

		// We must handle modifiers after the replacements due to their position possibly being affected by keyword manipulation.
		if (isTopLevelVariableDeclaration(declaration)) {
			// Variable declarations are exported via their statement, two parents up.
			// There may be multiple variables declared in one statement.
			// We choose to split each of them into their own statement for easier manipulation.

			const exportModifier = getModifier(declaration, ts.SyntaxKind.ExportKeyword)
			const defaultModifier = getModifier(declaration, ts.SyntaxKind.DefaultKeyword)

			if ((exportModifier && exportKeyword !== false) || (!exportModifier && exportKeyword === true)) {
				prefix += 'export '
			}

			// https://github.com/ajafff/tsutils/blob/v3.17.1/util/util.ts#L278-L284
			const keyword =
				declaration.parent.flags & ts.NodeFlags.Let
					? 'let'
					: declaration.parent.flags & ts.NodeFlags.Const
					? 'const'
					: 'var'

			if ((defaultModifier && defaultKeyword !== false) || (!defaultModifier && defaultKeyword === true)) {
				if (!exportModifier && exportKeyword !== true) {
					throw Error(`Default modifier should always be within an exported declaration: ${text}`)
				}
				prefix += `default ${keyword} `
			} else {
				prefix += `declare ${keyword} `
			}
		} else {
			const exportModifier = getModifier(declaration, ts.SyntaxKind.ExportKeyword)
			const defaultModifier = getModifier(declaration, ts.SyntaxKind.DefaultKeyword)
			const declareModifier = getModifier(declaration, ts.SyntaxKind.DeclareKeyword)

			// Add `export` keyword.
			if (!exportModifier && exportKeyword === true) {
				prefix += 'export '
			}

			// Add `default` keyword, remove `declare`. Must have export keyword.
			if (!defaultModifier && defaultKeyword === true) {
				if (!exportModifier && exportKeyword !== true) {
					throw Error(`Can't add a default modifier on a non-exported declaration: ${text}`)
				}

				if (declareModifier) {
					const start = declareModifier.getStart(sourceFile) - declaration.getStart(sourceFile)
					const end = declareModifier.getEnd() - declaration.getStart(sourceFile)

					strictEqual(
						text.slice(start, end),
						declareModifier.getText(sourceFile),
						`Declare modifier not found at start:${start} - end:${end}`
					)

					text = text.slice(0, start) + 'default' + text.slice(end)
				}
				// Interface declarations don't have a `declare` keyword.
				else {
					if (exportModifier) {
						const start = exportModifier.getStart(sourceFile) - declaration.getStart(sourceFile)
						const end = exportModifier.getEnd() - declaration.getStart(sourceFile)

						strictEqual(
							text.slice(start, end),
							exportModifier.getText(sourceFile),
							`Export modifier not found at start:${start} - end:${end}`
						)

						text = text.slice(0, start) + 'export default' + text.slice(end)
					}
					// exportKeyword true: simply add export as a prefix.
					else {
						prefix += 'default '
					}
				}
			}

			// Remove `default` keyword, add `declare`.
			if (defaultModifier && defaultKeyword === false) {
				const start = defaultModifier.getStart(sourceFile) - declaration.getStart(sourceFile)
				const end = defaultModifier.getEnd() - declaration.getStart(sourceFile)

				strictEqual(
					text.slice(start, end),
					defaultModifier.getText(sourceFile),
					`Default modifier not found at start:${start} - end:${end}`
				)

				// Interface declarations don't have a `declare` keyword.
				text = ts.isInterfaceDeclaration(declaration)
					? text.slice(0, start) + text.slice(end + 1)
					: text.slice(0, start) + 'declare' + text.slice(end)
			}

			// Remove `export` keyword.
			if (exportModifier && exportKeyword === false) {
				if (defaultModifier && defaultKeyword !== false) {
					throw Error(`Can't remove an export modifier on a default export: ${text}`)
				}

				const start = exportModifier.getStart(sourceFile) - declaration.getStart(sourceFile)
				const end = exportModifier.getEnd() - declaration.getStart(sourceFile)

				strictEqual(
					text.slice(start, end),
					exportModifier.getText(sourceFile),
					`Export modifier not found at start:${start} - end:${end}`
				)

				text = text.slice(0, start) + text.slice(end + 1)
			}

			// Declarations from module augmentations lack a declare keyword (they don't have export and default keywords either).
			if (
				!declareModifier &&
				!exportModifier &&
				!defaultModifier &&
				defaultKeyword !== true &&
				!ts.isInterfaceDeclaration(declaration)
			) {
				prefix += 'declare '
			}
		}

		return prefix + text
	}

	/**
	 * Retrieves documentation comment from declaration.
	 * @internal
	 */
	private getJSDocComment(
		declaration: ts.Declaration,
		sourceFile: ts.SourceFile = declaration.getSourceFile()
	): string {
		let comment = ''

		const statement = isTopLevelVariableDeclaration(declaration) ? declaration.parent.parent : declaration

		// Get JSDoc comment block that is closest to the definition.
		const ranges = ts.getJSDocCommentRanges(statement, sourceFile.text) || []
		const range = ranges[ranges.length - 1]

		if (range) {
			comment = sourceFile.text.substring(range.pos, range.end)
			// comment.substr(2, comment.length - 4) // remove /** */
		}

		return comment
	}
}
