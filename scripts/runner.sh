#! /usr/bin/env zsh

# better-sqlite3 now uses N-API, so tests can run directly on
# the CI/runtime Node.js version instead of Electron's older Node runtime.

export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'
exec node --require ts-node/register --require tsconfig-paths/register "$@"
