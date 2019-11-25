import { join } from 'path'
import { build } from '../src'

const basePath = join(__dirname, '..', '__fixtures__', 'bundle-complex')

test.skip('bundle', () => {
	build({
		basePath,
		configFilePath: 'tsconfig.json',
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
