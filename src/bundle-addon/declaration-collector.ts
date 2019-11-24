import ts from 'typescript'
import { Color } from '../utils/log'
import { pushDeep, MapEntry } from '../utils/manipulation'
import { Reference, SymbolCollector } from './symbol-collector'
import { DeclarationRegistrar, Replacement } from './declaration-registrar'
import {
	getModuleSpecifier,
	getModuleNameFromSpecifier,
	getDeclarationNameText,
	lookForProperty,
} from './syntax-retrieval'

/**
 * @internal
 */
export class DeclarationCollector {
	declarations: DeclarationRegistrar

	private symbols: SymbolCollector

	/** Keep a map of collected references, that could have the same name, associated with their symbols. */
	private refNamesDeclared: Map<ts.__String, ts.Symbol[]>

	private program: ts.Program
	private checker: ts.TypeChecker
	private entryFile: ts.SourceFile

	private debug = false

	constructor(symbols: SymbolCollector, entryFile: ts.SourceFile, program: ts.Program) {
		this.program = program
		this.checker = program.getTypeChecker()
		this.entryFile = entryFile
		this.symbols = symbols
		this.refNamesDeclared = new Map<ts.__String, ts.Symbol[]>()
		this.declarations = new DeclarationRegistrar()

		for (const moduleName of this.symbols.externalStarModuleNames) {
			this.declarations.registerStar(moduleName)
		}

		for (const exportSymbol of this.symbols.exportSymbols) {
			this.collectExports(exportSymbol)
		}
	}

	private collectExports([exportSymbol, [origSymbol, references]]: MapEntry<SymbolCollector['exportSymbols']>): void {
		// We look in the first declaration to retrieve common source file,
		// since merged and overloaded declarations are in the same source file.
		const sourceFile = origSymbol.declarations[0].getSourceFile()

		//
		// ═════════ External/JSON ═════════
		//

		if (this.program.isSourceFileFromExternalLibrary(sourceFile)) {
			// External declarations exported directly without intermediary symbol in our package,
			// usually via a star export. Should not happen since we chose before to not retrieve them.
			if (exportSymbol === origSymbol) {
				console.warn(
					Color.yellow(`Start exported symbols from "${sourceFile.fileName}" should not have been retrieved.`)
				)
				return
			}

			this.handleSymbolFromExternalLibrary(exportSymbol, true)
			return
		}

		if (ts.isJsonSourceFile(sourceFile)) {
			this.handleSymbolFromJsonFile(exportSymbol, sourceFile, true)
			return
		}

		//
		// ═════════ Internal ═════════
		//

		const exportName = exportSymbol.escapedName
		const origName = origSymbol.escapedName
		// console.log(exportSymbol.declarations.map((d) => d.getFullText()))
		// console.log(origSymbol.declarations.map((d) => d.getFullText()))

		// First register referenced declarations and retrieve replacements to the exported declaration if any.
		const symbolReplacements = this.collectReferences(references)
		// console.log(`replacements for ${exportName}:`, symbolReplacements)

		// ─── `export default` ───
		if (exportName === ts.InternalSymbolName.Default) {
			// Symbol is already exported, so we simply export the aliased name as default.
			const otherExportSymbols = this.findOtherExportsWithSameOrig(exportSymbol, origSymbol)

			// Export only one default.
			if (otherExportSymbols) {
				this.declarations.registerAlias(otherExportSymbols[0].escapedName, { default: true })
				return
			}

			// Default symbol is a variable value, and must be declared first before being exported as default.
			// If the value was exported as is, an intermediary variable named '_default' was created by the compiler.
			if (origSymbol.flags & ts.SymbolFlags.Variable) {
				const exportRealName = getDeclarationNameText(exportSymbol.declarations[0])

				if (exportRealName && exportRealName !== origName) {
					this.declarations.registerInternal(origSymbol, sourceFile, {
						default: false,
						export: false,
						newName: exportRealName,
						symbolReplacements,
					})
					this.declarations.registerAlias(exportRealName, { default: true })
				} else {
					this.declarations.registerInternal(origSymbol, sourceFile, {
						export: false,
						default: false,
						symbolReplacements,
					})
					this.declarations.registerAlias(origName, { default: true })
				}

				return
			}

			this.declarations.registerInternal(origSymbol, sourceFile, { export: true, default: true, symbolReplacements })
			return
		}

		// Always remove `default` keyword from original declaration (origName === ts.InternalSymbolName.Default).
		// `export { default as A }` | (`import A` & `export { A }`)

		// ─── `export *` | `export { A }` ───
		// Symbol is eiher directly exported or aliased with the same name.
		if (exportName === origName) {
			this.declarations.registerInternal(origSymbol, sourceFile, { export: true, default: false, symbolReplacements })

			// Symbol is also exported as different aliases.
			// + `export { A as B }`
			const otherExportSymbols = this.findOtherExportsWithSameOrig(exportSymbol, origSymbol)
			if (otherExportSymbols) {
				for (const other of otherExportSymbols) {
					this.declarations.registerAlias(origName, { as: other.escapedName })
				}
			}

			// if (exportSymbol === origSymbol) `export *` // else `export { A }`
			return
		}

		// ─── `export { A as B }` ───
		// Symbol is aliased as a different name than the original one.
		// Symbols aliased as a different name but also exported as the original name are handled in the previous condition.
		if (exportName !== origName && !this.symbols.exportNames.has(origName)) {
			this.declarations.registerInternal(origSymbol, sourceFile, {
				export: true,
				default: false,
				newName: exportName,
				symbolReplacements,
			})
			return
		}
	}

