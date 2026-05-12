import { expect, test } from './fixtures';

test.describe('service worker', () => {
	test('registers extension service worker', async ({ serviceWorker, extensionId }) => {
		expect(serviceWorker.url()).toEqual(
			`chrome-extension://${extensionId}/service-worker-loader.js`
		);
	});
});
