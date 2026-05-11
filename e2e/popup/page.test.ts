import { expect, test } from '../fixtures';

test('page title should be extension name', async ({ page, goto }) => {
	await goto.popup(page);
	expect(await page.title()).toEqual('Raindrop Sync for Chrome');
});

test('page looks like', async ({ page, goto }) => {
	await goto.popup(page);
	await expect(page).toHaveScreenshot('popup-main-page.png', { fullPage: true });
});