	/**
	 * Write references used by declarations and retrieves eventual replacements to rewrite parts of the declarations.
	 */
	private collectReferences(refs: Reference[]): Replacement[][] {
		const symbolReplacements: Replacement[][] = []

		for (const { ref, subrefs, declarationIndex } of refs) {
			const refSymbol = this.checker.getSymbolAtLocation(ref)

			if (!refSymbol) {
				throw Error(`Cannot find symbol of reference: ${ref}`)
			}

			let origRefSymbol = refSymbol
			if (refSymbol.flags & ts.SymbolFlags.Alias) {
				origRefSymbol = this.checker.getAliasedSymbol(refSymbol)
			}

			const refName = refSymbol.escapedName
			const origRefName = origRefSymbol.escapedName

			// Don't handle generic type (e.g. `T`).
			if (origRefSymbol.flags & ts.SymbolFlags.TypeParameter) {
				continue
			}

			// Ignore symbols without declarations.
			if (!origRefSymbol.declarations || !origRefSymbol.declarations.length) {
				console.warn(Color.yellow(`Referenced symbol ${origRefSymbol.name} does not have any declaration`))
				continue
			}

			const refSourceFile = origRefSymbol.declarations[0].getSourceFile()

			//
			// ═════════ Global ═════════
			//

			if (this.symbols.globalSymbols.includes(origRefSymbol)) {
				this.log('ref', 'is-global:', refName)
				continue
			}

			//
			// ═════════ External/JSON ═════════
			//
			// Don't have to rewrite external import type nodes: `import('lib').A`.

			if (this.program.isSourceFileFromExternalLibrary(refSourceFile)) {
				if (ts.isImportTypeNode(ref)) continue
				this.log('ref', 'is-from-external-lib:', refName)
				this.handleSymbolFromExternalLibrary(refSymbol)
				continue
			}

			if (ts.isJsonSourceFile(refSourceFile)) {
				if (ts.isImportTypeNode(ref)) continue
				this.log('ref', 'is-from-json-file:', refName)
				this.handleSymbolFromJsonFile(refSymbol, refSourceFile)
				continue
			}

			//
			// ═════════ Internal ═════════
			//

			// ─── Already exported ───
			if (this.symbols.origSymbols.has(origRefSymbol)) {
				// Already exported as the same name.
				if (this.symbols.exportNames.has(refName)) {
					this.log('ref', 'name-already-exported:', refName)
				}
				// Already exported as a different name.
				else {
					let newName = this.findOtherAliasName(origRefSymbol, refName) as string
					newName = this.maybeTypeOf(newName, ref)

					this.log('ref', 'name-already-exported-as-alias:', newName)
					pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: newName })
				}
				continue
			}

