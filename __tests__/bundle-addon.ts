import { readFileSync } from 'fs'
import { join } from 'path'
import { build, TsConfigCompilerOptions } from '../src'

const fixture = (...path: string[]) => join(__dirname, '..', '__fixtures__', 'bundle', ...path)

const compilerOptions: TsConfigCompilerOptions = { rootDir: '.', outDir: 'dist' }

test('duplicate', () => {
	const entryPoint = fixture('duplicate', 'dist', 'main.d.ts')

	build({
		basePath: fixture('duplicate'),
		extends: '../tsconfig.json',
		compilerOptions,
		clean: { outDir: true },
		bundleDeclaration: {
			entryPoint,
		},
	})

	const bundled = readFileSync(entryPoint, 'utf8')

	for (const expected of [
		'export declare class X',
		'export { X as Y }',
		'export declare class B',
		'export declare class C',
		'export default B',
	]) {
		expect(bundled).toContain(expected)
	}
})

test('global name conflict', () => {
	const entryPoint = fixture('global-name-conflict', 'dist', 'main.d.ts')

	build({
		basePath: fixture('global-name-conflict'),
		extends: '../tsconfig.json',
		compilerOptions,
		clean: { outDir: true },
		bundleDeclaration: {
			entryPoint,
		},
	})

	const bundled = readFileSync(entryPoint, 'utf8')

	for (const expected of [
		/^declare type Promise_1 =/gm,
		/^export declare function isMyPromise.*Promise_1/gm,
		/^export declare function getRealDate.*Date;$/gm,
		/^declare class Date_2/gm,
		/^export { Date_2 as Date }/gm,
		/^export declare const myDate: Date_2/gm,
	]) {
		expect(bundled).toMatch(expected)
	}
})

test('ambient declaration', () => {
	const entryPoint = fixture('ambient-declaration', 'dist', 'main.d.ts')

	build({
		basePath: fixture('ambient-declaration'),
		extends: '../tsconfig.json',
		compilerOptions,
		clean: { outDir: true },
		bundleDeclaration: {
			entryPoint,
		},
	})

	const bundled = readFileSync(entryPoint, 'utf8')

	for (const expected of [
		/^declare global {.*interface GlobalInterface {$/ms,
		/^declare global {.*namespace GlobalNamespace {$/ms,
		/^declare module 'os' {$/m,
		/^declare module 'http' {$/m,
		/^import { ExternalInterface } from "http";$/m,
	]) {
		expect(bundled).toMatch(expected)
	}

	expect(bundled.match(/namespace GlobalNamespace {$/gm)).toHaveLength(2)
	expect(bundled.match(/interface InternalInterface {$/gm)).toHaveLength(2)
})

test('circular reference bug', () => {
	const entryPoint = fixture('circular-reference-bug', 'dist', 'main.d.ts')

	build({
		basePath: fixture('circular-reference-bug'),
		extends: '../tsconfig.json',
		compilerOptions,
		clean: { outDir: true },
		bundleDeclaration: {
			entryPoint,
		},
	})

	const bundled = readFileSync(entryPoint, 'utf8')

	expect(bundled).toMatch(/^export declare class User<T extends User = any> {$/m)
})

test.skip('complex', () => {
	const entryPoint = fixture('complex', 'dist', 'main.d.ts')

	build({
		basePath: fixture('complex'),
		extends: '../tsconfig.json',
		compilerOptions,
		bundleDeclaration: {
			entryPoint,
		},
	})

	const bundled = readFileSync(entryPoint, 'utf8')
	console.log(bundled)
})
