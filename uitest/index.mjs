import { _electron as electron } from 'playwright';
import test from 'tape';

const test = test;

const electronPath = process.env.ELECTRON_PATH ?? undefined;

const app = await electron.launch({
  executablePath: electronPath,
  args: ['dist_electron/build/main/main.js'],
});

const window = await app.firstWindow();
const pageErrors = [];
const consoleMessages = [];

window.on('pageerror', (error) => pageErrors.push(error.stack ?? error.message));
window.on('console', (message) => consoleMessages.push(message.text()));

const testRun = test('Electron UI smoke test', async (t) => {
  try {
    t.equal(await window.title(), 'ContraBooks', 'title matches');
    await window.waitForLoadState('domcontentloaded');
    t.ok(await window.locator('body').isVisible(), 'window has loaded');

    const createNew = window.getByText('Create New', { exact: true });
    await createNew.waitFor({ state: 'visible' });
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
});

await testRun;
await app.close();
