import * as ts from 'typescript'
import { isTokenNode, isKeywordNode } from './syntax-check'

/**
 * From `A` in `type T = A.a`, retrieves the root `A.a` and the property `a`.
 * @returns root/parent reference, and the property found.
 * @internal
 */
export function lookForProperty(ref: ts.Identifier | ts.ImportTypeNode) {
	let refRoot: ts.QualifiedName | ts.ImportTypeNode | undefined
	let refProp: ts.Identifier | undefined

	if (ts.isImportTypeNode(ref)) {
		refRoot = ref
		if (!ref.qualifier) return

		refProp = ts.isQualifiedName(ref.qualifier)
			? ref.qualifier.right
			: ts.isIdentifier(ref.qualifier)
			? ref.qualifier
			: undefined

		if (!refProp) return
	} else {
		refRoot = findFirstParent(ref, ts.isQualifiedName)
		if (!refRoot) return

		refProp = refRoot.right
	}

	return [refRoot, refProp] as [ts.QualifiedName | ts.ImportTypeNode, ts.Identifier]
}

/**
 * Does a depth-first search of the children of the specified node.
 * @internal
 */
export function findFirstChild<T extends ts.Node>(
	node: ts.Node,
	predicate: (childNode: ts.Node) => childNode is T,
	sourceFile = node.getSourceFile()
): T | undefined {
	for (const child of node.getChildren(sourceFile)) {
		if (predicate(child)) return child as T

		const grandChild = findFirstChild(child, predicate, sourceFile)
		if (grandChild) return grandChild as T
	}

	return undefined
}

/**
 * @internal
 */
export function findFirstParent<T extends ts.Node>(
	node: ts.Node,
	predicate: (parentNode: ts.Node) => parentNode is T
): T | undefined {
	let current: ts.Node | undefined = node.parent

	while (current) {
		if (predicate(current)) return current as T
		current = current.parent
	}

	return undefined
}

/**
 * @internal
 */
export function getNextToken(node: ts.Node, sourceFile = node.getSourceFile()): ts.Node | undefined {
	const children = node.parent.getChildren(sourceFile)

	for (const child of children) {
		if (child.end > node.end && child.kind !== ts.SyntaxKind.JSDocComment) {
			if (isTokenNode(child)) return child

			// Next token is nested in another node
			return getNextToken(child, sourceFile)
		}
	}
}

/**
 * @internal
 */
export function getNextKeyword(node: ts.Node, sourceFile = node.getSourceFile()): ts.Node | undefined {
	const children = node.parent.getChildren(sourceFile)

	for (const child of children) {
		if (child.end > node.end) {
			if (isKeywordNode(child)) return child
			continue
		}
	}
}

/**
 * @see https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L5216-L5219
 * @internal
 */
export function getDeclarationIdentifier(node: ts.Declaration | ts.Expression): ts.Identifier | undefined {
	const name = ts.getNameOfDeclaration(node)
	return name && ts.isIdentifier(name) ? name : undefined
}

/**
 * Try to get A in `export default A`.
 * @internal
 */
export function getDeclarationName(node: ts.Declaration): ts.__String | undefined {
	const name = ts.getNameOfDeclaration(node)
	return name && ts.isIdentifier(name) ? name.escapedText : undefined
}

/**
 * @internal
 */
export function getModifier(node: ts.Node, kind: ts.Modifier['kind']): ts.Modifier | undefined {
	if (!node.modifiers) return

	for (const modifier of node.modifiers) {
		if (modifier.kind === kind) return modifier
	}
}

/**
 * Get module name from any import/export declaration part. Could be internal or external.
 * Example: X in `export * from "X"`.
 *
 * @param strict - throw an error if node is not part of an import/export declaration.
 * @internal
 */
export function getModuleName(node: ts.Node, strict = false): string | undefined {
	if (ts.isNamespaceExportDeclaration(node)) return node.name.text

	const moduleSpecifier = getModuleSpecifier(node, strict)
	return getModuleNameFromSpecifier(moduleSpecifier)
}

/**
 * @param strict - throw an error if node is not part of an import/export node.
 * @internal
 */
export function getModuleSpecifier(node: ts.Node, strict = false): ts.Expression | undefined {
	// https://github.com/Microsoft/TypeScript/blob/v3.6.4/src/compiler/utilities.ts#L2149

	if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
		return node.moduleSpecifier
	} else if (ts.isImportEqualsDeclaration(node)) {
		return ts.isExternalModuleReference(node.moduleReference) ? node.moduleReference.expression : undefined
	} else if (ts.isImportSpecifier(node)) {
		return node.parent.parent.parent.moduleSpecifier
	} else if (ts.isExportSpecifier(node) || ts.isNamespaceImport(node) || ts.isNamedImports(node)) {
		return node.parent.parent.moduleSpecifier
	} else if (ts.isImportClause(node) || ts.isNamedExports(node)) {
		return node.parent.moduleSpecifier
	} else if (ts.isImportTypeNode(node)) {
		return ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined
	} else if (node.parent && ts.isImportTypeNode(node.parent)) {
		if (ts.isLiteralTypeNode(node)) {
			return node.literal
		} else if (ts.isEntityName(node)) {
			const { argument } = node.parent as ts.ImportTypeNode
			return ts.isLiteralTypeNode(argument) ? argument.literal : undefined
		} else {
			return undefined
		}
	} else {
		if (strict) {
			throw Error(`${node.getText()} (kind: ${node.kind}) is not part of an import or export declaration`)
		}
	}
}

/**
 * @internal
 */
export function getModuleNameFromSpecifier(moduleSpecifier: ts.Expression | undefined): string | undefined {
	if (moduleSpecifier && ts.isStringLiteralLike(moduleSpecifier)) {
		return ts.getTextOfIdentifierOrLiteral(moduleSpecifier)
	}
}
