# ContraBooks dependency maintenance

This plan intentionally separates security/patch maintenance from the higher-risk Electron and language-toolchain migrations.

## Phase 1 — Baseline and guardrails
- Keep the Yarn v1 lockfile authoritative until a dedicated package-manager migration is tested.
- Run `yarn install --frozen-lockfile`, `yarn lint`, `yarn test`, and `yarn uitest` on a clean checkout.
- Keep dependency auditing in CI and review high/critical advisories before release.
- Do not run an unrestricted `yarn upgrade`.

## Phase 2 — Low-risk security maintenance
- Apply patch/minor dependency updates that remain within the existing major-version compatibility envelope.
- Prioritize transitive security fixes already adopted upstream.
- Keep Electron 22 and better-sqlite3 together as a separately tested native/runtime track.

## Phase 3 — Electron/runtime modernization
- Upgrade Electron as a dedicated change set.
- Rebuild better-sqlite3 and all native modules against the target Electron ABI.
- Test IPC/preload, context isolation, database open/migration, imports/exports, printing/PDF, dialogs, updater behavior, and packaged builds on supported OSes.
- Do not combine this migration with a TypeScript/Vue major upgrade unless a compatibility failure requires it.

## Phase 4 — Language/build modernization
- Upgrade TypeScript and vue-tsc together.
- Then evaluate Vue/Vite/eslint/prettier major upgrades in small, independently testable changes.
- Resolve compiler errors before changing runtime behavior.
- Finish with a fresh lockfile audit and packaged smoke tests.

## Current security notes
- Electron 22.3.27 is below current supported Electron security branches and is the highest-priority modernization item.
- lodash 4.18.1 is already above the known 4.18.0 security floor for the 2026 template advisory.
- Vite 5.4.21 is at the 5.x security floor identified in the prior audit.
- Playwright 1.55.1 is at the patched floor for CVE-2025-59288.
- better-sqlite3 is native and must be upgraded/tested with Electron rather than independently.
