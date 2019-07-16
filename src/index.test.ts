import { createProgramFromConfig, build } from '.'
import { join } from 'path'
import { existsSync, unlinkSync } from 'fs'

const basePath = join(__dirname, '__fixtures__')

test('Override config file and create program', async () => {
	const consoleWarnSpy = spyOn(console, 'warn')

	const program = createProgramFromConfig({
		basePath,
		configFilePath: 'tsconfig.fixture.json',
		compilerOptions: {
			rootDir: 'src',
			outDir: 'dist',
			declaration: 'true' as any,
			skipLibCheck: true,
		},
		exclude: ['**/excluded'],
	})

	const options = program.getCompilerOptions()
	expect(options).toMatchObject({
		strict: true,
		rootDir: join(basePath, 'src').replace(/\\/g, '/'),
		declaration: undefined,
	})

	expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("'declaration' requires a value of type boolean"))

	const rootFileNames = program.getRootFileNames()
	expect(rootFileNames).toHaveLength(1)
})

test('Build without errors', async () => {
	const consoleWarnSpy = spyOn(console, 'warn')

	build({
		basePath,
		compilerOptions: {
			rootDir: 'src',
			outDir: 'dist',
			declaration: false,
			strict: true,
			skipLibCheck: true,
		},
		exclude: ['**/excluded'],
	})

	expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('error'))

	const distMainFile = join(basePath, 'dist', 'main.js')
	expect(existsSync(distMainFile)).toBe(true)
	unlinkSync(distMainFile)
})
