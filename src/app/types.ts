import type { RouteRecordRaw } from 'vue-router';

export interface ContraBooksAppContext {
  appId: string;
  version: string;
  isLocal: true;
}

export interface ContraBooksAppManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabledByDefault?: boolean;
  bundled?: boolean;
  localOnly?: boolean;
  permissions?: string[];
}

export interface ContraBooksApp {
  manifest: ContraBooksAppManifest;
  routes?: RouteRecordRaw[];
  setup?: (context: ContraBooksAppContext) => void | Promise<void>;
}
