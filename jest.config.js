/** @type {jest.InitialOptions} */
const config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/node_modules/', '/__fixtures__/'],
	globals: {
		'ts-jest': {
			diagnostics: {
				warnOnly: true, // https://kulshekhar.github.io/ts-jest/user/config/diagnostics
			},
		},
	},
}

module.exports = config
