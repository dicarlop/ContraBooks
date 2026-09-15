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
    await window.getByPlaceholder('Full Name').fill('Test Person');
    await window.getByPlaceholder('Email').fill('test@testmyfantasy.com');

    const country = window.getByPlaceholder('Select Country');
    await country.click();
    await country.fill('India');
    const indiaOption = window.locator('a:visible').filter({ hasText: /^India$/ }).last();
    await indiaOption.waitFor({ state: 'visible' });
    await indiaOption.click();

    const currency = window.getByPlaceholder('Select Currency');
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

    const fiscalYearStart = window.locator(
      'input[type="date"]:visible[placeholder="Fiscal Year Start Date"]'
    );
    const fiscalYearEnd = window.locator(
      'input[type="date"]:visible[placeholder="Fiscal Year End Date"]'
    );
    await fiscalYearStart.fill('2026-04-01');
    await fiscalYearEnd.fill('2027-03-31');

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
    await window.waitForTimeout(1000);
    t.pass('setup wizard submitted');
  } finally {
    await app.close();
  }
});
