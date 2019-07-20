import { existsSync } from 'fs'
import { join, normalize } from 'path'
import ts from 'typescript'
import { createProgramFromConfig, build } from '.'

jest.mock('./clean-addon/rmrf')

const basePath = join(__dirname, '__fixtures__')
const configFilePath = 'tsconfig.fixture.json'

test('Create program by overriding config file', async () => {
	const program = createProgramFromConfig({
		basePath,
		configFilePath,
		compilerOptions: {
			rootDir: 'src',
			outDir: 'dist',
			declaration: 'true' as any,
			skipLibCheck: true,
		},
		exclude: ['**/excluded'],
	})

	expect(program.getCompilerOptions()).toMatchObject({
		strict: true,
		// `compilerOptions` properties returns unix separators in windows paths
		rootDir: normalize(join(basePath, 'src')),
		declaration: 'true',
	})

	expect(program.getRootFileNames()).toHaveLength(1)
})

test('Build without errors with config from scratch', async () => {
	const consoleWarnSpy = spyOn(console, 'warn')

	build({
		basePath,
		// configFilePath,
		clean: { outDir: true },
		compilerOptions: {
			module: ts.ModuleKind.ES2015,
			moduleResolution: ts.ModuleResolutionKind.NodeJs,
			target: ts.ScriptTarget.ES5,
			rootDir: 'src',
			outDir: 'dist',
			declaration: false,
			skipLibCheck: true,
		},
	})

	expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('error'))

	const distMainFile = join(basePath, 'dist', 'main.js')
	expect(existsSync(distMainFile)).toBe(true)
})

describe('Cleaning protections', () => {
	test('Forbid cleaning rootDir', async () => {
		expect(() => {
			build({
				basePath,
				configFilePath,
				compilerOptions: { rootDir: 'src' },
				clean: ['src'],
			})
		}).toThrow('cannot delete')
	})

	test('Forbid cleaning basePath and up', async () => {
		expect(() => {
			build({
				basePath,
				configFilePath,
				clean: ['.'],
			})
		}).toThrow('cannot delete')

		expect(() => {
			build({
				basePath,
				configFilePath,
				clean: ['..'],
			})
		}).toThrow('cannot delete')
	})

	test('Forbid cleaning cwd', async () => {
		expect(() => {
			build({
				basePath,
				configFilePath,
				clean: [process.cwd()],
			})
		}).toThrow('cannot delete')
	})
})
