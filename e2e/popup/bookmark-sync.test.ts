import type { BrowserContext, Page, Route } from '@playwright/test';
import { expect, test } from '../fixtures';

type MockCollection = {
	_id: number;
	title: string;
};

type MockRaindrop = {
	_id: number;
	title: string;
	link: string;
	collection: { $id: number };
};

/**
 * Install deterministic Raindrop API route mocks for a test.
 * @param context Browser context for route interception.
 * @param data Mock payloads for collections and raindrops.
 * @param data.collections Root-level collections payload.
 * @param data.childCollections Child collections payload.
 * @param data.raindrops Raindrops payload.
 */
async function installRaindropMocks(
	context: BrowserContext,
	data: {
		collections: MockCollection[];
		childCollections?: MockCollection[];
		raindrops: MockRaindrop[];
	}
): Promise<void> {
	await context.route('https://api.raindrop.io/rest/v1/**', async (route: Route) => {
		const requestUrl = new URL(route.request().url());
		const jsonHeaders = { 'content-type': 'application/json' };

		if (requestUrl.pathname === '/rest/v1/collections') {
			await route.fulfill({
				status: 200,
				headers: jsonHeaders,
				body: JSON.stringify({
					result: true,
					items: data.collections,
					count: data.collections.length
				})
			});
			return;
		}

		if (requestUrl.pathname === '/rest/v1/collections/childrens') {
			const childCollections = data.childCollections ?? [];
			await route.fulfill({
				status: 200,
				headers: jsonHeaders,
				body: JSON.stringify({
					result: true,
					items: childCollections,
					count: childCollections.length
				})
			});
			return;
		}

		if (requestUrl.pathname.startsWith('/rest/v1/raindrops/')) {
			await route.fulfill({
				status: 200,
				headers: jsonHeaders,
				body: JSON.stringify({
					result: true,
					items: data.raindrops,
					count: data.raindrops.length
				})
			});
			return;
		}

		await route.continue();
	});
}

/**
 * Trigger force sync from popup without asserting final outcome.
 * @param page Popup page.
 */
async function triggerForceSync(page: Page): Promise<void> {
	const forceSyncCheckbox = page.getByRole('checkbox', { name: 'Force sync' });
	if (!(await forceSyncCheckbox.isChecked())) {
		await page.getByText('Force sync', { exact: true }).click();
	}
	await expect(forceSyncCheckbox).toBeChecked();
	await page.getByLabel('Sync bookmarks').click();
}

/**
 * Trigger force sync and wait for successful completion message.
 * @param page Popup page.
 */
async function triggerForceSyncAndExpectSuccess(page: Page): Promise<void> {
	await triggerForceSync(page);
	await expect(
		page.getByText('Synchronization completed successfully.', { exact: true })
	).toBeVisible();
}

