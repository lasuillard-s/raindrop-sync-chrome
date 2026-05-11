import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';

/**
 * Update a range input and dispatch the events Svelte listens for.
 * @param page Playwright page.
 * @param selector Selector that resolves to an input[type=range].
 * @param value Desired numeric value.
 */
async function setRangeValue(page: Page, selector: string, value: number): Promise<void> {
	await page.locator(selector).evaluate((element, nextValue) => {
		const input = element as HTMLInputElement;
		input.value = String(nextValue);
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
	}, value);
}

test.beforeEach(async ({ appSettings }) => {
	await appSettings.clear();
});

test('persists sync interval after saving and reloading options page', async ({
	page,
	goto,
	appSettings
}) => {
	await goto.options(page);

	// Set to a non-default value to verify that the change is persisted.
	await setRangeValue(page, 'input[type="range"]', 11);
	await expect(page.getByText('Every 11 minutes', { exact: true })).toBeVisible();

	// Save settings and verify that the success message is shown.
	await page.getByRole('button', { name: 'Save Settings' }).click();
	await expect(page.getByText('Sync settings saved.', { exact: true })).toBeVisible();

	// Verify that the new settings are persisted in the repository.
	const saved = await appSettings.get();
	expect(saved).not.toBeNull();
	expect(saved?.autoSyncIntervalInMinutes).toBe(11);

	// Reload the page and verify that the UI reflects the persisted settings.
	await page.reload();
	await expect(page.getByText('Every 11 minutes', { exact: true })).toBeVisible();
});

test('persists integration credentials after saving and reloading options page', async ({
	page,
	goto,
	appSettings
}) => {
	await goto.options(page, 'Integration');

	// Fill in the credentials form with test values.
	await page.getByLabel('Client ID').fill('e2e-client-id');
	await page.getByLabel('Client Secret').fill('e2e-client-secret');
	await page.getByLabel('Access Token').fill('e2e-access-token');
	await page.getByLabel('Refresh Token').fill('e2e-refresh-token');

	// Save settings and verify that the success message is shown.
	await page.getByRole('button', { name: 'Save Credentials' }).click();
	await expect(page.getByText('Settings saved.', { exact: true })).toBeVisible();

	// Verify that the new settings are persisted in the repository.
	const saved = await appSettings.get();
	expect(saved).not.toBeNull();
	expect(saved?.clientId).toBe('e2e-client-id');
	expect(saved?.clientSecret).toBe('e2e-client-secret');
	expect(saved?.accessToken).toBe('e2e-access-token');
	expect(saved?.refreshToken).toBe('e2e-refresh-token');

	// Reload the page and verify that the UI reflects the persisted settings.
	await page.reload();
	await goto.options(page, 'Integration');
	await expect(page.getByLabel('Client ID')).toHaveValue('e2e-client-id');
	await expect(page.getByLabel('Client Secret')).toHaveValue('e2e-client-secret');
	await expect(page.getByLabel('Access Token')).toHaveValue('e2e-access-token');
	await expect(page.getByLabel('Refresh Token')).toHaveValue('e2e-refresh-token');
});

test('persists sync location selection after saving and reloading options page', async ({
	page,
	goto,
	appSettings
}) => {
	await goto.options(page);

	// Select the first available sync location (bookmark folder)
	const firstSyncLocationItem = page.locator('input[name="sync-location"]').first();
	await expect(firstSyncLocationItem).toBeVisible();
	const selectedFolderId = await firstSyncLocationItem.getAttribute('value');
	expect(selectedFolderId).toBeTruthy();
	await firstSyncLocationItem.check();

	// Save settings and verify that the success message is shown.
	await page.getByRole('button', { name: 'Save Settings' }).click();
	await expect(page.getByText('Sync settings saved.', { exact: true })).toBeVisible();

	// Verify that the new settings are persisted in the repository.
	const saved = await appSettings.get();
	expect(saved).not.toBeNull();
	expect(saved?.syncLocation).toBe(selectedFolderId);

	// Reload the page and verify that the UI reflects the persisted settings.
	await page.reload();
	await expect(
		page.locator(`input[name="sync-location"][value="${selectedFolderId}"]`)
	).toBeChecked();
});
