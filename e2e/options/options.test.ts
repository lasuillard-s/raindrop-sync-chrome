import { expect, test } from '../fixtures';
import { openTab } from '../helpers/pages';

test('page title should be extension name', async ({ page, extensionPages }) => {
	await extensionPages.gotoOptionsPage(page);
	expect(await page.title()).toEqual('Raindrop Sync for Chrome');
});

test('visit page', async ({ page, extensionPages }) => {
	await extensionPages.gotoOptionsPage(page);
	await expect(page.getByText('Bookmarks', { exact: true })).toBeVisible();
	await expect(page.getByText('Sync Location', { exact: true })).toBeVisible();

	// FIXME: Wait for the screenshot to be stable.
	//        Bookmarks in Sync Location section aren't rendered reliably, causing flaky screenshot tests.
	await page.waitForTimeout(3_000);

	await expect(page).toHaveScreenshot('options-tab-bookmarks.png', { fullPage: true });
});

test('tab Try It', async ({ page, extensionPages }) => {
	await extensionPages.gotoOptionsPage(page);
	await openTab(page, 'Try It');
	await expect(page.getByText('Test Raindrop Queries', { exact: true })).toBeVisible();
	await expect(page.getByTestId('query/send-button')).toBeVisible();
	await expect(page).toHaveScreenshot('options-tab-try-it.png', { fullPage: true });
});

test('tab Integration', async ({ page, extensionPages }) => {
	await extensionPages.gotoOptionsPage(page);
	await openTab(page, 'Integration');
	await expect(page.getByText('Raindrop.io Integration', { exact: true })).toBeVisible();
	await expect(page.getByText('Save Credentials', { exact: true })).toBeVisible();
	await expect(page).toHaveScreenshot('options-tab-integration.png', { fullPage: true });
});

test('tab About', async ({ page, extensionPages }) => {
	await extensionPages.gotoOptionsPage(page);
	await openTab(page, 'About');
	await expect(page.getByText('About This Extension', { exact: true })).toBeVisible();
	await expect(page.getByText('Extension Details', { exact: false })).toBeVisible();
	await expect(page).toHaveScreenshot('options-tab-about.png', { fullPage: true });
});
