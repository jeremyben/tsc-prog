import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { build } from '../src'
import { rmrf } from '../src/utils/fs'

const basePath = join(__dirname, '..', '__fixtures__', 'basic-with-other')

afterEach(() => {
	rmrf(join(basePath, 'dist'))
	rmrf(join(basePath, 'src', 'dist'))
})

describe('Copy addon', () => {
	test('all other files', () => {
		const expectedOtherFiles = readdirSync(join(basePath, 'src', 'other'))
		const consoleWarnSpy = spyOn(console, 'warn')

		build({
			basePath,
			configFilePath: 'tsconfig.json',
			copyOtherToOutDir: true,
			exclude: ['**/excluded'],
		})

		const otherDirDistPath = join(basePath, 'dist', 'other')
		expect(readdirSync(otherDirDistPath)).toHaveLength(expectedOtherFiles.length)

		const excludedDirDistPath = join(basePath, 'dist', 'excluded')
		expect(existsSync(excludedDirDistPath)).toBe(false)

		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringMatching(/already.*main\.js/))
	})

	test('do not recursively copy outDir to outDir', () => {
		// tslint:disable-next-line: no-shadowed-variable
		const basePath = join(__dirname, '..', '__fixtures__', 'basic-with-other', 'src')

		build({
			basePath,
			configFilePath: '../tsconfig.json',
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
