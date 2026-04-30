import { test as base, chromium, type BrowserContext, type Worker } from '@playwright/test';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const test = base.extend<{
	context: BrowserContext;
	serviceWorker: Worker;
	extensionId: string;
}>({
	// eslint-disable-next-line no-empty-pattern
	context: async ({}, use) => {
		const pathToExtension = path.join(__dirname, '..', 'dist');
		const context = await chromium.launchPersistentContext('', {
			channel: 'chromium',
			args: [
				`--disable-extensions-except=${pathToExtension}`,
				`--load-extension=${pathToExtension}`
			]
		});
		await use(context);
		await context.close();
	},
	serviceWorker: async ({ context }, use) => {
		let [worker] = context.serviceWorkers();
		if (!worker) worker = await context.waitForEvent('serviceworker');
		await use(worker);
	},
	extensionId: async ({ serviceWorker }, use) => {
		const extensionId = serviceWorker.url().split('/')[2];
		await use(extensionId);
	}
});

export const expect = test.expect;
