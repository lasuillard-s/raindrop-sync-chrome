import { expect, test } from '^/e2e/fixtures';

test('page title should be extension name', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	expect(await page.title()).toEqual('Raindrop Sync for Chrome');
});

test('visit page', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	await expect(page).toHaveScreenshot({ fullPage: true });
});

test('tab Try It', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	await page.getByText('Try It').click();
	await expect(page).toHaveScreenshot({ fullPage: true });
});

test('tab Settings', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	await page.getByText('Settings', { exact: true }).click();
	await expect(page).toHaveScreenshot({ fullPage: true });
});

test('tab About', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	await page.getByText('About').click();
	await expect(page).toHaveScreenshot({ fullPage: true });
});
