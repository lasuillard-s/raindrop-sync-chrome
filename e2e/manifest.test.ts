import { expect, test } from './fixtures';

test.describe('manifest', async () => {
	test('exposes expected manifest fields in extension context', async ({
		page,
		extensionPages
	}) => {
		await extensionPages.gotoOptionsPage(page);

		const manifest = await page.evaluate(() => chrome.runtime.getManifest());

		expect(manifest.manifest_version).toBe(3);
		expect(manifest.name).toBe('Raindrop Sync for Chrome');
		expect(manifest.version).toBeTruthy();
	});
});
