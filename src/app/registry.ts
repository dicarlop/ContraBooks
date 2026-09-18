import type { ContraBooksApp } from './types';
import { templateBuilderApp } from '../apps/template-builder';

const bundledApps: ContraBooksApp[] = [templateBuilderApp];

const apps = new Map<string, ContraBooksApp>(
  bundledApps.map((app) => [app.manifest.id, app]),
);

export function getApp(id: string): ContraBooksApp | undefined {
  return apps.get(id);
}

export function getApps(): ContraBooksApp[] {
  return [...apps.values()];
}

export function getEnabledApps(): ContraBooksApp[] {
  return getApps().filter((app) => app.manifest.enabledByDefault !== false);
}

export function getAppRoutes(): ContraBooksApp['routes'] {
  return getEnabledApps().flatMap((app) => app.routes ?? []);
}
