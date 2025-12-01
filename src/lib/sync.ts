import { generated, utils } from '@lasuillard/raindrop-client';
import { get } from 'svelte/store';
import { clearBookmarks, createBookmarks } from '~/lib/chrome/bookmark';
import rd from '~/lib/raindrop';
import appSettings from '~/lib/settings';

export interface SyncBookmarksArgs {
	/**
	 * Tree node of collection to sync.
	 */
	treeNode?: utils.tree.TreeNode<generated.Collection | null>;

	/**
	 * Threshold since last update in seconds to trigger sync bookmarks.
	 */
	thresholdSeconds?: number;
}

/**
 * Sync Raindrop.io collections with Chrome bookmarks.
 * @param args Arguments for syncing bookmarks.
 */
export async function syncBookmarks(args: SyncBookmarksArgs = {}) {
	const treeNode = args.treeNode ?? (await rd.collection.getCollectionTree());
	const thresholdSeconds = args.thresholdSeconds ?? 60;

	const bookmarksTree = await chrome.bookmarks.getTree();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [bookmarksBar, otherBookmarks] = bookmarksTree[0].children!;

	// Check user's last update time
	const currentUser = await rd.user.getCurrentUser();
	const serverLastUpdate = currentUser.data.user.lastUpdate
		? new Date(currentUser.data.user.lastUpdate)
		: new Date();

	const clientLastSyncValue = get(appSettings.clientLastSync);

	// Skip sync if last update is within threshold
	const secondsSinceLastTouch = (serverLastUpdate.getTime() - clientLastSyncValue.getTime()) / 1000;
	if (secondsSinceLastTouch <= thresholdSeconds) {
		console.debug('Skipping sync because last touch within threshold:', {
			serverLastUpdate: serverLastUpdate.toISOString(),
			clientLastSync: clientLastSyncValue.toISOString(),
			thresholdSeconds,
			secondsSinceLastTouch
		});
		return;
	}

	const syncFolderId = get(appSettings.syncLocation);
	const syncFolder = (await chrome.bookmarks.getSubTree(syncFolderId))[0];
	if (!syncFolder) {
		throw new Error(`Sync folder ${syncFolderId} not found`);
	}

	console.debug('Clearing bookmarks in sync folder');
	await clearBookmarks(syncFolder);

	// TODO: Abstract browser bookmark interface to support other browsers in future
	await createBookmarks(syncFolder.id, treeNode);
	await appSettings.clientLastSync.set(new Date());
	console.info('Synchronization completed');
}
