import test from 'tape';
import { _electron as electron } from 'playwright';
import path from 'path';

const appPath = path.join(process.cwd(), 'dist_electron/build');

async function getWindow(app) {
  const window = await app.firstWindow();
  return window;
}

test('Electron UI smoke test', async (t) => {
  const app = await electron.launch({ args: [appPath] });
  const window = await getWindow(app);

  try {
    const createNew = window.getByTestId('create-new-file');
    await createNew.waitFor({ state: 'visible' });
    t.equal(await window.title(), 'ContraBooks', 'title matches');
    t.ok(await window.locator('body').isVisible(), 'window has loaded');
    t.pass('create new is visible');

    await createNew.click();
    await window.getByTestId('submit-button').waitFor({ state: 'visible' });
    t.equal(
      await window.getByTestId('submit-button').isDisabled(),
      true,
      'submit button is disabled before form fill'
    );

    await window.getByPlaceholder('Company Name').fill('Test Company');
    await window.getByPlaceholder('John Doe').fill('Test Person');
    await window.getByPlaceholder('john@doe.com').fill('test@testmyfantasy.com');

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

    const setDateValue = async (placeholder, value) => {
      const input = window.locator(`input[type="date"][placeholder="${placeholder}"]`);
      await input.evaluate((element, nextValue) => {
        const inputElement = element;
        inputElement.value = nextValue;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        inputElement.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      }, value);
    };

    await setDateValue('Fiscal Year Start Date', '2026-04-01');
    await setDateValue('Fiscal Year End Date', '2027-03-31');

    const bank = window.getByPlaceholder('Prime Bank');
    await bank.fill('Test Bank');
    await bank.blur();

    await window.getByTestId('company-file-password').fill('test-password');
    await window
      .getByTestId('company-file-password-confirm')
      .fill('test-password');

    const submitButton = window.getByTestId('submit-button');
    await submitButton.waitFor({ state: 'visible' });
    await window.waitForFunction(
      () => document.querySelector('[data-testid="submit-button"]')?.disabled === false
    );
    t.equal(
      await submitButton.isDisabled(),
      false,
      'submit button enabled after form fill'
    );

    await submitButton.click();
    await window.waitForTimeout(1000);
    t.pass('setup wizard submitted');
  } finally {
    await app.close();
  }
});
