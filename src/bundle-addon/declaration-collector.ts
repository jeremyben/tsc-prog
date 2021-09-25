import ts from 'typescript'
import { Color } from '../utils/log'
import { pushDeep, MapEntry } from '../utils/manipulation'
import { Reference, SymbolCollector } from './symbol-collector'
import { DeclarationRegistrar, Replacement } from './declaration-registrar'
import { isExternalLibraryAugmentation } from './syntax-check'
import {
	getModuleSpecifier,
	getModuleNameFromSpecifier,
	getDeclarationName,
	lookForProperty,
	findFirstParent,
} from './syntax-retrieval'

/**
 * @internal
 */
export class DeclarationCollector {
	declarations: DeclarationRegistrar

	private symbols: SymbolCollector

	/**
	 * Map of exports whose original symbol name conflicts with the global scope,
	 * that must first imported as a different name before being re-exported.
	 *
	 * Example: Given a local declaration `declare class Date`,
	 * we must write `declare class Date_1` & `export { Date_1 as Date }` to avoid conflicts.
	 */
	private exportRenames: Map<ts.Symbol, string>

	/**
	 * Map of collected references that could have the same name, associated with their symbols.
	 */
	private refsDeclared: Map<ts.__String, ts.Symbol[]>

	private program: ts.Program
	private checker: ts.TypeChecker
	private entryFile: ts.SourceFile

	private declareGlobalsOption: boolean
	private declareAugmentationsOption: boolean

	private debugSwitch = false

	constructor(
		symbols: SymbolCollector,
		entryFile: ts.SourceFile,
		program: ts.Program,
		declareGlobalsOption = true,
		declareAugmentationsOption = true
	) {
		this.program = program
		this.checker = program.getTypeChecker()
		this.entryFile = entryFile
		this.symbols = symbols
		this.declareGlobalsOption = declareGlobalsOption
		this.declareAugmentationsOption = declareAugmentationsOption
		this.refsDeclared = new Map<ts.__String, ts.Symbol[]>()
		this.declarations = new DeclarationRegistrar()
		this.exportRenames = this.getExportRenames(this.symbols.exportSymbols)

		for (const moduleName of this.symbols.externalStarModuleNames) {
			this.declarations.registerStar(moduleName)
		}

		for (const exportSymbol of this.symbols.exportSymbols) {
			this.collectExports(exportSymbol)
		}

		if (this.declareGlobalsOption) {
			for (const internalGlobalSymbol of this.symbols.internalGlobalSymbols) {
				this.debug('internal-global', internalGlobalSymbol.name)
				this.declarations.registerGlobal(internalGlobalSymbol)
			}
		}
	}

	private getExportRenames(exportSymbols: SymbolCollector['exportSymbols']) {
		const exportRenames = new Map<ts.Symbol, string>()

		exportSymbols.forEach(([origSymbol], exportSymbol) => {
			const exportName = exportSymbol.escapedName
			let rename: string | undefined

			// Don't overwrite symbols already renamed.
			if (exportRenames.has(origSymbol)) return

			if (this.nameIsAlreadyGlobal(exportName)) {
				let suffix = 1
				rename = `${exportName}_${suffix}`

				while (this.nameIsAlreadyUsed(rename)) {
					rename = `${exportName}_${++suffix}`
				}
			}

			if (rename) {
				// this.debug('export', 'will-be-renamed-then-reexported:', exportName, rename)
				exportRenames.set(origSymbol, rename)
			}
		})

		return exportRenames
	}

	private collectExports([exportSymbol, [origSymbol, references]]: MapEntry<SymbolCollector['exportSymbols']>): void {
		// We look in the first declaration to retrieve common source file,
		// since merged and overloaded declarations are in the same source file.
		const sourceFile = origSymbol.declarations![0].getSourceFile()

		const exportName = exportSymbol.escapedName
		const origName = origSymbol.escapedName
		// console.log(exportSymbol.declarations.map((d) => d.getFullText()))
		// console.log(origSymbol.declarations.map((d) => d.getFullText()))

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
			this.debug('export', 'is-from-external-lib:', exportName)
			this.handleSymbolFromExternalLibrary(exportSymbol, true)
			return
		}

		if (ts.isJsonSourceFile(sourceFile)) {
			this.debug('export', 'is-from-json-file:', exportName)
			this.handleSymbolFromJsonFile(exportSymbol, sourceFile, true)
			return
		}

		// External module augmentations are not detected as external, and would be duplicated.
		if (this.shouldHandleExternalAugmentation(origSymbol.declarations![0])) {
			this.debug('export', 'is-augmentation-of-external-lib:', exportName)
			this.handleSymbolFromExternalLibrary(exportSymbol, true)
			return
		}

