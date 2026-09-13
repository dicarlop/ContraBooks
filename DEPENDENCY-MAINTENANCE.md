# ContraBooks dependency maintenance

This plan intentionally separates security/patch maintenance from the higher-risk Electron and language-toolchain migrations.

## Phase 1 — Baseline and guardrails
- Keep the Yarn v1 lockfile authoritative until a dedicated package-manager migration is tested.
- Run `yarn install --frozen-lockfile`, `yarn lint`, `yarn test`, and `yarn uitest` on a clean checkout.
- Keep dependency auditing in CI and review high/critical advisories before release.
- Do not run an unrestricted `yarn upgrade`.
- **Status: complete.** CI runs clean installs, lint, typecheck, 926 unit tests, Electron UI smoke tests, source builds, dependency audit, and Windows packaging.

## Phase 2 — Low-risk security maintenance
- Apply patch/minor dependency updates that remain within the existing major-version compatibility envelope.
- Prioritize transitive security fixes already adopted upstream.
- Keep native/runtime changes separately tested.
- **Status: complete for the current maintenance baseline.** Key dependency floors include lodash 4.18.1, Vite 5.4.21, Playwright 1.55.1, better-sqlite3 13.0.3, and Node 24.8.0.
- The current Yarn audit reports two moderate AJV advisories and no high/critical advisories. The AJV fix remains a separate lockfile task because the repository uses a frozen Yarn v1 lockfile.

## Phase 3 — Electron/runtime modernization
- Upgrade Electron as a dedicated change set.
- Rebuild better-sqlite3 and all native modules against the target Electron ABI.
- Test IPC/preload, context isolation, database open/migration, imports/exports, printing/PDF, dialogs, updater behavior, and packaged builds on supported OSes.
- Do not combine this migration with a TypeScript/Vue major upgrade unless a compatibility failure requires it.
- **Status: complete for the current target.** Electron is 44.3.0, better-sqlite3 is 13.0.3, @electron/rebuild is 4.2.0, and electron-builder is 26.16.1. Linux UI smoke tests and Windows x64 packaging pass in CI.

## Phase 4 — Language/build modernization
- Upgrade TypeScript and vue-tsc together.
- Then evaluate Vue/Vite/eslint/prettier major upgrades in small, independently testable changes.
- Resolve compiler errors before changing runtime behavior.
- Finish with a fresh lockfile audit and packaged smoke tests.
- **Status: substantially complete for the current compatibility envelope.** TypeScript 5.4.5 and vue-tsc 2.0.29 are enforced by CI; @vitejs/plugin-vue is 5.2.4, Vite is 5.4.21, @types/node is 22.18.6, and the build/package pipeline is green. Larger TypeScript/Vue/eslint major upgrades remain intentionally deferred as a separate migration track.

## CI verification baseline
The maintenance workflow must remain green before each subsequent modernization step. A successful run requires both the Linux checks job and Windows Electron build job to report `completed` + `success`.

The Linux checks include dependency installation, Electron runtime verification, lint, Vue/TypeScript typecheck, unit tests, production source build, Electron UI smoke tests, and dependency audit. The Windows job performs a full x64 Electron package build and verifies that an `.exe` artifact is produced.

## Current security notes
- Electron 44.3.0 is the current maintenance target and replaces the former Electron 22 baseline.
- lodash 4.18.1 is above the known 4.18.0 security floor for the 2026 template advisory.
- Vite 5.4.21 is at the 5.x security floor identified in the prior audit.
- Playwright 1.55.1 is at the patched floor for CVE-2025-59288.
- better-sqlite3 13.0.3 is native and is rebuilt/tested as part of the Electron maintenance pipeline.
- The remaining moderate AJV advisories should be resolved through a synchronized Yarn lockfile update rather than an unsynchronized manifest-only override.
