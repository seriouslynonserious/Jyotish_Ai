// Package only project source/configuration, never local birth data or credentials.
const { execFileSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
mkdirSync('public/source', { recursive: true });
execFileSync('tar', ['-czf', 'public/source/backend-source.tar.gz', '--exclude=target', '--exclude=.env', '-C', '..', 'backend']);
execFileSync('tar', ['-czf', 'public/source/jyotish-ai-source.tar.gz',
  '--exclude=public/source/jyotish-ai-source.tar.gz',
  'src', 'tests', 'scripts', 'public', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'README.md',
  'package.json', 'package-lock.json', 'angular.json', 'proxy.conf.json', 'proxy.local.conf.json', 'Dockerfile', 'nginx.conf',
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.spec.json', '.gitignore', '.prettierrc', '.editorconfig',
  '-C', '..', 'compose.yaml', '.dockerignore', 'start-local.sh',
]);
