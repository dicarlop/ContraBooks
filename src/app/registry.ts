import type { RouteRecordRaw } from 'vue-router';
import type { ContraBooksApp, ContraBooksAppContext } from './types';
import { templateBuilderApp } from '../apps/template-builder';

const bundledApps: ContraBooksApp[] = [templateBuilderApp];
const apps = new Map<string, ContraBooksApp>();
const initializedApps = new Set<string>();

for (const app of bundledApps) {
  registerAppInternal(app);
}

function validateAppManifest(app: ContraBooksApp): void {
  const { manifest } = app;

  if (!manifest.id) {
    throw new Error('ContraBooks apps must declare a manifest id.');
  }

  if (!manifest.name) {
    throw new Error(`ContraBooks app "${manifest.id}" must declare a manifest name.`);
  }

  if (!manifest.version) {
    throw new Error(`ContraBooks app "${manifest.id}" must declare a manifest version.`);
  }

  if (manifest.localOnly === false) {
    throw new Error(
      `ContraBooks app "${manifest.id}" cannot disable the local-only host requirement.`
    );
  }
}

function registerAppInternal(app: ContraBooksApp): void {
  validateAppManifest(app);

  if (!app.manifest.id) {
    throw new Error('ContraBooks apps must declare a manifest id.');
  }

  if (apps.has(app.manifest.id)) {
    throw new Error(`ContraBooks app "${app.manifest.id}" is already registered.`);
  }

  apps.set(app.manifest.id, app);
}

export function registerApp(app: ContraBooksApp): void {
  registerAppInternal(app);
}

export function getApp(id: string): ContraBooksApp | undefined {
  return apps.get(id);
}

export function getApps(): ContraBooksApp[] {
  return [...apps.values()];
}

export function getEnabledApps(): ContraBooksApp[] {
  return getApps().filter((app) => app.manifest.enabledByDefault !== false);
}

export function getAppRoutes(): RouteRecordRaw[] {
  return getEnabledApps().flatMap((app) => app.routes ?? []);
}

export function isAppInitialized(id: string): boolean {
  return initializedApps.has(id);
}

export async function initializeApps(): Promise<void> {
  for (const app of getEnabledApps()) {
    if (initializedApps.has(app.manifest.id)) continue;

    const context: ContraBooksAppContext = {
      appId: app.manifest.id,
      version: app.manifest.version,
      isLocal: true,
    };

    if (app.setup) await app.setup(context);
    initializedApps.add(app.manifest.id);
  }
}