		//
		// ═════════ Internal ═════════
		//

		// First register referenced declarations and retrieve replacements to the exported declaration if any.
		const symbolReplacements = this.collectReferences(references)
		// console.log(`replacements for ${exportName}:`, symbolReplacements)

		// ─── `export default` ───
		if (exportName === ts.InternalSymbolName.Default) {
			// Symbol is already exported, so we simply export the aliased name as default.
			const otherExportSymbols = this.findOtherExportsWithSameOrig(exportSymbol, origSymbol)
			if (otherExportSymbols) {
				// Export only one default.
				const aliasName = otherExportSymbols[0].escapedName
				this.debug('export', 'default-already-exported-to-alias:', aliasName)
				this.declarations.registerAlias(aliasName, { default: true })
				return
			}

			// Default symbol is a variable value, and must be declared first before being exported as default.
			// If the value was exported as is, an intermediary variable named '_default' was created by the compiler.
			// todo: default namespace and type
			if (origSymbol.flags & ts.SymbolFlags.Variable) {
				const exportRealName = getDeclarationName(exportSymbol.declarations![0])

				this.debug('export', 'default-variable-to-declare:', exportRealName || origName)
				this.declarations.registerInternal(origSymbol, {
					default: false,
					export: false,
					newName: exportRealName,
					symbolReplacements,
				})
				this.declarations.registerAlias(exportRealName || origName, { default: true })
			} else {
				this.debug('export', 'default-to-declare:', origName)
				this.declarations.registerInternal(origSymbol, { export: true, default: true, symbolReplacements })
			}

			return
		}

		// Always remove `default` keyword from original declaration (origName === ts.InternalSymbolName.Default).
		// `export { default as A }` | (`import A` & `export { A }`)

		// ─── `export *` | `export { A }` ───
		// Symbol is eiher directly exported or aliased with the same name.
		if (exportName === origName) {
			const exportRename = this.exportRenames.get(origSymbol)
			if (exportRename) {
				// Name is already used by a global symbol.
				this.debug('export', 'already-global:', exportName, '| to-declare-then-reexport-as:', exportRename)
				this.declarations.registerInternal(origSymbol, {
					export: false,
					default: false,
					newName: exportRename,
					symbolReplacements,
				})
				this.declarations.registerAlias(exportRename as ts.__String, { as: exportName })
			} else {
				// Usual case.
				this.debug('export', 'original-name-to-declare:', exportName)
				this.declarations.registerInternal(origSymbol, { export: true, default: false, symbolReplacements })
			}

			// Symbol is also exported as different aliases.
			// + `export { A as B }`
			const otherExportSymbols = this.findOtherExportsWithSameOrig(exportSymbol, origSymbol)
			if (otherExportSymbols) {
				for (const other of otherExportSymbols) {
					this.debug('export', 'to-alias:', exportRename || exportName, 'as', other.escapedName)
					this.declarations.registerAlias((exportRename || exportName) as ts.__String, { as: other.escapedName })
				}
			}

			// if (exportSymbol === origSymbol) `export *` // else `export { A }`
			return
		}

