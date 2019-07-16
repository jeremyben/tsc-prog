/**
 * @see https://commitlint.js.org/#/reference-configuration
 *
 * @type {Config}
 *
 * @typedef Config
 * @property {string[]=} extends Resolveable ids to commitlint configurations to extend.
 * @property {string=} parserPreset Resolveable id to conventional-changelog parser preset to import and use.
 * @property {string=} formatter Resolveable id to package, from node_modules, which formats the output.
 * @property {{[key in RuleName]?: Rule | ((...args) => Rule)}=} rules Rules to check against.
 * @property {((message: string) => boolean)[]=} ignores Functions that return true if commitlint should ignore the given message.
 * @property {boolean=} defaultIgnores Whether commitlint uses the default ignore rules.
 *
 * @typedef {[0 | 1 | 2, 'always' | 'never', number | string | string[]]} Rule
 * @typedef {'body-leading-blank' | 'body-max-length' | 'body-min-length' | 'footer-leading-blank' | 'footer-max-length' | 'footer-max-line-length' | 'footer-min-length' | 'header-case' | 'header-full-stop' | 'header-max-length' | 'header-min-length' | 'references-empty' | 'scope-enum' | 'scope-case' | 'scope-empty' | 'scope-max-length' | 'scope-min-length' | 'subject-case' | 'subject-empty' | 'subject-full-stop' | 'subject-max-length' | 'subject-min-length' | 'type-enum' | 'type-case' | 'type-empty' | 'type-max-length' | 'type-min-length' | 'signed-off-by'} RuleName
 */
const config = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'header-max-length': [2, 'always', 100],
	},
}

module.exports = config
