import { expect, test } from '../fixtures';

test('page title should be extension name', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
	expect(await page.title()).toEqual('Raindrop Sync for Chrome');
});

test('visit page', async ({ page, extensionId }) => {
	await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
	await expect(page.getByRole('heading', { name: 'Raindrop Sync for Chrome' })).toBeVisible();
	await expect(page.getByLabel('Sync bookmarks')).toBeVisible();
	await expect(page.getByText('Force sync', { exact: true })).toBeVisible();
});
