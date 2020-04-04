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

	/**
	 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L3844-L3846
	 * @internal
	 */
	function hasModifier(node: Node, flags: ModifierFlags): boolean

	/**
	 * Retrieves the (cached) module resolution information for a module name that was exported from a SourceFile.
	 * The compiler populates this cache as part of analyzing the source file.
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.5.3/src/compiler/utilities.ts#L223-L225
	 */
	function getResolvedModule(sourceFile: SourceFile, moduleNameText: string): ResolvedModuleFull | undefined

	/**
	 * https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L46-L54
	 * @internal
	 */
	function createSymbolTable(symbols?: readonly Symbol[]): SymbolTable

	/**
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2244
	 * @internal
	 */
	interface AmbientModuleDeclaration extends ModuleDeclaration {
		body?: ModuleBlock
	}

	/**
	 * `declare module "name"` | `declare global`
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L640-L642
	 * @internal
	 */
	function isAmbientModule(node: Node): node is AmbientModuleDeclaration

	/**
	 * `declare global`
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L678-L680
	 * @internal
	 */
	function isGlobalScopeAugmentation(module: ModuleDeclaration): boolean

	/**
	 * External module augmentation is a ambient module declaration that is either:
	 * - defined in the top level scope and source file is an external module
	 * - defined inside ambient module declaration located in the top level scope and source file not an external module
	 *
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L682-L684
	 * @internal
	 */
	function isExternalModuleAugmentation(node: Node): node is AmbientModuleDeclaration

	/**
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L1050-L1063
	 * @internal
	 */
	function getJSDocCommentRanges(node: Node, text: string): CommentRange[] | undefined

	/**
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L1003-L1005
	 * @internal
	 */
	function isJsonSourceFile(file: SourceFile): file is JsonSourceFile

	/**
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L2822
	 * @internal
	 */
	type PropertyNameLiteral = Identifier | StringLiteralLike | NumericLiteral

	/**
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L2834-L2836
	 * @internal
	 */
	function getTextOfIdentifierOrLiteral(node: PropertyNameLiteral): string

	/**
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L5226-L5228
	 * @internal
	 */
	function isNamedDeclaration(node: Node): node is NamedDeclaration & { name: DeclarationName }

	/**
	 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L7735-L7737
	 * @internal
	 */
	function getRelativePathFromFile(from: string, to: string, getCanonicalFileName: (fileName: string) => string): string

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

		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2998
		 * @internal
		 */
		getResolvedTypeReferenceDirectives(): Map<ResolvedTypeReferenceDirective | undefined>

		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/program.ts#L1514-L1516
		 * @internal
		 */
		getDiagnosticsProducingTypeChecker: () => TypeChecker

		/**
		 * Given a source file, get the name of the package it was imported from.
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L3009
		 * @internal
		 */
		sourceFileToPackageName: Map<string>
	}

	interface TypeChecker {
		/**
		 * @see https://raw.githubusercontent.com/Microsoft/TypeScript/v3.6.4/src/compiler/checker.ts
		 * @internal
		 */
		getImmediateAliasedSymbol(symbol: Symbol): Symbol | undefined

		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L3292
		 * @see https://raw.githubusercontent.com/Microsoft/TypeScript/v3.6.4/src/compiler/checker.ts
		 * @internal
		 */
		getEmitResolver: (sourceFile?: SourceFile, cancellationToken?: CancellationToken) => EmitResolver
	}

	/**
	 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L3605-L3644
	 * @internal
	 */
	interface EmitResolver {
		hasGlobalName(name: string): boolean
	}

	interface Node {
		/**
		 * Locals associated with node (initialized by binding).
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L633
		 * @internal
		 */
		locals?: SymbolTable

		/**
		 * Next container in declaration order (initialized by binding).
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L634
		 * @internal
		 */
		nextContainer?: Node
	}

	interface Symbol {
		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L3743
		 * @internal
		 */
		parent?: Symbol
	}

	interface SourceFile {
		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2687
		 * @internal
		 */
		path: Path

		/**
		 * Resolved path can be different from path property,
		 * when file is included through project reference is mapped to its output instead of source,
		 * in that case resolvedPath = path to output file, path = input file's path.
		 *
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2694
		 * @internal
		 */
		resolvedPath: Path

		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2745
		 * @internal
		 */
		identifiers: Map<string> // Map from a string to an interned string

		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2767
		 * @internal
		 */
		classifiableNames?: ReadonlyUnderscoreEscapedMap<true>

		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2773
		 * @internal
		 */
		imports: ReadonlyArray<StringLiteralLike>

		/**
		 * The first "most obvious" node that makes a file an external module.
		 * This is intended to be the first top-level import/export,
		 * but could be arbitrarily nested (e.g. `import.meta`).
		 *
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2739
		 * @internal
		 */
		externalModuleIndicator?: Node

		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2775
		 * @internal
		 */
		moduleAugmentations: ReadonlyArray<StringLiteral | Identifier>

		/**
		 * @see https://github.com/microsoft/TypeScript/blob/v3.6.4/src/compiler/types.ts#L2777
		 * @internal
		 */
		ambientModuleNames: ReadonlyArray<string>
	}
}
