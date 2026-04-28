import { expect, test } from './fixtures';

test.describe('service worker', async () => {
	test('registers extension service worker', async ({ serviceWorker, extensionId }) => {
		expect(serviceWorker.url()).toContain(`chrome-extension://${extensionId}/`);
		expect(serviceWorker.url()).toContain('service-worker');
	});
});
