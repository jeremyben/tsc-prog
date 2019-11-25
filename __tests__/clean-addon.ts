import { join } from 'path'
import { build } from '../src'

const basePath = join(__dirname, '..', '__fixtures__', 'basic')

// Mock deleting folders for protection
jest.mock('../src/utils/fs', () => ({
	...jest.requireActual('../src/utils/fs'),
	rmrf: jest.fn((path) => console.info('mock rmrf on', path)),
}))

// Need actual delete implementation to clean between some tests.
// Can't unmock implicit imports on a per test basis https://github.com/facebook/jest/issues/2649
afterEach(() => {
	const { rmrf } = jest.requireActual('../src/utils/fs')
	const outDirPaths = [join(basePath, 'dist'), join(basePath, 'src', 'dist')]
	outDirPaths.forEach(rmrf)
})

describe('Clean protections', () => {
	test('Forbid cleaning rootDir', async () => {
		expect(() => {
			build({
				basePath,
				configFilePath: 'tsconfig.json',
				compilerOptions: { rootDir: 'src' },
				clean: ['src'],
			})
		}).toThrow('cannot delete')
	})

	test('Forbid cleaning basePath and up', async () => {
		expect(() => {
			build({
				basePath,
				configFilePath: 'tsconfig.json',
				clean: ['.'],
			})
		}).toThrow('cannot delete')

		expect(() => {
			build({
				basePath,
				configFilePath: 'tsconfig.json',
				clean: ['..'],
			})
		}).toThrow('cannot delete')
	})

	test('Forbid cleaning cwd', async () => {
		expect(() => {
			build({
				basePath,
				configFilePath: 'tsconfig.json',
				clean: [process.cwd()],
			})
		}).toThrow('cannot delete')
	})
})
