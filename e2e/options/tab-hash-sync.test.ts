import { expect, test } from '../fixtures';

test('defaults to the bookmarks hash when the page loads without one', async ({ page, goto }) => {
	await goto.options(page);

	await expect(page).toHaveURL(/#bookmarks$/);
	await expect(page.getByRole('tab', { name: 'Bookmarks' })).toHaveAttribute(
		'aria-selected',
		'true'
	);
});

test('restores the selected tab from the URL hash', async ({ page, extensionId }) => {
	// Visit the options page with a specific hash
	await page.goto(`chrome-extension://${extensionId}/src/options/index.html#integration`, {
		waitUntil: 'load'
	});

	await expect(page.getByRole('tab', { name: 'Integration' })).toHaveAttribute(
		'aria-selected',
		'true'
	);
});

test('updates the URL hash when the selected tab changes', async ({ page, goto }) => {
	await goto.options(page);

	// Click on the "About" tab to change the selected tab
	await page.getByRole('tab', { name: 'About' }).click();

	await expect(page).toHaveURL(/#about$/);
	await expect(page.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true');
});

test('updates the selected tab when the URL hash changes externally', async ({ page, goto }) => {
	await goto.options(page);

	// Simulate an external change to the URL hash (e.g., user manually changes it or it's changed by another script)
	await page.evaluate(() => {
		window.location.hash = '#try-it';
	});

	await expect(page.getByRole('tab', { name: 'Try It' })).toHaveAttribute('aria-selected', 'true');
});
