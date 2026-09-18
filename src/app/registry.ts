import type { RouteRecordRaw } from 'vue-router';
import type { ContraBooksApp } from './types';
import { templateBuilderApp } from '../apps/template-builder';

const bundledApps: ContraBooksApp[] = [templateBuilderApp];
const apps = new Map<string, ContraBooksApp>();

for (const app of bundledApps) {
  apps.set(app.manifest.id, app);
}

export function registerApp(app: ContraBooksApp): void {
  if (!app.manifest.id) {
    throw new Error('ContraBooks apps must declare a manifest id.');
  }

  if (apps.has(app.manifest.id)) {
    throw new Error(`ContraBooks app "${app.manifest.id}" is already registered.`);
  }

  apps.set(app.manifest.id, app);
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
