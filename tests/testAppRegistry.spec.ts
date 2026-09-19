import test from 'tape';
import { getApp, getAppRoutes, initializeApp, isAppInitialized, registerApp } from 'src/app/registry';

test('app registry: validates manifests', (t) => {
  t.throws(() => registerApp({ manifest: { id: '', name: 'Invalid', version: '1.0.0' } }), /manifest id/);
  t.throws(() => registerApp({ manifest: { id: 'test.missing-name', name: '', version: '1.0.0' } }), /manifest name/);
  t.throws(() => registerApp({ manifest: { id: 'test.missing-version', name: 'Missing Version', version: '' } }), /manifest version/);
  t.throws(() => registerApp({ manifest: { id: 'test.remote', name: 'Remote', version: '1.0.0', localOnly: false } }), /local-only/);
  t.end();
});

test('app registry: rejects duplicate app ids', (t) => {
  const id = 'test.duplicate-app';
  registerApp({ manifest: { id, name: 'First', version: '1.0.0' } });
  t.equal(getApp(id)?.manifest.name, 'First');
  t.throws(() => registerApp({ manifest: { id, name: 'Second', version: '1.0.0' } }), /already registered/);
  t.end();
});

test('app registry: rejects route collisions and tags ownership', (t) => {
  const path = '/test/app-registry-collision';
  registerApp({
    manifest: { id: 'test.route-owner', name: 'Route Owner', version: '1.0.0' },
    routes: [{ path, name: 'Test Route Owner', component: {} }],
  });
  const routes = getAppRoutes().filter((route) => route.path === path);
  t.equal(routes.length, 1);
  t.equal(routes[0]?.meta?.appId, 'test.route-owner');
  registerApp({
    manifest: { id: 'test.route-collision', name: 'Collision', version: '1.0.0' },
    routes: [{ path, name: 'Test Route Collision', component: {} }],
  });
  t.throws(() => getAppRoutes(), /route path .*already registered/);
  t.end();
});

test('app registry: initializes an app only once', async (t) => {
  const id = 'test.initialize-once';
  let setupCalls = 0;
  registerApp({
    manifest: { id, name: 'Initialize Once', version: '1.0.0' },
    setup: async () => { setupCalls += 1; },
  });
  await initializeApp(id);
  await initializeApp(id);
  t.equal(setupCalls, 1);
  t.equal(isAppInitialized(id), true);
  t.end();
});
