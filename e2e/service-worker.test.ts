import { expect, test } from './fixtures';

test.describe('service worker', async () => {
	test('registers extension service worker', async ({ context, extensionId }) => {
		let [worker] = context.serviceWorkers();
		if (!worker) {
			worker = await context.waitForEvent('serviceworker');
		}

		expect(worker.url()).toContain(`chrome-extension://${extensionId}/`);
		expect(worker.url()).toContain('service-worker');
	});
});
