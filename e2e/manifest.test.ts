import { expect, test } from './fixtures';

test.describe('manifest', () => {
	test('exposes expected manifest fields in extension context', async ({ page, goto }) => {
		await goto.options(page);
		const manifest = await page.evaluate(() => chrome.runtime.getManifest());
		expect(manifest.manifest_version).toBe(3);
		expect(manifest.name).toBe('Raindrop Sync for Chrome');
		expect(manifest.version).toBeTruthy();
	});
});
