import { expect, test } from '../fixtures';

test('page title should be extension name', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	expect(await page.title()).toEqual('Raindrop Sync for Chrome');
});

test('visit page', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	await expect(page.getByText('Bookmarks', { exact: true })).toBeVisible();
	await expect(page.getByText('Sync Location', { exact: true })).toBeVisible();
});

test('tab Try It', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	await page.getByRole('tab', { name: 'Try It' }).click({ force: true });
	await expect(page.getByText('Test Raindrop Queries', { exact: true })).toBeVisible();
	await expect(page.getByTestId('query/send-button')).toBeVisible();
});

test('tab Integration', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	await page.getByRole('tab', { name: 'Integration' }).click({ force: true });
	await expect(page.getByText('Raindrop.io Integration', { exact: true })).toBeVisible();
	await expect(page.getByText('Save Credentials', { exact: true })).toBeVisible();
});

test('tab About', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
	await page.getByRole('tab', { name: 'About' }).click({ force: true });
	await expect(page.getByText('About This Extension', { exact: true })).toBeVisible();
	await expect(page.getByText('Extension Details', { exact: false })).toBeVisible();
});
