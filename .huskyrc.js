/**
 * @see https://github.com/typicode/husky/blob/master/DOCS.md
 * @see https://git-scm.com/docs/githooks
 *
 * @type {{hooks: {[key in GitHook]?: string}}}
 *
 * @typedef {'pre-commit' | 'prepare-commit-msg' | 'commit-msg' | 'post-commit' | 'pre-rebase' | 'post-checkout' | 'post-merge' | 'pre-push' | 'applypatch-msg' | 'pre-applypatch' | 'post-applypatch' | 'post-rewrite' | 'post-index-change'} GitHook
 */
const config = {
	hooks: {
		'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS',
	},
}

module.exports = config
