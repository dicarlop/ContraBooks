import path from 'path';
import { spawn } from 'child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import test from 'tape';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..');
const electronPath = path.join(root, 'node_modules', 'electron', 'dist', 'electron');
const appSourcePath = path.join(root, 'dist_electron', 'build', 'main.js');

async function getFreePort() {
  const { createServer } = await import('net');
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForDevTools(port, electronProcess, getStderr, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  const url = `http://127.0.0.1:${port}/json/version`;

  while (Date.now() < deadline) {
    if (electronProcess.exitCode !== null) {
      throw new Error(
        `Electron exited with code ${electronProcess.exitCode}\n${getStderr()}`
      );
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_) {
      // Electron has not opened its DevTools endpoint yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `Timed out waiting for Electron DevTools on port ${port}\n${getStderr()}`
  );
}

(async function run() {
  const port = await getFreePort();
  const electronProcess = spawn(
    electronPath,
    [
      `--remote-debugging-port=${port}`,
      '--remote-debugging-address=127.0.0.1',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      appSourcePath,
    ],
    {
      cwd: root,
      env: { ...process.env, IS_TEST: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let stderr = '';
  let stdout = '';
  electronProcess.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  electronProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForDevTools(port, electronProcess, () => stderr, 60_000);
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const context = browser.contexts()[0];
    const pages = context.pages();
    const window = pages[0] ?? (await context.waitForEvent('page', { timeout: 60_000 }));
    window.setDefaultTimeout(60_000);

    test('load app', async (t) => {
      t.equal(await window.title(), 'Frappe Books', 'title matches');
      await window.waitForLoadState('domcontentloaded');
      t.ok(true, 'window has loaded');
    });

    test('navigate to database selector', async (t) => {
      const changeDb = window.getByTestId('change-db');
      const createNew = window.getByTestId('create-new-file');

      const changeDbPromise = changeDb
        .waitFor({ state: 'visible' })
        .then(() => 'change-db');
      const createNewPromise = createNew
        .waitFor({ state: 'visible' })
        .then(() => 'create-new-file');

      const el = await Promise.race([changeDbPromise, createNewPromise]);
      if (el === 'change-db') {
        await changeDb.click();
        await createNewPromise;
      }

      t.ok(await createNew.isVisible(), 'create new is visible');
    });

    test('fill setup form', async (t) => {
      await window.getByTestId('create-new-file').click();
      await window.getByTestId('submit-button').waitFor();

      t.equal(
        await window.getByTestId('submit-button').isDisabled(),
        true,
        'submit button is disabled before form fill'
      );

      await window.getByPlaceholder('Company Name').fill('Test Company');
      await window.getByPlaceholder('John Doe').fill('Test Owner');
      await window.getByPlaceholder('john@doe.com').fill('test@example.com');
      await window.getByPlaceholder('Select Country').fill('India');
      await window.getByPlaceholder('Select Country').blur();
      await window.getByPlaceholder('Prime Bank').fill('Test Bank');
      await window.getByPlaceholder('Prime Bank').blur();

      t.equal(
        await window.getByTestId('submit-button').isDisabled(),
        false,
        'submit button enabled after form fill'
      );
    });

    test('create new instance', async (t) => {
      await window.getByTestId('submit-button').click();
      t.equal(
        await window.getByTestId('company-name').innerText(),
        'Test Company',
        'new instance created, company name found in sidebar'
      );
    });

    test('close app', async (t) => {
      await browser.close();
      t.ok(true, 'app closed without errors');
    });

    await new Promise((resolve) => test.on('complete', resolve));
  } finally {
    if (!electronProcess.killed) electronProcess.kill('SIGTERM');
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  }
})();
