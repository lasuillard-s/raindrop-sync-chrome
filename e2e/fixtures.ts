import { test as base, chromium, type BrowserContext, type Worker } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BookmarkFixture, ExtensionPagesFixture, ExtensionStorageFixture } from './helpers/browser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const test = base.extend<{
	context: BrowserContext;
	serviceWorker: Worker;
	extensionId: string;
	extensionPages: ExtensionPagesFixture;
	extensionStorage: ExtensionStorageFixture;
	bookmarks: BookmarkFixture;
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
	},
	extensionPages: async ({ extensionId }, use) => {
		await use(new ExtensionPagesFixture(extensionId));
	},
	extensionStorage: async ({ serviceWorker }, use) => {
		await use(new ExtensionStorageFixture(serviceWorker));
	},
	bookmarks: async ({ serviceWorker }, use) => {
		await use(new BookmarkFixture(serviceWorker));
	}
});

export const expect = test.expect;
