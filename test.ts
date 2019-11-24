import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { createProgramFromConfig, build } from './src'

const basePath = join(__dirname, '__fixtures__')
const configFilePath = 'tsconfig.fixture.json'

// Mock deleting folders for protection
jest.mock('./src/utils/fs', () => ({
	...jest.requireActual('./src/utils/fs'),
	rmrf: jest.fn((path) => console.info('mock rmrf on', path)),
}))

// Need actual delete implementation to clean between some tests.
// Can't unmock implicit imports on a per test basis https://github.com/facebook/jest/issues/2649
afterEach(() => {
	const { rmrf } = jest.requireActual('./src/utils/fs')
	const outDirPaths = [join(basePath, 'dist'), join(basePath, 'src', 'dist')]
	outDirPaths.forEach(rmrf)
})

describe('Basic build', () => {
	test('Create program by overriding config file', async () => {
		const expectedFilesTotal = readdirSync(join(basePath, 'src', 'module')).length + 1
		const consoleWarnSpy = spyOn(console, 'warn')

		const program = createProgramFromConfig({
			basePath,
			configFilePath,
			compilerOptions: {
				rootDir: 'src',
				outDir: 'dist',
				declaration: 'true' as any,
				skipLibCheck: true,
			},
			exclude: ['**/excluded', '**/dist'],
		})

		expect(program.getCompilerOptions()).toMatchObject({
			strict: true,
			// `compilerOptions` properties returns unix separators in windows paths
			rootDir: join(basePath, 'src').replace(/\\/g, '/'),
			declaration: undefined,
		})

		expect(consoleWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining("'declaration' requires a value of type boolean")
		)

		expect(program.getRootFileNames()).toHaveLength(expectedFilesTotal)
	})

	test('Build without errors with config from scratch', async () => {
		const consoleWarnSpy = spyOn(console, 'warn')

		build({
			basePath,
			// configFilePath,
			clean: { outDir: true },
			compilerOptions: {
				module: 'commonjs',
				moduleResolution: 'node',
				target: 'es2019',
				lib: ['es2019'],
				rootDir: 'src',
				outDir: 'dist',
				resolveJsonModule: true,
				listEmittedFiles: true,
				esModuleInterop: true,
				listFiles: true,
				declaration: true,
				skipLibCheck: true,
			},
		})

		expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('error'))

		const distMainFile = join(basePath, 'dist', 'main.js')
		expect(existsSync(distMainFile)).toBe(true)
	})
})

describe('Clean protections', () => {
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

describe('Copy', () => {
	test('all other files', () => {
		const expectedOtherFilesTotal = readdirSync(join(basePath, 'src', 'other')).length
		const consoleInfoSpy = spyOn(console, 'info')

		build({
			basePath,
			configFilePath,
			copyOtherToOutDir: true,
			exclude: ['**/excluded'],
		})

		const otherDirDistPath = join(basePath, 'dist', 'other')
		expect(readdirSync(otherDirDistPath)).toHaveLength(expectedOtherFilesTotal)

		const excludedDirDistPath = join(basePath, 'dist', 'excluded')
		expect(existsSync(excludedDirDistPath)).toBe(false)

		expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringMatching(/override.*main\.js/))
	})

	test('do not recursively copy outDir to outDir', () => {
		// tslint:disable-next-line: no-shadowed-variable
		const basePath = join(__dirname, '__fixtures__', 'src')
		// tslint:disable-next-line: no-shadowed-variable
		const configFilePath = '../tsconfig.fixture.json'

		build({
			basePath,
			configFilePath,
			copyOtherToOutDir: true,
			compilerOptions: {
				rootDir: '.',
				outDir: 'dist',
			},
			exclude: ['**/excluded'],
		})

		const distInDist = join(basePath, 'dist', 'dist')
		expect(existsSync(distInDist)).toBe(false)
	})
})

test.skip('bundle', () => {
	build({
		basePath,
		configFilePath,
		compilerOptions: {
			declaration: true,
			listEmittedFiles: true,
		},
		exclude: ['**/excluded'],
		bundleDeclaration: {
			entryPoint: 'main.d.ts',
		},
	})
})