			// First collect recursively sub references.
			const subSymbolReplacements = this.collectReferences(subrefs)

			// ─── Namespace reference ───
			// Look for property and bundle it instead of whole namespace
			// in case of `import * as A` & `var x = A.a`, or `import('./A').a`.

			if (origRefSymbol.declarations.some(ts.isSourceFile)) {
				const match = lookForProperty(ref)

				if (!match) {
					throw Error(`Reference "${refName}" is aliasing the whole file ${origRefName} and thus can't be bundled.`)
				}

				// In `A.a`, the root is `A` and the prop is `a`.
				const [refRoot, refProp] = match

				let refPropOrigSymbol = this.checker.getSymbolAtLocation(refProp)
				if (!refPropOrigSymbol) {
					throw Error(`Can't find property symbol in namespace reference: ${ref}`)
				}

				if (refPropOrigSymbol.flags & ts.SymbolFlags.Alias) {
					refPropOrigSymbol = this.checker.getAliasedSymbol(refPropOrigSymbol)
				}

				// Retrieve the right name in case of default export.
				const refPropOrigName =
					refPropOrigSymbol.escapedName === ts.InternalSymbolName.Default
						? getDeclarationNameText(refPropOrigSymbol.declarations[0])
						: refPropOrigSymbol.escapedName

				if (!refPropOrigName || refPropOrigName === ts.InternalSymbolName.Default) {
					throw Error(`Unnamed property (probably default export) in namespace reference: ${ref}`)
				}

				// Property symbol already exported elsewhere from the entry file.
				if (this.symbols.origSymbols.has(refPropOrigSymbol)) {
					// Exported as the same name.
					if (this.symbols.exportNames.has(refPropOrigName)) {
						const newName = this.maybeTypeOf(refPropOrigName, ref)

						this.log('ref', 'prop-name-already-exported-to-reuse:', newName)
						pushDeep(symbolReplacements, declarationIndex, { replace: refRoot, by: newName })
					}
					// Exported as a different name, which we're looking for.
					else {
						let newName = this.findOtherAliasName(refPropOrigSymbol, refPropOrigName) as string
						newName = this.maybeTypeOf(newName, ref)

						this.log('ref', 'prop-name-already-exported-as-alias-to-reuse:', newName)
						pushDeep(symbolReplacements, declarationIndex, { replace: refRoot, by: newName })
					}
				}
				// Property symbol not exported, so we need to declare it.
				else {
					const newName = this.maybeTypeOf(refPropOrigName, ref)
					this.log('ref', 'prop-name-to-write:', newName)

					pushDeep(symbolReplacements, declarationIndex, { replace: refRoot, by: newName })
					this.declarations.registerInternal(refPropOrigSymbol, refSourceFile, { default: false, export: false })
				}

				continue
			}

