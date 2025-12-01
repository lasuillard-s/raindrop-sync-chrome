import { client } from '@lasuillard/raindrop-client';
import { get } from 'svelte/store';
import { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import raindropClient from '~/lib/raindrop';
import type { AppSettings } from '~/lib/settings';
import appSettings from '~/lib/settings';

/**
 * Manages synchronization between Raindrop.io and browser bookmarks.
 */
export class SyncManager {
	appSettings: AppSettings;
	raindropClient: client.Raindrop;
	repository: ChromeBookmarkRepository;

	/**
	 * Create a new SyncManager.
	 * @param opts Options for the SyncManager.
	 * @param opts.appSettings Application settings.
	 * @param opts.adapter Adapter for browser bookmarks.
	 * @param opts.raindropClient Raindrop.io client.
	 */
	constructor(opts: {
		appSettings: AppSettings;
		adapter: ChromeBookmarkRepository;
		raindropClient: client.Raindrop;
	}) {
		this.appSettings = opts.appSettings;
		this.repository = opts.adapter;
		this.raindropClient = opts.raindropClient;
	}

	/**
	 * Validate synchronization settings and prerequisites before starting sync.
	 */
	async validateBeforeSync() {
		// Verify that access token is set
		if (!this.appSettings.accessToken) {
			throw new Error('Access token is not set. Please configure your Raindrop.io access token.');
		}

		// Verify that the target folder exists
		const syncLocation = get(this.appSettings.syncLocation);
		const targetFolder = this.repository.findFolderById(syncLocation);
		if (!targetFolder) {
			throw new Error(`Target folder with ID ${syncLocation} not found.`);
		}

		// Verify that the access token is valid by making a test request (lightweight)
		try {
			const currentUser = await this.raindropClient.user.getCurrentUser();
			console.debug('Verified access token for user:', currentUser.data.user.email);
		} catch (err) {
			throw new Error(`Access token is invalid. Please re-authenticate with Raindrop.io: ${err}`);
		}
	}

	/**
	 * Determine if synchronization should proceed based on last sync time and server updates.
	 *
	 * It will return true if any of the following conditions are met:
	 * 1. There has been no previous sync.
	 * 2. The last sync was more than thresholdSeconds ago.
	 * 3. There have been updates on the server since the last sync.
	 * @param thresholdSeconds The time threshold in seconds.
	 * @returns True if sync should proceed, false otherwise.
	 */
	async shouldSync(thresholdSeconds: number): Promise<boolean> {
		console.debug(
			'Checking if synchronization is needed based on last sync time and server updates'
		);

		// Case 1: Check if the last sync was successful
		const now = new Date();
		const lastSync = get(appSettings.clientLastSync);
		if (!lastSync) {
			console.debug('No previous sync found, proceeding with synchronization');
			return true;
		}

		// Case 2: The last sync was more than thresholdSeconds ago
		const timeSinceLastSync = (now.getTime() - lastSync.getTime()) / 1_000;
		if (timeSinceLastSync < thresholdSeconds) {
			console.debug(
				`Last sync was ${timeSinceLastSync} seconds ago, which is less than the threshold of ${thresholdSeconds} seconds. No sync needed.`
			);
			return false;
		}

		// Case 3: There have been updates on the server since the last sync
		const currentUser = await this.raindropClient.user.getCurrentUser();
		const serverLastUpdate = currentUser.data.user.lastUpdate
			? new Date(currentUser.data.user.lastUpdate)
			: new Date();

		console.debug(
			`Server last update time was: ${serverLastUpdate.toISOString()},` +
				` which is ${serverLastUpdate > lastSync ? 'after' : 'before'} last sync (${lastSync.toISOString()}).`
		);
		return serverLastUpdate > lastSync;
	}

	protected async performSync() {
		console.debug('Performing synchronization process');
		console.debug('Fetching collection tree from Raindrop.io');
		const treeNode = await this.raindropClient.collection.getCollectionTree();

		// Get the sync folder
		const syncFolderId = get(this.appSettings.syncLocation);
		const syncFolder = await this.repository.getFolderById(syncFolderId);
		console.debug(`Sync folder found: ${syncFolder.title} (${syncFolder.id})`);

		// Clear existing bookmarks in the sync folder
		console.debug('Clearing existing bookmarks in sync folder');
		await this.repository.clearAllBookmarksInFolder(syncFolder);

		// Create bookmarks recursively based on the Raindrop.io collection tree
		console.debug('Creating bookmarks from Raindrop.io collections');
		await this.repository.createBookmarksRecursively({
			baseFolder: syncFolder,
			tree: treeNode,
			raindropClient: this.raindropClient
		});

		// Update last sync time
		const lastSyncTime = new Date();
		await this.appSettings.clientLastSync.set(lastSyncTime);
		console.info(`Synchronization completed at ${lastSyncTime.toISOString()}`);
	}

	/**
	 * Start the synchronization process.
	 * @param opts Options for starting sync.
	 * @param opts.force Whether to force sync regardless of checks. Default is false.
	 * @param opts.thresholdSeconds Threshold in seconds to determine if sync is needed.
	 *  Ignored if force is true. Default is 300 seconds (5 minutes).
	 */
	async startSync(opts?: { force?: boolean; thresholdSeconds?: number }) {
		const force = opts?.force ?? false;
		const thresholdSeconds = opts?.thresholdSeconds ?? 300;
		let shouldSync: boolean;

		if (force) {
			console.warn('Force sync enabled, skipping checks');
			shouldSync = true;
		} else {
			await this.validateBeforeSync();
			shouldSync = await this.shouldSync(thresholdSeconds);
		}

		if (shouldSync) {
			await this.performSync();
		} else {
			console.info('No synchronization needed at this time');
		}
	}

	/**
	 * Schedule auto-sync alarms based on the current settings.
	 *
	 * This code is tightly coupled with service worker. When changing it,
	 * make sure to also update src/service-worker.ts accordingly.
	 */
	async scheduleAutoSync() {
		console.debug('Scheduling auto-sync alarms');
		await chrome.alarms.clearAll();

		if (get(this.appSettings.autoSyncEnabled) !== true) {
			console.info('Auto-sync is disabled');
			return;
		}

		const execOnStartup = get(this.appSettings.autoSyncExecOnStartup);
		if (!execOnStartup) {
			console.info('Sync on startup is disabled');
		}

		// If `undefined`, sync on startup is disabled
		const delayInMinutes = execOnStartup ? 0 : undefined;

		const periodInMinutes = get(this.appSettings.autoSyncIntervalInMinutes);

		console.debug(`Scheduling alarms with delay: ${delayInMinutes}, period: ${periodInMinutes}`);
		await chrome.alarms.create('sync-bookmarks', { delayInMinutes, periodInMinutes });
	}
}

export default new SyncManager({
	appSettings,
	adapter: new ChromeBookmarkRepository(),
	raindropClient: raindropClient
});
