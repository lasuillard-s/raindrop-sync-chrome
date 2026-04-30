import { expect, test } from '../fixtures';
import { openTab, setRangeValue } from '../helpers/pages';

test.describe('options settings persistence', () => {
	test.beforeEach(async ({ extensionStorage }) => {
		await extensionStorage.clearAppSettings();
	});

	test('persists sync interval after saving and reloading options page', async ({
		page,
		extensionPages,
		extensionStorage
	}) => {
		await extensionPages.gotoOptionsPage(page);

		await setRangeValue(page, 'input[type="range"]', 11);
		await page.getByRole('button', { name: 'Save Settings' }).click();
		await expect(page.getByText('Sync settings saved.', { exact: true })).toBeVisible();

		await expect(page.getByText('Every 11 minutes', { exact: true })).toBeVisible();

		const saved = await extensionStorage.getAppSettings();
		expect(saved).not.toBeNull();
		expect(saved?.autoSyncIntervalInMinutes).toBe(11);

		await page.reload();
		await expect(page.getByText('Every 11 minutes', { exact: true })).toBeVisible();
	});

	test('persists integration credentials after saving and reloading options page', async ({
		page,
		extensionPages,
		extensionStorage
	}) => {
		await extensionPages.gotoOptionsPage(page);
		await openTab(page, 'Integration');

		await page.getByLabel('Client ID').fill('e2e-client-id');
		await page.getByLabel('Client Secret').fill('e2e-client-secret');
		await page.getByLabel('Access Token').fill('e2e-access-token');
		await page.getByLabel('Refresh Token').fill('e2e-refresh-token');

		await page.getByRole('button', { name: 'Save Credentials' }).click();
		await expect(page.getByText('Settings saved.', { exact: true })).toBeVisible();

		const saved = await extensionStorage.getAppSettings();
		expect(saved).not.toBeNull();
		expect(saved?.clientId).toBe('e2e-client-id');
		expect(saved?.clientSecret).toBe('e2e-client-secret');
		expect(saved?.accessToken).toBe('e2e-access-token');
		expect(saved?.refreshToken).toBe('e2e-refresh-token');

		await page.reload();
		await openTab(page, 'Integration');
		await expect(page.getByLabel('Client ID')).toHaveValue('e2e-client-id');
		await expect(page.getByLabel('Client Secret')).toHaveValue('e2e-client-secret');
		await expect(page.getByLabel('Access Token')).toHaveValue('e2e-access-token');
		await expect(page.getByLabel('Refresh Token')).toHaveValue('e2e-refresh-token');
	});

	test('persists sync location selection after saving and reloading options page', async ({
		page,
		extensionPages,
		extensionStorage
	}) => {
		await extensionPages.gotoOptionsPage(page);
		const firstRadio = page.locator('input[name="sync-location"]').first();
		await expect(firstRadio).toBeVisible();
		const selectedFolderId = await firstRadio.getAttribute('value');
		expect(selectedFolderId).toBeTruthy();
		await firstRadio.check();
		await page.getByRole('button', { name: 'Save Settings' }).click();
		await expect(page.getByText('Sync settings saved.', { exact: true })).toBeVisible();

		const saved = await extensionStorage.getAppSettings();
		expect(saved).not.toBeNull();
		expect(saved?.syncLocation).toBe(selectedFolderId);

		await page.reload();
		await expect(
			page.locator(`input[name="sync-location"][value="${selectedFolderId}"]`)
		).toBeChecked();
	});
});