test.describe('popup bookmark synchronization', () => {
	test.beforeEach(async ({ extensionStorage }) => {
		await extensionStorage.clearAppSettings();
	});

	test('syncs mocked Raindrop data into configured Chrome bookmark folder', async ({
		page,
		context,
		extensionPages,
		extensionStorage,
		bookmarks
	}) => {
		const syncRoot = await bookmarks.createFolder({
			title: `E2E Sync Root ${Date.now()}`
		});

		await extensionStorage.setAppSettings({
			clientId: 'e2e-client-id',
			clientSecret: 'e2e-client-secret',
			accessToken: 'e2e-access-token',
			refreshToken: 'e2e-refresh-token',
			syncLocation: syncRoot.id,
			useLegacySyncMechanism: false
		});

		await installRaindropMocks(context, {
			collections: [{ _id: 100, title: 'Work' }],
			raindrops: [
				{
					_id: 200,
					title: 'Example Link',
					link: 'https://example.com',
					collection: { $id: 100 }
				}
			]
		});

		await extensionPages.gotoPopupPage(page);
		await triggerForceSyncAndExpectSuccess(page);

		const syncResult = await page.evaluate(async (syncRootId) => {
			const [root] = await chrome.bookmarks.getTree();
			const queue = [...(root?.children ?? [])];
			let workFolderId: string | null = null;
			let bookmarkFound = false;

			while (queue.length > 0) {
				const node = queue.shift()!;
				if (node.title === 'Work' && node.parentId === syncRootId && node.url === undefined) {
					workFolderId = node.id;
				}
				if (
					node.title === 'Example Link' &&
					node.parentId === workFolderId &&
					node.url === 'https://example.com/'
				) {
					bookmarkFound = true;
				}
				queue.push(...(node.children ?? []));
			}

			if (syncRootId) {
				await chrome.bookmarks.removeTree(syncRootId);
			}

			return {
				workFolderId,
				bookmarkFound
			};
		}, syncRoot.id);

		expect(syncResult.workFolderId).toBeTruthy();
		expect(syncResult.bookmarkFound).toBe(true);
	});

	/**
	 * Fixture diagram
	 * Target (before)
	 *   SyncRoot
	 *   |- Work
	 *   |  |- Delete 1 (https://delete-1.example)
	 *   |  |- Delete 2 (https://delete-2.example)
	 *   |  |- Update 1 (https://old-1.example)
	 *   |  |- Update 2 (https://old-2.example)
	 *   `- Personal
	 *      |- Keep 1 (https://keep-1.example)
	 *      `- Keep 2 (https://keep-2.example)
	 *
	 * Source (mocked Raindrop)
	 *   Raindrop.io
	 *   |- Work
	 *   |  |- Create 1 (https://create-1.example)
	 *   |  |- Create 2 (https://create-2.example)
	 *   |  |- Update 1 (https://new-1.example)
	 *   |  `- Update 2 (https://new-2.example)
	 *   `- Personal
	 *      |- Keep 1 (https://keep-1.example)
	 *      `- Keep 2 (https://keep-2.example)
	 *
	 * Covered feature
	 *   Mixed-diff synchronization in one run: >1 create, >1 delete, >1 update,
	 *   and >1 unchanged bookmarks preserved.
	 */
	test('handles mixed synchronization changes in one run', async ({
		page,
		context,
		extensionPages,
		extensionStorage,
		bookmarks
	}) => {
		const syncRoot = await bookmarks.createFolder({ title: `E2E Complex Root ${Date.now()}` });

		await extensionStorage.setAppSettings({
			clientId: 'e2e-client-id',
			clientSecret: 'e2e-client-secret',
			accessToken: 'e2e-access-token',
			refreshToken: 'e2e-refresh-token',
			syncLocation: syncRoot.id,
			useLegacySyncMechanism: false
		});

		await installRaindropMocks(context, {
			collections: [
				{ _id: 300, title: 'Work' },
				{ _id: 301, title: 'Personal' }
			],
			raindrops: [
				{ _id: 400, title: 'Create 1', link: 'https://create-1.example', collection: { $id: 300 } },
				{ _id: 401, title: 'Create 2', link: 'https://create-2.example', collection: { $id: 300 } },
				{ _id: 402, title: 'Update 1', link: 'https://new-1.example', collection: { $id: 300 } },
				{ _id: 403, title: 'Update 2', link: 'https://new-2.example', collection: { $id: 300 } },
				{ _id: 404, title: 'Keep 1', link: 'https://keep-1.example', collection: { $id: 301 } },
				{ _id: 405, title: 'Keep 2', link: 'https://keep-2.example', collection: { $id: 301 } }
			]
		});

		await extensionPages.gotoPopupPage(page);
		await page.evaluate(async (syncRootId) => {
			const workFolder = await chrome.bookmarks.create({ parentId: syncRootId, title: 'Work' });
			const personalFolder = await chrome.bookmarks.create({
				parentId: syncRootId,
				title: 'Personal'
			});

			await chrome.bookmarks.create({
				parentId: workFolder.id,
				title: 'Delete 1',
				url: 'https://delete-1.example'
			});
			await chrome.bookmarks.create({
				parentId: workFolder.id,
				title: 'Delete 2',
				url: 'https://delete-2.example'
			});
			await chrome.bookmarks.create({
				parentId: workFolder.id,
				title: 'Update 1',
				url: 'https://old-1.example'
			});
			await chrome.bookmarks.create({
				parentId: workFolder.id,
				title: 'Update 2',
				url: 'https://old-2.example'
			});
			await chrome.bookmarks.create({
				parentId: personalFolder.id,
				title: 'Keep 1',
				url: 'https://keep-1.example'
			});
			await chrome.bookmarks.create({
				parentId: personalFolder.id,
				title: 'Keep 2',
				url: 'https://keep-2.example'
			});
		}, syncRoot.id);

		await triggerForceSyncAndExpectSuccess(page);

		const result = await page.evaluate(async (syncRootId) => {
			const [root] = await chrome.bookmarks.getTree();
			const queue = [...(root?.children ?? [])];
			const allNodes: Array<{ id: string; title: string; parentId?: string; url?: string }> = [];

			while (queue.length > 0) {
				const node = queue.shift()!;
				allNodes.push({ id: node.id, title: node.title, parentId: node.parentId, url: node.url });
				queue.push(...(node.children ?? []));
			}

			const work = allNodes.find(
				(node) => node.title === 'Work' && node.parentId === syncRootId && node.url === undefined
			);
			const personal = allNodes.find(
				(node) =>
					node.title === 'Personal' && node.parentId === syncRootId && node.url === undefined
			);

			const workChildren = allNodes.filter((node) => node.parentId === work?.id);
			const personalChildren = allNodes.filter((node) => node.parentId === personal?.id);

			await chrome.bookmarks.removeTree(syncRootId);
			return {
				workChildren,
				personalChildren
			};
		}, syncRoot.id);

		const titles = [...result.workChildren, ...result.personalChildren].map((item) => item.title);
		expect(titles).toContain('Create 1');
		expect(titles).toContain('Create 2');
		expect(titles).toContain('Update 1');
		expect(titles).toContain('Update 2');
		expect(titles).toContain('Keep 1');
		expect(titles).toContain('Keep 2');
		expect(titles).not.toContain('Delete 1');
		expect(titles).not.toContain('Delete 2');

		const update1 = result.workChildren.find((item) => item.title === 'Update 1');
		const update2 = result.workChildren.find((item) => item.title === 'Update 2');
		const keep1 = result.personalChildren.find((item) => item.title === 'Keep 1');
		const keep2 = result.personalChildren.find((item) => item.title === 'Keep 2');
		expect(update1?.url).toBe('https://new-1.example/');
		expect(update2?.url).toBe('https://new-2.example/');
		expect(keep1?.url).toBe('https://keep-1.example/');
		expect(keep2?.url).toBe('https://keep-2.example/');
	});

	/**
	 * Fixture diagram
	 * Source (mocked Raindrop, conflicting same-path entries)
	 *   Raindrop.io
	 *   `- Work
	 *      |- Duplicate (https://conflict.example/first)
	 *      `- Duplicate (https://conflict.example/second)
	 *
	 * Target (before)
	 *   SyncRoot (empty)
	 *
	 * Covered feature
	 *   Conflict handling when the source includes same-title bookmarks under the
	 *   same parent path: sync should converge to a deterministic single bookmark.
	 */
	test.skip('resolves conflicting source bookmarks into a deterministic result', async ({
		page,
		context,
		extensionPages,
		extensionStorage,
		bookmarks
	}) => {
		const syncRoot = await bookmarks.createFolder({ title: `E2E Conflict Root ${Date.now()}` });

		await extensionStorage.setAppSettings({
			clientId: 'e2e-client-id',
			clientSecret: 'e2e-client-secret',
			accessToken: 'e2e-access-token',
			refreshToken: 'e2e-refresh-token',
			syncLocation: syncRoot.id,
			useLegacySyncMechanism: false
		});

		await installRaindropMocks(context, {
			collections: [{ _id: 500, title: 'Work' }],
			raindrops: [
				{
					_id: 600,
					title: 'Duplicate',
					link: 'https://conflict.example/first',
					collection: { $id: 500 }
				},
				{
					_id: 601,
					title: 'Duplicate',
					link: 'https://conflict.example/second',
					collection: { $id: 500 }
				}
			]
		});

		await extensionPages.gotoPopupPage(page);
		await triggerForceSyncAndExpectSuccess(page);

		const result = await page.evaluate(async (syncRootId) => {
			const [root] = await chrome.bookmarks.getTree();
			const queue = [...(root?.children ?? [])];
			let workId: string | null = null;
			const duplicates: Array<{ title: string; url?: string | null; parentId?: string }> = [];

			while (queue.length > 0) {
				const node = queue.shift()!;
				if (node.title === 'Work' && node.parentId === syncRootId && node.url === undefined) {
					workId = node.id;
				}
				if (node.title === 'Duplicate') {
					duplicates.push({ title: node.title, url: node.url, parentId: node.parentId });
				}
				queue.push(...(node.children ?? []));
			}

			await chrome.bookmarks.removeTree(syncRootId);
			return { workId, duplicates };
		}, syncRoot.id);

		expect(result.workId).toBeTruthy();
		const underWork = result.duplicates.filter((node) => node.parentId === result.workId);
		expect(underWork).toHaveLength(1);
		expect(underWork[0]?.url).toBe('https://conflict.example/second');
	});

	/**
	 * Fixture diagram
	 * Target (before)
	 *   Browser Bookmarks
	 *   `- Existing Folder
	 *      `- Existing Link (https://existing.example)
	 *
	 * Source (mocked Raindrop)
	 *   Raindrop.io
	 *   `- Work
	 *      `- Should Not Sync (https://should-not-sync.example)
	 *
	 * Settings
	 *   syncLocation = non-existent-folder-id
	 *
	 * Covered feature
	 *   Validation guard: synchronization should stop early when sync location is
	 *   invalid, without mutating bookmark data.
	 */
	test('does not mutate bookmarks when sync location is invalid', async ({
		page,
		context,
		extensionPages,
		extensionStorage,
		bookmarks
	}) => {
		await extensionStorage.setAppSettings({
			clientId: 'e2e-client-id',
			clientSecret: 'e2e-client-secret',
			accessToken: 'e2e-access-token',
			refreshToken: 'e2e-refresh-token',
			syncLocation: 'non-existent-folder-id',
			useLegacySyncMechanism: false
		});

		await installRaindropMocks(context, {
			collections: [{ _id: 700, title: 'Work' }],
			raindrops: [
				{
					_id: 800,
					title: 'Should Not Sync',
					link: 'https://should-not-sync.example',
					collection: { $id: 700 }
				}
			]
		});

		await extensionPages.gotoPopupPage(page);

		const existingFolder = await bookmarks.createFolder({ title: `E2E Existing ${Date.now()}` });
		await page.evaluate(async (folderId) => {
			await chrome.bookmarks.create({
				parentId: folderId,
				title: 'Existing Link',
				url: 'https://existing.example'
			});
		}, existingFolder.id);

		await triggerForceSync(page);

		const snapshot = await page.evaluate(async (folderId) => {
			const [folder] = await chrome.bookmarks.getSubTree(folderId);
			const children = folder.children ?? [];
			await chrome.bookmarks.removeTree(folderId);
			return children.map((node) => ({ title: node.title, url: node.url }));
		}, existingFolder.id);

		expect(snapshot).toHaveLength(1);
		expect(snapshot[0]?.title).toBe('Existing Link');
		expect(snapshot[0]?.url).toBe('https://existing.example/');
	});

	/**
	 * Fixture diagram
	 * Target (before)
	 *   SyncRoot (empty)
	 *
	 * Source/API behavior
	 *   GET /rest/v1/collections -> 401 Unauthorized
	 *
	 * Covered feature
	 *   Error handling path for unauthorized Raindrop responses; popup should show
	 *   a synchronization error and avoid creating bookmarks.
	 */
	test('surfaces synchronization error on unauthorized source response', async ({
		page,
		context,
		extensionPages,
		extensionStorage,
		bookmarks
	}) => {
		const syncRoot = await bookmarks.createFolder({ title: `E2E Unauthorized ${Date.now()}` });

		await extensionStorage.setAppSettings({
			clientId: 'e2e-client-id',
			clientSecret: 'e2e-client-secret',
			accessToken: 'e2e-access-token',
			refreshToken: '',
			syncLocation: syncRoot.id,
			useLegacySyncMechanism: false
		});

		await context.route('https://api.raindrop.io/rest/v1/**', async (route: Route) => {
			const requestUrl = new URL(route.request().url());
			if (requestUrl.pathname === '/rest/v1/collections') {
				await route.fulfill({
					status: 401,
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						result: false,
						error: 'Unauthorized',
						errorMessage: 'Unauthorized'
					})
				});
				return;
			}
			await route.continue();
		});

		await extensionPages.gotoPopupPage(page);
		await triggerForceSync(page);
		await expect(
			page.getByText('Synchronization failed with error:', { exact: false })
		).toBeVisible();

		const postSyncNodes = await page.evaluate(async (syncRootId) => {
			const [folder] = await chrome.bookmarks.getSubTree(syncRootId);
			const children = folder.children ?? [];
			await chrome.bookmarks.removeTree(syncRootId);
			return children.length;
		}, syncRoot.id);

		expect(postSyncNodes).toBe(0);
	});

	/**
	 * Fixture diagram
	 * Source (constant mocked Raindrop)
	 *   Raindrop.io
	 *   `- Work
	 *      `- Stable Link (https://stable.example)
	 *
	 * Target (before)
	 *   SyncRoot (empty)
	 *
	 * Sequence
	 *   1) Force sync
	 *   2) Force sync again with identical source
	 *
	 * Covered feature
	 *   Idempotency: repeating sync against unchanged source should not create
	 *   duplicate bookmarks.
	 */
	test('is idempotent when synchronizing unchanged source repeatedly', async ({
		page,
		context,
		extensionPages,
		extensionStorage,
		bookmarks
	}) => {
		const syncRoot = await bookmarks.createFolder({ title: `E2E Idempotent ${Date.now()}` });

		await extensionStorage.setAppSettings({
			clientId: 'e2e-client-id',
			clientSecret: 'e2e-client-secret',
			accessToken: 'e2e-access-token',
			refreshToken: 'e2e-refresh-token',
			syncLocation: syncRoot.id,
			useLegacySyncMechanism: false
		});

		await installRaindropMocks(context, {
			collections: [{ _id: 900, title: 'Work' }],
			raindrops: [
				{
					_id: 901,
					title: 'Stable Link',
					link: 'https://stable.example',
					collection: { $id: 900 }
				}
			]
		});

		await extensionPages.gotoPopupPage(page);
		await triggerForceSyncAndExpectSuccess(page);
		await triggerForceSyncAndExpectSuccess(page);

		const duplicateCount = await page.evaluate(async (syncRootId) => {
			const [root] = await chrome.bookmarks.getTree();
			const queue = [...(root?.children ?? [])];
			let workId: string | null = null;
			let stableCount = 0;

			while (queue.length > 0) {
				const node = queue.shift()!;
				if (node.title === 'Work' && node.parentId === syncRootId && node.url === undefined) {
					workId = node.id;
				}
				if (
					node.title === 'Stable Link' &&
					node.parentId === workId &&
					node.url === 'https://stable.example/'
				) {
					stableCount++;
				}
				queue.push(...(node.children ?? []));
			}

			await chrome.bookmarks.removeTree(syncRootId);
			return stableCount;
		}, syncRoot.id);

		expect(duplicateCount).toBe(1);
	});
});
