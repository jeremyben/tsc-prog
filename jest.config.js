/** @type {Partial<import('@jest/types').Config.DefaultOptions & { rootDir: string, preset: string }>} */
const config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src/', '<rootDir>/__tests__/'],
	testPathIgnorePatterns: ['/node_modules/', '/__fixtures__/', '.*\\.d\\.ts$'],
	globals: {
		'ts-jest': {
			diagnostics: {
				// https://kulshekhar.github.io/ts-jest/user/config/diagnostics
				warnOnly: true,
				pretty: false,
			},
		},
	},
}

module.exports = config
