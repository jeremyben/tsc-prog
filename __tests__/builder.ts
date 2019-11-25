import { join } from 'path'
import { existsSync } from 'fs'
import { createProgramFromConfig, build } from '../src'
import { rmrf } from '../src/utils/fs'

const basePath = join(__dirname, '..', '__fixtures__', 'basic')

afterEach(() => {
	rmrf(join(basePath, 'dist'))
})

test('Create program by overriding config file', async () => {
	const consoleWarnSpy = spyOn(console, 'warn')

	const program = createProgramFromConfig({
		basePath,
		configFilePath: 'tsconfig.json',
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

	expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("'declaration' requires a value of type boolean"))

	expect(program.getRootFileNames()).toHaveLength(2)
})

test('Build without errors with config from scratch', async () => {
	const consoleWarnSpy = spyOn(console, 'warn')

	build({
		basePath,
		compilerOptions: {
			module: 'commonjs',
			moduleResolution: 'node',
			target: 'es2019',
			lib: ['es2019'],
			rootDir: 'src',
			outDir: 'dist',
			resolveJsonModule: true,
			// listEmittedFiles: true,
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
