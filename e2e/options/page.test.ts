import { expect, test } from '../fixtures';

test('page title should be extension name', async ({ page, goto }) => {
	await goto.options(page);
	expect(await page.title()).toEqual('Raindrop Sync for Chrome');
});

test('page looks like', async ({ page, goto }) => {
	await goto.options(page);
	await expect(page.getByText('Bookmarks', { exact: true })).toBeVisible();
	await expect(page.getByText('Sync Location', { exact: true })).toBeVisible();

	// FIXME: Wait for the screenshot to be stable.
	//        Bookmarks in Sync Location section aren't rendered reliably, causing flaky screenshot tests.
	await page.waitForTimeout(3_000);

	await expect(page).toHaveScreenshot('options-tab-bookmarks.png', { fullPage: true });
});

test('tab "Try It" looks like', async ({ page, goto }) => {
	await goto.options(page, 'Try It');
	await expect(page).toHaveScreenshot('options-tab-try-it.png', { fullPage: true });
});

test('tab "Integration" looks like', async ({ page, goto }) => {
	await goto.options(page, 'Integration');
	await expect(page).toHaveScreenshot('options-tab-integration.png', { fullPage: true });
});

test('tab "About" looks like', async ({ page, goto }) => {
	await goto.options(page, 'About');
	await expect(page).toHaveScreenshot('options-tab-about.png', { fullPage: true });
});
