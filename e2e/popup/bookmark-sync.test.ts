import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';

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
 * Assert that synchronization completed successfully message is visible in the popup.
 * @param page Popup page.
 */
async function expectSyncSuccess(page: Page): Promise<void> {
	await expect(
		page.getByText('Synchronization completed successfully.', { exact: true })
	).toBeVisible();
}

/**
 * Assert that synchronization completed successfully message is visible in the popup.
 * @param page Popup page.
 */
async function notExpectSyncSuccess(page: Page): Promise<void> {
	await expect(
		page.getByText('Synchronization completed successfully.', { exact: true })
	).not.toBeVisible();
}

test.beforeEach(async ({ appSettings }) => {
	await appSettings.clear();
});

test.afterEach(async ({ bookmarks }) => {
	await bookmarks.clearAllBookmarks();
});

test('syncs mocked Raindrop data into configured Chrome bookmark folder', async ({
	page,
	goto,
	appSettings,
	bookmarks,
	raindropMocker
}) => {
	/* Target
	 *   Root
	 *   ├ Bookmarks bar
	 *   └ Other bookmarks
	 *     └ SyncRoot (empty)
	 */
	const syncRoot = await bookmarks.createFolder({
		title: `Sync Root`
	});
	await appSettings.set({
		clientId: 'e2e-client-id',
		clientSecret: 'e2e-client-secret',
		accessToken: 'e2e-access-token',
		refreshToken: 'e2e-refresh-token',
		syncLocation: syncRoot.id
	});

	/* Source
	 *   Raindrop.io
	 *   └ Work
	 *     └ Example Link (https://example.com)
	 */
	await raindropMocker.mockBookmarks({
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

	// Trigger synchronization
	await goto.popup(page);
	await triggerForceSync(page);
	await expectSyncSuccess(page);

	// Verify bookmark state after synchronization by traversing the bookmark tree in the page context.
	expect(await bookmarks.getTreeRepr()).toEqual(
		`
Bookmarks bar
Other bookmarks
  Sync Root
    Work
      Example Link (https://example.com/)
`.trimStart()
	);
});

test('handles mixed synchronization changes in one run', async ({
	page,
	goto,
	appSettings,
	bookmarks,
	raindropMocker
}) => {
	/* Target
	 *   Root
	 *   ├ Bookmarks bar
	 *   └ Other bookmarks
	 *     └ SyncRoot
	 *       ├ Work
	 *       │ ├ Delete 1 (https://delete-1.example)
	 *       │ ├ Delete 2 (https://delete-2.example)
	 *       │ ├ Update 1 (https://old-1.example)
	 *       │ └ Update 2 (https://old-2.example)
	 *       └ Personal
	 *         ├ Keep 1 (https://keep-1.example)
	 *         └ Keep 2 (https://keep-2.example)
	 */
	const syncRoot = await bookmarks.createFolder({ title: 'Sync Root' });
	await bookmarks.createFolder({ title: 'Work', parentId: syncRoot.id });
	await bookmarks.createFolder({ title: 'Personal', parentId: syncRoot.id });
	await bookmarks.createBookmark({
		title: 'Delete 1',
		url: 'https://delete-1.example',
		parentId: syncRoot.id
	});
	await bookmarks.createBookmark({
		title: 'Delete 2',
		url: 'https://delete-2.example',
		parentId: syncRoot.id
	});
	await bookmarks.createBookmark({
		title: 'Update 1',
		url: 'https://old-1.example',
		parentId: syncRoot.id
	});
	await bookmarks.createBookmark({
		title: 'Update 2',
		url: 'https://old-2.example',
		parentId: syncRoot.id
	});
	await bookmarks.createBookmark({
		title: 'Keep 1',
		url: 'https://keep-1.example',
		parentId: syncRoot.id
	});
	await bookmarks.createBookmark({
		title: 'Keep 2',
		url: 'https://keep-2.example',
		parentId: syncRoot.id
	});

	/* Source
	 *   Raindrop.io
	 *   ├ Work
	 *   | ├ Create 1 (https://create-1.example)
	 *   | ├ Create 2 (https://create-2.example)
	 *   | ├ Update 1 (https://new-1.example)
	 *   | └ Update 2 (https://new-2.example)
	 *   └ Personal
	 *     ├ Keep 1 (https://keep-1.example)
	 *     └ Keep 2 (https://keep-2.example)
	 */
	await raindropMocker.mockBookmarks({
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

	// Configure sync settings
	await appSettings.set({
		clientId: 'e2e-client-id',
		clientSecret: 'e2e-client-secret',
		accessToken: 'e2e-access-token',
		refreshToken: 'e2e-refresh-token',
		syncLocation: syncRoot.id
	});

	// Go to popup and trigger synchronization
	await goto.popup(page);
	await triggerForceSync(page);
	await expectSyncSuccess(page);

	// Verify final bookmark state
	const treeRepr = await bookmarks.getTreeRepr();
	expect(treeRepr).toEqual(
		`
Bookmarks bar
Other bookmarks
  Sync Root
    Work
      Create 1 (https://create-1.example/)
      Create 2 (https://create-2.example/)
      Update 1 (https://new-1.example/)
      Update 2 (https://new-2.example/)
    Personal
      Keep 1 (https://keep-1.example/)
      Keep 2 (https://keep-2.example/)
`.trimStart()
	);
});

// ! This test is skipped for now (pending feature change)
test('when conflicting, first bookmark remain in place', async ({
	page,
	goto,
	appSettings,
	bookmarks,
	raindropMocker
}) => {
	/* Target
	 *   Root
	 *   ├ Bookmarks bar
	 *   └ Other bookmarks
	 *     └ SyncRoot (empty)
	 */
	const syncRoot = await bookmarks.createFolder({ title: 'Sync Root' });
	await appSettings.set({
		clientId: 'e2e-client-id',
		clientSecret: 'e2e-client-secret',
		accessToken: 'e2e-access-token',
		refreshToken: 'e2e-refresh-token',
		syncLocation: syncRoot.id
	});

	/* Source
	 *   Raindrop.io
	 *   └ Work
	 *     ├ Duplicate (https://conflict.example/first)
	 *     └ Duplicate (https://conflict.example/second)
	 */
	await raindropMocker.mockBookmarks({
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

	// Trigger synchronization
	await goto.popup(page);
	await triggerForceSync(page);
	await expectSyncSuccess(page);

	// Verify final bookmark state
	expect(await bookmarks.getTreeRepr()).toEqual(
		`
Bookmarks bar
Other bookmarks
  Sync Root
    Work
      Duplicate (https://conflict.example/first)
`.trimStart()
	);
});

test('does not mutate bookmarks when sync location is invalid', async ({
	page,
	goto,
	appSettings,
	bookmarks,
	raindropMocker
}) => {
	await appSettings.set({
		clientId: 'e2e-client-id',
		clientSecret: 'e2e-client-secret',
		accessToken: 'e2e-access-token',
		refreshToken: 'e2e-refresh-token',
		syncLocation: 'non-existent-folder-id'
	});

	/* Source
	 *   Raindrop.io
	 *   └ Work
	 *     └ Should Not Sync (https://should-not-sync.example)
	 */
	await raindropMocker.mockBookmarks({
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

	/* Target
	 *   Root
	 *   ├ Bookmarks bar
	 *   └ Other bookmarks
	 */
	const existingFolder = await bookmarks.createFolder({ title: 'Sync Root' });
	await bookmarks.createBookmark({
		title: 'Existing Link',
		url: 'https://existing.example',
		parentId: existingFolder.id
	});

	// Trigger synchronization
	await goto.popup(page);
	await triggerForceSync(page);
	await notExpectSyncSuccess(page);

	// Verify bookmark state
	expect(await bookmarks.getTreeRepr()).toEqual(
		`
Bookmarks bar
Other bookmarks
  Sync Root
    Existing Link (https://existing.example/)
`.trimStart()
	);
});

test('surfaces synchronization error on unauthorized source response', async ({
	page,
	goto,
	appSettings,
	bookmarks,
	raindropMocker
}) => {
	/* Target
	 *   Root
	 *   ├ Bookmarks bar
	 *   └ Other bookmarks
	 *     └ SyncRoot (empty)
	 */
	const syncRoot = await bookmarks.createFolder({ title: 'Sync Root' });
	await appSettings.set({
		clientId: 'e2e-client-id',
		clientSecret: 'e2e-client-secret',
		accessToken: 'e2e-access-token',
		refreshToken: '',
		syncLocation: syncRoot.id
	});

	// Source returns 401 Unauthorized for collections endpoint, simulating expired/invalid access token
	await raindropMocker.mockUserUnauthorized();

	// Trigger synchronization
	await goto.popup(page);
	await triggerForceSync(page);

	// Synchronization should fail and surface error message
	await notExpectSyncSuccess(page);

	// Verify bookmark state remains unchanged
	await expect(
		page.getByText('Synchronization failed with error:', { exact: false })
	).toBeVisible();
	expect(await bookmarks.getTreeRepr()).toEqual(
		`
Bookmarks bar
Other bookmarks
  Sync Root
`.trimStart()
	);
});

test('is idempotent when synchronizing unchanged source repeatedly', async ({
	page,
	goto,
	appSettings,
	bookmarks,
	raindropMocker
}) => {
	/* Target
	 *   Root
	 *   ├ Bookmarks bar
	 *   └ Other bookmarks
	 *     └ SyncRoot (empty)
	 */
	const syncRoot = await bookmarks.createFolder({ title: 'Sync Root' });
	await appSettings.set({
		clientId: 'e2e-client-id',
		clientSecret: 'e2e-client-secret',
		accessToken: 'e2e-access-token',
		refreshToken: 'e2e-refresh-token',
		syncLocation: syncRoot.id
	});

	/* Source
	 *   Raindrop.io
	 *   └ Work
	 *     └ Stable Link (https://stable.example)
	 */
	await raindropMocker.mockBookmarks({
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

	// Trigger synchronization twice and verify that the same data is created without duplication or mutation.
	await goto.popup(page);

	// 1st sync
	await triggerForceSync(page);
	await expectSyncSuccess(page);
	expect(await bookmarks.getTreeRepr()).toEqual(
		`
Bookmarks bar
Other bookmarks
  Sync Root
    Work
      Stable Link (https://stable.example/)
`.trimStart()
	);

	// 2nd sync
	await triggerForceSync(page);
	await expectSyncSuccess(page);
	expect(await bookmarks.getTreeRepr()).toEqual(
		`
Bookmarks bar
Other bookmarks
  Sync Root
    Work
      Stable Link (https://stable.example/)
`.trimStart()
	);
});
