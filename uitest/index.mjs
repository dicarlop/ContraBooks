import fs from 'fs/promises';
import os from 'os';
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

async function waitForDevTools(port, electronProcess, getStderr, timeout = 60_000) {
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

async function removeUserDataDir(userDataDir) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      await fs.rm(userDataDir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error?.code !== 'ENOTEMPTY' || attempt === 7) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

(async function run() {
  const port = await getFreePort();
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contrabooks-ui-'));
  const electronProcess = spawn(
    electronPath,
    [
      `--user-data-dir=${userDataDir}`,
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

  let browser;
  let window;
  try {
    await waitForDevTools(port, electronProcess, () => stderr);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const context = browser.contexts()[0];
    const pages = context.pages();
    window = pages[0] ?? (await context.waitForEvent('page', { timeout: 60_000 }));
    window.setDefaultTimeout(60_000);

    const consoleMessages = [];
    const pageErrors = [];
    window.on('console', (message) => {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    });
    window.on('pageerror', (error) => {
      pageErrors.push(error.stack || error.message);
    });

    test('Electron UI smoke test', (t) => {
      (async () => {
        t.equal(await window.title(), 'Frappe Books', 'title matches');
        await window.waitForLoadState('domcontentloaded');
        t.ok(true, 'window has loaded');

        const createNew = window.getByTestId('create-new-file');
        try {
          await createNew.waitFor({ state: 'visible' });
        } catch (error) {
          const bodyText = await window.locator('body').innerText().catch(() => '');
          const testIds = await window
            .locator('[data-testid]')
            .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-testid')))
            .catch(() => []);
          throw new Error(
            `${error.message}\nBody text:\n${bodyText}\nTest IDs: ${testIds.join(', ')}\nPage errors:\n${pageErrors.join('\n')}\nConsole:\n${consoleMessages.join('\n')}`
          );
        }
        t.ok(await createNew.isVisible(), 'create new is visible');

        await createNew.click();
        await window.getByTestId('submit-button').waitFor();
        t.equal(
          await window.getByTestId('submit-button').isDisabled(),
          true,
          'submit button is disabled before form fill'
        );

        await window.getByPlaceholder('Company Name').fill('Test Company');
        await window.getByPlaceholder('John Doe').fill('Test Owner');
        await window.getByPlaceholder('john@doe.com').fill('test@example.com');

        const country = window.getByPlaceholder('Select Country');
        await country.click();
        await country.fill('India');
        const indiaOption = window.locator('a:visible').filter({ hasText: /^India$/ }).last();
        await indiaOption.waitFor({ state: 'visible' });
        await indiaOption.click();

        const currency = window.getByPlaceholder('Currency');
        await currency.click();
        await currency.fill('INR');
        const inrOption = window.locator('a:visible').filter({ hasText: /^INR$/ }).last();
        await inrOption.waitFor({ state: 'visible' });
        await inrOption.click();

        const chartOfAccounts = window.getByPlaceholder('Select CoA');
        await chartOfAccounts.click();
        await chartOfAccounts.fill('India');
        const indiaCoaOption = window
          .locator('a:visible')
          .filter({ hasText: /^India - Chart of Accounts$/ })
          .last();
        await indiaCoaOption.waitFor({ state: 'visible' });
        await indiaCoaOption.click();

        await window.getByPlaceholder('Fiscal Year Start Date').fill('2026-04-01');
        await window.getByPlaceholder('Fiscal Year End Date').fill('2027-03-31');

        const bank = window.getByPlaceholder('Prime Bank');
        await bank.fill('Test Bank');
        await bank.blur();

        await window.getByTestId('submit-button').waitFor({ state: 'visible' });
        await window.waitForFunction(
          () => !document.querySelector('[data-testid="submit-button"]')?.hasAttribute('disabled')
        );
        t.equal(
          await window.getByTestId('submit-button').isDisabled(),
          false,
          'submit button enabled after form fill'
        );

        await window.getByTestId('submit-button').click();
        const companyName = await window.getByTestId('company-name').innerText();
        t.equal(
          companyName.trim().toLowerCase(),
          'test company',
          'new instance created, company name found in sidebar'
        );

        t.equal(pageErrors.length, 0, 'renderer produced no page errors');
        t.pass('UI flow completed');
        t.end();
      })()
        .catch((error) => {
          t.fail(error instanceof Error ? error.stack || error.message : String(error));
          t.end();
        })
        .finally(async () => {
          await browser?.close().catch(() => {});
          if (!electronProcess.killed) electronProcess.kill('SIGTERM');
          if (stdout) process.stdout.write(stdout);
          if (stderr) process.stderr.write(stderr);
          await removeUserDataDir(userDataDir);
        });
    });
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    if (!electronProcess.killed) electronProcess.kill('SIGTERM');
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    await removeUserDataDir(userDataDir).catch(() => {});
    test('Electron UI startup', (t) => {
      t.fail(error instanceof Error ? error.stack || error.message : String(error));
      t.end();
    });
  }
})();
