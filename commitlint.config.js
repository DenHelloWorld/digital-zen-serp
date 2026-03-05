const TYPES = ['feat', 'fix', 'chore', 'refactor', 'style', 'docs', 'perf', 'test'];
const SCOPES = ['core', 'common'];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', TYPES],
    'scope-enum': [2, 'always', SCOPES],
    'scope-empty': [2, 'never'],
  },
  helpUrl: 'https://www.conventionalcommits.org/',
};
