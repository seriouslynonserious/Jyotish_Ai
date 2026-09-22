// Package only project source/configuration, never local birth data or credentials.
const { execFileSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
mkdirSync('public/source', { recursive: true });
execFileSync('tar', ['-czf', 'public/source/jyotish-ai-source.tar.gz',
  '--exclude=public/source/jyotish-ai-source.tar.gz',
  'src', 'tests', 'scripts', 'public', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'README.md',
  'package.json', 'package-lock.json', 'angular.json',
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.spec.json', '.gitignore', '.prettierrc', '.editorconfig',
]);
