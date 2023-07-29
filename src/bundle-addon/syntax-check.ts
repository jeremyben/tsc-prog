import * as ts from 'typescript'

/**
 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/services/refactors/moveToNewFile.ts#L644
 * @internal
 */
export function isTopLevelDeclaration(node: ts.Node): node is TopLevelDeclaration {
	return (
		(isTopLevelNonVariableDeclaration(node) && ts.isSourceFile(node.parent)) ||
		(isTopLevelVariableDeclaration(node) && ts.isSourceFile(node.parent.parent.parent))
	)
}

/**
 * @internal
 */
export function isExportedTopLevelDeclaration(node: ts.Node): node is TopLevelDeclaration {
	return (
		(isTopLevelNonVariableDeclaration(node) && isExported(node)) ||
		(isTopLevelVariableDeclaration(node) && isExported(node.parent.parent))
	)
}

/**
 * @internal
 */
export function isTopLevelVariableDeclaration(node: ts.Node): node is TopLevelVariableDeclaration {
	return (
		ts.isVariableDeclaration(node) &&
		ts.isVariableDeclarationList(node.parent) &&
		ts.isVariableStatement(node.parent.parent)
	)
}

/**
 * @internal
 */
export function isTopLevelDeclarationStatement(node: ts.Node): node is TopLevelDeclarationStatement {
	return isTopLevelNonVariableDeclaration(node) || ts.isVariableStatement(node)
}

/**
 * @see https://github.com/microsoft/TypeScript/blob/v3.5.3/src/services/refactors/moveToNewFile.ts#L733
 * @internal
 */
export function isExported(dec: TopLevelDeclarationStatement): boolean {
	return ts.hasModifier(dec, ts.ModifierFlags.Export)
}

/**
 * @internal
 */
export function isTopLevelNonVariableDeclaration(node: ts.Node): node is TopLevelNonVariableDeclaration {
	switch (node.kind) {
		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.ClassDeclaration:
		case ts.SyntaxKind.ModuleDeclaration:
		case ts.SyntaxKind.EnumDeclaration:
		case ts.SyntaxKind.TypeAliasDeclaration:
		case ts.SyntaxKind.InterfaceDeclaration:
		case ts.SyntaxKind.ImportEqualsDeclaration:
			return true
		default:
			return false
	}
}

/**
 * Accepts ambient declarations like `declare "library"` and not `declare global` or `declare "./relative-module"`.
 * @internal
 */
export function isExternalLibraryAugmentation(node: ts.Node): node is ts.AmbientModuleDeclaration {
	return (
		ts.isAmbientModule(node) && !ts.isGlobalScopeAugmentation(node) && !ts.isExternalModuleNameRelative(node.name.text)
	)
}

export function isTopLevelNamedDeclaration(node: ts.Node): node is TopLevelNamedDeclaration {
	switch (node.kind) {
		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.ClassDeclaration:
		case ts.SyntaxKind.EnumDeclaration:
		case ts.SyntaxKind.TypeAliasDeclaration:
		case ts.SyntaxKind.InterfaceDeclaration:
		case ts.SyntaxKind.ModuleDeclaration:
		case ts.SyntaxKind.VariableDeclaration:
			return true
		default:
			return false
	}
}

/**
 * @internal
 */
export function isKeywordTypeNode(node: ts.Node): node is ts.KeywordTypeNode {
	switch (node.kind) {
		case ts.SyntaxKind.AnyKeyword:
		case ts.SyntaxKind.UnknownKeyword:
		case ts.SyntaxKind.NumberKeyword:
		case ts.SyntaxKind.BigIntKeyword:
		case ts.SyntaxKind.ObjectKeyword:
		case ts.SyntaxKind.BooleanKeyword:
		case ts.SyntaxKind.StringKeyword:
		case ts.SyntaxKind.SymbolKeyword:
		case ts.SyntaxKind.ThisKeyword:
		case ts.SyntaxKind.VoidKeyword:
		case ts.SyntaxKind.UndefinedKeyword:
		case ts.SyntaxKind.NullKeyword:
		case ts.SyntaxKind.NeverKeyword:
			return true
		default:
			return false
	}
}

/**
 * @internal
 */
export function hasModuleSpecifier(
	node: ts.ImportOrExportSpecifier | ts.ImportDeclaration | ts.ExportDeclaration
): boolean {
	if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
		return !!node.moduleSpecifier
	}

	if (ts.isImportSpecifier(node)) {
		return !!node.parent.parent.parent.moduleSpecifier
	}

	if (ts.isExportSpecifier(node)) {
		return !!node.parent.parent.moduleSpecifier
	}

	return false
}

/**
 * Ensures that the node has no children.
 * @see https://github.com/ajafff/tsutils/blob/v3.17.1/util/util.ts#L17-L19
 * @internal
 */
export function isTokenNode(node: ts.Node): boolean {
	return node.kind >= ts.SyntaxKind.FirstToken && node.kind <= ts.SyntaxKind.LastToken
}

/**
 * @internal
 * @see https://github.com/ajafff/tsutils/blob/v3.17.1/util/util.ts#L37-L39
 */
export function isKeywordNode(node: ts.Node): boolean {
	return node.kind >= ts.SyntaxKind.FirstKeyword && node.kind <= ts.SyntaxKind.LastKeyword
}

/**
 * @internal
 */
export type TopLevelDeclarationStatement = TopLevelNonVariableDeclaration | ts.VariableStatement

/**
 * @internal
 */
export type TopLevelDeclaration = TopLevelNonVariableDeclaration | TopLevelVariableDeclaration | ts.BindingElement

/**
 * @internal
 */
export type TopLevelVariableDeclaration = ts.VariableDeclaration & {
	parent: ts.VariableDeclarationList & { parent: ts.VariableStatement }
}

/**
 * @internal
 */
export type TopLevelNamedDeclaration =
	| ts.FunctionDeclaration
	| ts.ClassDeclaration
	| ts.EnumDeclaration
	| ts.TypeAliasDeclaration
	| ts.InterfaceDeclaration
	| ts.ModuleDeclaration
	| ts.VariableDeclaration

/**
 * @internal
 */
export type TopLevelNonVariableDeclaration =
	| ts.FunctionDeclaration
	| ts.ClassDeclaration
	| ts.EnumDeclaration
	| ts.TypeAliasDeclaration
	| ts.InterfaceDeclaration
	| ts.ModuleDeclaration
	| ts.ImportEqualsDeclaration
	| TopLevelExpressionStatement

/**
 * `exports.x = ...`
 * @internal
 */
export type TopLevelExpressionStatement = ts.ExpressionStatement & {
	expression: ts.BinaryExpression & { left: ts.PropertyAccessExpression }
}
