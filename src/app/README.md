# ContraBooks app architecture

ContraBooks is moving toward a local-first host plus modular apps.

## Host responsibilities

The core host owns:

- the Electron desktop shell
- local SQLite persistence and database access
- IPC and native desktop services
- authentication/permissions where applicable
- shared accounting/document contracts
- global navigation and application lifecycle

## App responsibilities

An app owns its:

- pages and components
- app-specific workflows
- app-specific state
- app-specific services
- app-specific database extensions/migrations when introduced
- navigation entries and routes

Apps communicate with the host through stable contracts instead of reaching into unrelated UI internals.

## Build model

The first implementation keeps bundled apps in the same desktop distribution and renderer bundle. This gives ContraBooks a real app boundary without introducing microfrontend or remote-code complexity.

Later, an app can be moved to its own package/build pipeline while keeping the same manifest and host contract.

## Local-first requirement

An installed app must not require a hosted ContraBooks service to function. Cloud integrations can be optional capabilities of an app, but local bookkeeping data and core application operation remain available without a cloud dependency.