		// ─── `export { A as B }` ───
		// Symbol is aliased as a different name than the original one.
		// Symbols aliased as a different name but also exported as the original name are handled in the previous condition.
		if (exportName !== origName && !this.nameIsAlreadyExported(origName)) {
			const exportRename = this.exportRenames.get(origSymbol)

			if (exportRename) {
				// Name is already used by a global symbol.
				this.debug('export', 'aliased-name-already-global:', exportName, '| to-declare-then-reexport:', exportRename)
				this.declarations.registerInternal(origSymbol, {
					export: false,
					default: false,
					newName: exportRename,
					symbolReplacements,
				})
				this.declarations.registerAlias(exportRename as ts.__String, { as: exportName })
			} else {
				// Usual case.
				this.debug('export', 'aliased-name-to-declare:', exportName)
				this.declarations.registerInternal(origSymbol, {
					export: true,
					default: false,
					newName: exportName,
					symbolReplacements,
				})
			}

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

			//
			// ═════════ Global ═════════
			//

			if (
				this.isGlobalSymbol(origRefSymbol) &&
				// Redeclare internal global references if the global option is off.
				(this.declareGlobalsOption || (!this.declareGlobalsOption && !this.isInternalGlobalSymbol(origRefSymbol)))
			) {
				this.debug('ref', 'is-global:', refName)
				continue
			}

			//
			// ═════════ Without declarations ═════════
			//

			// Ignore symbols without declarations.
			// After globals, because some global symbols like `globalThis` does not have a declaration.
			if (!origRefSymbol.declarations || !origRefSymbol.declarations.length) {
				console.warn(Color.yellow(`Referenced symbol ${origRefSymbol.name} does not have any declaration`))
				continue
			}

			//
			// ═════════ External/JSON ═════════
			//
			// Don't have to rewrite external import type nodes: `import('lib').A`.

			const refSourceFile = origRefSymbol.declarations[0].getSourceFile()

			if (this.program.isSourceFileFromExternalLibrary(refSourceFile)) {
				if (ts.isImportTypeNode(ref)) continue
				this.debug('ref', 'is-from-external-lib:', refName)
				this.handleSymbolFromExternalLibrary(refSymbol)
				continue
			}

			if (ts.isJsonSourceFile(refSourceFile)) {
				if (ts.isImportTypeNode(ref)) continue
				this.debug('ref', 'is-from-json-file:', refName)
				this.handleSymbolFromJsonFile(refSymbol, refSourceFile)
				continue
			}

			// External module augmentations are not detected as external, and would be duplicated.
			if (this.shouldHandleExternalAugmentation(origRefSymbol.declarations[0])) {
				if (ts.isImportTypeNode(ref)) continue
				this.debug('ref', 'is-augmentation-of-external-lib:', refName)
				this.handleSymbolFromExternalLibrary(refSymbol)
				continue
			}

			//
			// ═════════ Internal ═════════
			//

			// ─── Already exported ───
			if (this.symbols.origSymbols.has(origRefSymbol)) {
				// Already exported as is.
				if (this.nameIsAlreadyExported(refName)) {
					// Export has possibly been renamed in its declaration if it conflicted with a global name.
					let possibleRename = this.exportRenames.get(origRefSymbol)
					if (possibleRename) {
						possibleRename = this.maybeTypeOf(possibleRename, ref)
						pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: possibleRename })
					}
					this.debug('ref', 'already-declared-and-exported:', possibleRename || refName)
				}
				// Already exported as an alias.
				else {
					let aliasName =
						this.exportRenames.get(origRefSymbol) || (this.findOtherAliasName(origRefSymbol, refName) as string)
					aliasName = this.maybeTypeOf(aliasName, ref)

					this.debug('ref', 'already-exported-as-alias:', aliasName)
					pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: aliasName })
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
						? getDeclarationName(refPropOrigSymbol.declarations![0])
						: refPropOrigSymbol.escapedName

				if (!refPropOrigName || refPropOrigName === ts.InternalSymbolName.Default) {
					throw Error(`Unnamed property (probably default export) in namespace reference: ${ref}`)
				}

				// Property symbol already exported elsewhere from the entry file.
				if (this.symbols.origSymbols.has(refPropOrigSymbol)) {
					// Exported as the same name.
					if (this.nameIsAlreadyExported(refPropOrigName)) {
						const possibleExportRename = this.exportRenames.get(refPropOrigSymbol)
						const newName = this.maybeTypeOf(possibleExportRename || refPropOrigName, ref)

						this.debug('ref', 'prop-already-exported-to-reuse:', newName)
						pushDeep(symbolReplacements, declarationIndex, { replace: refRoot, by: newName })
					}
					// Exported as a different name, which we're looking for.
					else {
						let aliasName = this.findOtherAliasName(refPropOrigSymbol, refPropOrigName) as string
						aliasName = this.maybeTypeOf(aliasName, ref)

						this.debug('ref', 'prop-already-exported-as-alias-to-reuse:', aliasName)
						pushDeep(symbolReplacements, declarationIndex, { replace: refRoot, by: aliasName })
					}
				}
				// Property symbol not exported, so we need to declare it.
				else {
					const newName = this.maybeTypeOf(refPropOrigName, ref)
					this.debug('ref', 'prop-to-declare:', newName)

					pushDeep(symbolReplacements, declarationIndex, { replace: refRoot, by: newName })
					this.declarations.registerInternal(refPropOrigSymbol, { default: false, export: false })
				}

				continue
			}

			if (this.nameIsAlreadyGlobal(refName)) {
				// We want suffix to start at 1, but indexes start at 0, so we make sure to add 1 each time.
				let suffix: number

				// Name has also already been declared by another reference.
				if (this.refsDeclared.has(refName)) {
					const sameNameSymbols = this.refsDeclared.get(refName)!
					const symbolIndex = sameNameSymbols.indexOf(origRefSymbol)

					// Symbol found, we use its index to build the suffix.
					if (symbolIndex >= 0) {
						suffix = symbolIndex + 1
					}

					// Symbol not declared before, so we assign a suffix and keep its reference.
					else {
						suffix = sameNameSymbols.push(origRefSymbol)
						this.refsDeclared.set(refName, sameNameSymbols)
					}
				}
				// First time a reference with this name is declared.
				else {
					suffix = 1
					this.refsDeclared.set(refName, [origRefSymbol])
				}

				const newRefName = origRefName + '_' + suffix
				this.debug('ref', 'already-global:', refName, '| to-declare:', newRefName)

				pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: newRefName })
				this.declarations.registerInternal(origRefSymbol, {
					default: false,
					export: false,
					newName: newRefName,
					symbolReplacements: subSymbolReplacements,
				})

				continue
			}

			// Name has already been declared by another reference.
			if (this.refsDeclared.has(refName)) {
				let newRefName: string | undefined
				const sameNameSymbols = this.refsDeclared.get(refName)!
				const symbolIndex = sameNameSymbols.indexOf(origRefSymbol)

				// Symbol indexed at 0 is the first one declared, no need to suffix it.
				if (symbolIndex === 0) {
					this.debug('ref', 'to-reuse:', refName)
				}

				// Symbol not found, so it's another symbol with the same name, and we suffix it.
				if (symbolIndex === -1) {
					// Pick a suffix that would not make the new name conflict with another declaration.
					let suffix = sameNameSymbols.length
					newRefName = `${refName}_${suffix}`

					while (this.nameIsAlreadyUsed(newRefName)) {
						this.debug('ref', 'name-suffixed-would-conflict:', newRefName)
						newRefName = `${refName}_${++suffix}`
					}
					this.debug('ref', 'already-in-use:', refName, '| name-suffixed-to-declare:', newRefName)

					sameNameSymbols[suffix] = origRefSymbol
					this.refsDeclared.set(refName, sameNameSymbols)

					pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: newRefName })
				}

				// Symbol found other than the first one declared, we use its index as the suffix.
				if (symbolIndex > 0) {
					const suffix = symbolIndex

					newRefName = `${refName}_${suffix}`
					this.debug('ref', 'name-suffixed-to-reuse:', newRefName)

					pushDeep(symbolReplacements, declarationIndex, { replace: ref, by: newRefName })
				}

				this.declarations.registerInternal(origRefSymbol, {
					default: false,
					export: false,
					newName: newRefName /* may be undefined */,
					symbolReplacements: subSymbolReplacements,
				})
			}

			// Reference name is used for the first time, so we keep a reference to it, for the first condition above.
			else {
				this.refsDeclared.set(refName, [origRefSymbol])

				this.debug('ref', 'to-declare:', refName)
				this.declarations.registerInternal(origRefSymbol, {
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

	private nameIsAlreadyExported(name: string | ts.__String): boolean {
		return this.symbols.exportNames.has(name as ts.__String)
	}

	private nameIsAlreadyGlobal(name: string | ts.__String): boolean {
		return this.symbols.globalNames.includes(name as ts.__String)
	}

	private nameIsAlreadyUsed(name: string | ts.__String): boolean {
		return this.nameIsAlreadyExported(name) || this.nameIsAlreadyGlobal(name)
	}

	private maybeTypeOf(name: ts.__String | string, ref: ts.Identifier | ts.ImportTypeNode): string {
		return ts.isImportTypeNode(ref) && ref.isTypeOf ? `typeof ${name}` : (name as string)
	}

	private shouldHandleExternalAugmentation(declaration: ts.Declaration): boolean {
		if (!this.declareAugmentationsOption) return false
		return !!findFirstParent(declaration, isExternalLibraryAugmentation)
	}

	private isGlobalSymbol(symbol: ts.Symbol): boolean {
		return this.symbols.globalSymbols.includes(symbol)
	}

	private isInternalGlobalSymbol(symbol: ts.Symbol): boolean {
		return this.symbols.internalGlobalSymbols.includes(symbol)
	}

	private debug(subject: 'export' | 'ref' | 'internal-global', ...messages: any[]) {
		if (this.debugSwitch) console.info(`[${subject.toUpperCase()}]`, ...messages)
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
			aliasName = getDeclarationName(aliasSymbol.declarations![0])
		}

		if (aliasName === ts.InternalSymbolName.Default) {
			aliasName = getDeclarationName(origAliasSymbol.declarations![0])
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
		const [firstDeclaration] = symbol.declarations!

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

			// We need to check every declaration because of augmentations that could lead to false negatives.
			// Ex: the predicate `isSourceFileFromExternalLibrary` on a module augmentation declaration (internal).
			const found = moduleSymbol.declarations.some((d) => predicate(d.getSourceFile()))

			if (found) {
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
