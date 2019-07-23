// Nice contortion, bitch.

import { build } from './src'

build({
	basePath: __dirname,
	extends: './tsconfig.json',
	compilerOptions: { skipLibCheck: true },
	include: ['src/**/*.ts'],
	exclude: ['**/__tests__', '**/*.test.ts', '**/*.spec.ts', '**/__fixtures__'],
	clean: { outDir: true },
})