			// A same name variable already exists in entry file scope (exported symbols are handled before).
			if (this.symbols.globalNames.includes(refName)) {
				// We want suffix to start at 1, but indexes start at 0, so we make sure to add 1 each time.
				let suffix: number

				// Name has also already been declared by another reference.
				if (this.refNamesDeclared.has(refName)) {
					const sameNameSymbols = this.refNamesDeclared.get(refName)!
					const symbolIndex = sameNameSymbols.indexOf(origRefSymbol)

					// Symbol found, we use its index to build the suffix.
					if (symbolIndex >= 0) {
						suffix = symbolIndex + 1
					}

					// Symbol not declared before, so we assign a suffix and keep its reference.
					else {
						suffix = sameNameSymbols.push(origRefSymbol)
						this.refNamesDeclared.set(refName, sameNameSymbols)
					}
				}
				// First time a reference with this name is declared.
				else {
					suffix = 1
					this.refNamesDeclared.set(refName, [origRefSymbol])
				}

				const newRefName = origRefName + '_' + suffix
				this.log('ref', 'name-in-global-scope:', refName, '| name-to-write:', newRefName)

				pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: newRefName })
				this.declarations.registerInternal(origRefSymbol, refSourceFile, {
					default: false,
					export: false,
					newName: newRefName,
					symbolReplacements: subSymbolReplacements,
				})
				continue
			}

			// Name has already been declared by another reference.
			if (this.refNamesDeclared.has(refName)) {
				let newRefName: string | undefined
				const sameNameSymbols = this.refNamesDeclared.get(refName)!
				const symbolIndex = sameNameSymbols.indexOf(origRefSymbol)

				// Symbol indexed at 0 is the first one declared, no need to suffix it.
				if (symbolIndex === 0) {
					this.log('ref', 'name-to-reuse:', refName)
				}

				// Symbol not found, so it's another symbol with the same name, and we suffix it.
				if (symbolIndex === -1) {
					// Pick a suffix that would not make the new name conflict with another declaration.
					let suffix = sameNameSymbols.length
					newRefName = `${refName}_${suffix}`

					while (this.nameIsAlreadyUsed(newRefName)) {
						this.log('ref', 'name-suffixed-would-conflict:', newRefName)
						suffix++
						newRefName = `${refName}_${suffix}`
					}
					this.log('ref', 'name-already-in-use:', refName, '| ref-suffixed-to-write:', newRefName)

					sameNameSymbols[suffix] = origRefSymbol
					this.refNamesDeclared.set(refName, sameNameSymbols)

					pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: newRefName })
				}

				// Symbol found other than the first one declared, we use its index as the suffix.
				if (symbolIndex > 0) {
					const suffix = symbolIndex

					newRefName = `${refName}_${suffix}`
					this.log('ref', 'name-suffixed-to-reuse:', newRefName)

					pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: newRefName })
				}

				this.declarations.registerInternal(origRefSymbol, refSourceFile, {
					default: false,
					export: false,
					newName: newRefName /* may be undefined */,
					symbolReplacements: subSymbolReplacements,
				})
			}

			// Reference name is used for the first time, so we keep a reference to it, for the first condition above.
			else {
				this.refNamesDeclared.set(refName, [origRefSymbol])

				this.log('ref', 'name-to-write:', refName)
				this.declarations.registerInternal(origRefSymbol, refSourceFile, {
					default: false,
					export: false,
					// Declare the reference as the right name
					newName: origRefName !== refName ? refName : undefined,
					symbolReplacements: subSymbolReplacements,
				})
			}
		}

		return symbolReplacements
	}

	private handleSymbolFromExternalLibrary(symbol: ts.Symbol, reExport = false): void {
		const { importKind, importName, moduleName } = this.findImportFromModule(
			symbol,
			this.program.isSourceFileFromExternalLibrary
		)

		this.declarations.registerExternal(symbol, importKind, importName, moduleName, reExport)
	}

	private handleSymbolFromJsonFile(symbol: ts.Symbol, sourceFile: ts.SourceFile, reExport = false): void {
		const relativePath = ts.getRelativePathFromFile(
			this.entryFile.resolvedPath,
			sourceFile.resolvedPath,
			(fileName) => fileName
		)
		const { importKind, importName } = this.findImportFromModule(symbol, ts.isJsonSourceFile)

		this.declarations.registerExternal(symbol, importKind, importName, relativePath, reExport)
	}

	private maybeTypeOf(name: ts.__String | string, ref: ts.Identifier | ts.ImportTypeNode): string {
		return ts.isImportTypeNode(ref) && ref.isTypeOf ? `typeof ${name}` : (name as string)
	}

	private nameIsAlreadyUsed(name: string): boolean {
		return this.symbols.exportNames.has(name as ts.__String) || this.symbols.globalNames.includes(name as ts.__String)
	}

	private log(subject: 'ref', ...messages: any[]) {
		if (this.debug) console.log(`[${subject.toUpperCase()}]`, ...messages)
	}

	//
	// ────────────────────────────────────────────────────────────────────────────
	//   :::::::: Finders ::::::::
	// ────────────────────────────────────────────────────────────────────────────
	//

	private findOtherAliasName(origSymbol: ts.Symbol, origName: ts.__String): ts.__String {
		const aliased = Array.from(this.symbols.exportSymbols).find(
			([otherExport, [otherOrig]]) => origSymbol === otherOrig && origName !== otherExport.escapedName
		)

		if (!aliased) throw Error(`Aliased symbol of ${origName} was not found`)

		const [aliasSymbol, { 0: origAliasSymbol }] = aliased

		let aliasName: ts.__String | undefined = aliasSymbol.escapedName

		if (aliasName === ts.InternalSymbolName.Default) {
			aliasName = getDeclarationNameText(aliasSymbol.declarations[0])
		}

		if (aliasName === ts.InternalSymbolName.Default) {
			aliasName = getDeclarationNameText(origAliasSymbol.declarations[0])
		}

		if (!aliasName || aliasName === ts.InternalSymbolName.Default) {
			throw Error(`Unnamed alias (default export): ${origName}`)
		}

		return aliasName
	}

	private findOtherExportsWithSameOrig(exportSymbol: ts.Symbol, origSymbol: ts.Symbol): ts.Symbol[] | undefined {
		const others = Array.from(this.symbols.exportSymbols)
			.filter(([otherExport, [otherOrig]]) => otherOrig === origSymbol && otherExport !== exportSymbol)
			.map(([otherExport]) => otherExport)

		if (others.length) return others
	}

	/**
	 * Finds the original import declaration from a module matching a predicate.
	 */
	private findImportFromModule(
		symbol: ts.Symbol,
		predicate: (sourceFile: ts.SourceFile) => boolean
	): {
		importName: ts.__String
		importKind: ts.SyntaxKind
		moduleName: string
	} {
		const [firstDeclaration] = symbol.declarations

		const moduleSpecifier = getModuleSpecifier(firstDeclaration)

		if (moduleSpecifier) {
			const moduleSymbol = this.checker.getSymbolAtLocation(moduleSpecifier)

			if (!moduleSymbol || !moduleSymbol.declarations) {
				throw Error('Could not resolve module symbol: ' + moduleSpecifier.getText()) // Should not happen
			}
			if (!(moduleSymbol.flags & ts.SymbolFlags.ValueModule)) {
				throw Error('Is not a proper module: ' + moduleSpecifier.getText()) // Should not happen
			}

			const moduleName = getModuleNameFromSpecifier(moduleSpecifier)

			if (!moduleName) {
				throw Error('Could not find module name: ' + moduleSpecifier.getText()) // Should not happen
			}

			const sourceFile = moduleSymbol.declarations[0].getSourceFile()

			// We found the guy.
			if (predicate(sourceFile)) {
				let importName = symbol.escapedName
				const importKind = firstDeclaration.kind

				// Retrieve the imported property name in declarations like `import { A as B } from '...'`
				if (ts.isImportOrExportSpecifier(firstDeclaration) && firstDeclaration.propertyName) {
					importName = firstDeclaration.propertyName.escapedText
				}

				return { moduleName, importName, importKind }
			}
		}

		// If no module specifier is found (e.g. `export { A }`)
		// or if the resolved module does not match the predicate,
		// we go to the next aliased symbol.

		if (!(symbol.flags & ts.SymbolFlags.Alias)) {
			throw Error(`${symbol.escapedName} is not an aliased export symbol`)
		}

		const nextSymbol = this.checker.getImmediateAliasedSymbol(symbol)
		if (!nextSymbol || !nextSymbol.declarations) {
			throw Error(`Could not find an import matching the predicate for: ${symbol.escapedName}`)
		}

		return this.findImportFromModule(nextSymbol, predicate)
	}
}
