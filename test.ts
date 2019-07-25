import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { createProgramFromConfig, build } from './src'

const basePath = join(__dirname, '__fixtures__')
const configFilePath = 'tsconfig.fixture.json'

// Mock deleting folders for protection
jest.mock('./src/fs.utils', () => ({
	...jest.requireActual('./src/fs.utils'),
	rmrf: jest.fn((path) => console.info('mock rmrf on', path)),
}))

// Need actual delete implementation for some test,
// can't unmock implicit imports on a per test basis https://github.com/facebook/jest/issues/2649
const deleteOutDir = () => {
	const { rmrf } = jest.requireActual('./src/fs.utils')
	const outDirPath = join(basePath, 'dist')
	rmrf(outDirPath)

	expect(existsSync(outDirPath)).toBe(false)
}

describe('Basic build', () => {
	test('Create program by overriding config file', async () => {
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

		expect(program.getRootFileNames()).toHaveLength(1)
	})

	test('Build without errors with config from scratch', async () => {
		const consoleWarnSpy = spyOn(console, 'warn')

		build({
			basePath,
			// configFilePath,
			clean: { outDir: true },
			compilerOptions: {
				module: 'es2015',
				moduleResolution: 'node',
				target: 'es2019',
				lib: ['es2019'],
				rootDir: 'src',
				outDir: 'dist',
				resolveJsonModule: true,
				listEmittedFiles: true,
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
	beforeEach(deleteOutDir)

	test('all other files', () => {
		const consoleWarnSpy = spyOn(console, 'warn')

		build({
			basePath,
			configFilePath,
			copyOtherToOutDir: true,
			compilerOptions: {
				listEmittedFiles: true,
			},
			exclude: ['**/excluded'],
		})

		const otherDirPath = join(basePath, 'dist', 'other')
		expect(readdirSync(otherDirPath)).toHaveLength(3)

		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringMatching(/override.*data\.json/))
	})
})
