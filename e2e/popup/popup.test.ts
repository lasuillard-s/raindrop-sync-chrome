import { expect, test } from '../fixtures';

test('page title should be extension name', async ({ page, extensionPages }) => {
	await extensionPages.gotoPopupPage(page);
	expect(await page.title()).toEqual('Raindrop Sync for Chrome');
});

test('visit page', async ({ page, extensionPages }) => {
	await extensionPages.gotoPopupPage(page);
	await expect(page.getByRole('heading', { name: 'Raindrop Sync for Chrome' })).toBeVisible();
	await expect(page.getByLabel('Sync bookmarks')).toBeVisible();
	await expect(page.getByText('Force sync', { exact: true })).toBeVisible();
	await expect(page).toHaveScreenshot('popup-main-page.png', { fullPage: true });
});
