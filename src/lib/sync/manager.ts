import { get } from 'svelte/store';
import type { AppSettings } from '~/config/settings';
import {
	ChromeBookmarkNodeData,
	ChromeBookmarkRepository,
	createTreeFromChromeBookmarks
} from '~/lib/browser/chrome';
import { createTreeFromRaindrops, type RaindropNodeData } from '~/lib/raindrop';
import { Path } from '../util/path';
import { SyncDiff } from './diff';
import type { SyncEvent, SyncEventListener } from './event-listener';
import {
	SyncEventComplete,
	SyncEventError,
	SyncEventProgress,
	SyncEventStart
} from './event-listener';
import { SyncExecutor } from './executor';
import { SyncPlan } from './plan';
import { TreeNode } from './tree';
import type { Raindrop } from '~/lib/raindrop/client';

/**
 * Manages synchronization between Raindrop.io and browser bookmarks.
 */
export class SyncManager {
	appSettings: AppSettings;
	raindropClient: Raindrop;
	repository: ChromeBookmarkRepository;

	private listeners: SyncEventListener[] = [];

	/**
	 * Create a new SyncManager.
	 * @param opts Options for the SyncManager.
	 * @param opts.appSettings Application settings.
	 * @param opts.repository Repository for browser bookmarks.
	 * @param opts.raindropClient Raindrop.io client.
	 */
	constructor(opts: {
		appSettings: AppSettings;
		repository: ChromeBookmarkRepository;
		raindropClient: Raindrop;
	}) {
		this.appSettings = opts.appSettings;
		this.repository = opts.repository;
		this.raindropClient = opts.raindropClient;
	}

	addListener(listener: SyncEventListener) {
		console.debug('Attaching a new listener to sync manager');
		this.listeners.push(listener);
	}

	removeListener(listener: SyncEventListener) {
		console.debug('Detaching a listener from sync manager');
		this.listeners = this.listeners.filter((obs) => obs !== listener);
	}

	emitEvent(event: SyncEvent) {
		console.debug('Notifying listeners of sync event:', event);
		for (const listener of this.listeners) {
			listener.onEvent(event);
		}
	}

	/**
	 * Validate synchronization settings and prerequisites before starting sync.
	 */
	async validateBeforeSync() {
		console.debug('Validating synchronization settings and prerequisites');

		// Verify that access token is set
		if (!this.appSettings.accessToken) {
			throw new Error('Access token is not set. Please configure your Raindrop.io access token.');
		}

		// Verify that the target folder exists
		const syncLocation = get(this.appSettings.syncLocation);
		const targetFolder = await this.repository.findFolderById(syncLocation);
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
		const lastSync = get(this.appSettings.clientLastSync);
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

	/**
	 * Get the current bookmark tree from Chrome.
	 * @returns The current bookmark tree.
	 */
	async getCurrentBookmarkTree(): Promise<TreeNode<ChromeBookmarkNodeData>> {
		const syncLocationId = get(this.appSettings.syncLocation);
		const syncLocation = await this.repository.getFolderById(syncLocationId);
		return createTreeFromChromeBookmarks(syncLocation);
	}

	/**
	 * Get the expected bookmark tree based on Raindrop.io collections.
	 * @returns The expected bookmark tree.
	 */
	async getExpectedBookmarkTree(): Promise<TreeNode<RaindropNodeData>> {
		// TODO(#31): Extend implementation for customizable expected tree
		return createTreeFromRaindrops(this.raindropClient);
	}

	/**
	 * Calculate the sync difference between Raindrop.io collections and Chrome bookmarks.
	 * @param expected The expected bookmark tree based on Raindrop.io collections.
	 * @param current The current bookmark tree from Chrome.
	 * @returns The calculated SyncDiff object.
	 */
	async calculateSyncDiff(
		expected: TreeNode<RaindropNodeData>,
		current: TreeNode<ChromeBookmarkNodeData>
	): Promise<SyncDiff<RaindropNodeData, ChromeBookmarkNodeData>> {
		return SyncDiff.calculateDiff(expected, current);
	}

	/**
	 * Generate a sync plan based on the calculated sync diff.
	 * @param diff Optional pre-calculated SyncDiff object.
	 * @returns The generated SyncPlan object.
	 */
	async generateSyncPlan(diff: SyncDiff<RaindropNodeData, ChromeBookmarkNodeData>) {
		// Get the sync folder
		const syncFolderId = get(this.appSettings.syncLocation);
		const syncFolder = await this.repository.getFolderById(syncFolderId);
		console.debug(
			`Sync folder found: ${syncFolder.title} (${syncFolder.id}); ${diff.right.getFullPathSegments()}`
		);

		// Create sync executor
		const plan = SyncPlan.fromDiff(
			diff,
			new Path({ segments: diff.right.getFullPathSegments().slice(1) })
		);
		return plan;
	}

	/**
	 * Perform the synchronization process based on the provided sync diff.
	 * @param diff Calculated SyncDiff object.
	 */
	async performSync(diff: SyncDiff<RaindropNodeData, ChromeBookmarkNodeData>) {
		console.debug('Performing synchronization process');

		// Get the sync folder
		const syncFolderId = get(this.appSettings.syncLocation);
		const syncFolder = await this.repository.getFolderById(syncFolderId);
		console.debug(
			`Sync folder found: ${syncFolder.title} (${syncFolder.id}); ${diff.right.getFullPathSegments()}`
		);

		// Create sync executor
		this.emitEvent(new SyncEventProgress('generating-plan'));
		const plan = await this.generateSyncPlan(diff);
		console.debug('Generated sync plan:', plan);
		const executor = new SyncExecutor({
			repository: this.repository,
			plan
		});

		// Run the sync executor to apply the sync plan
		this.emitEvent(new SyncEventProgress('syncing'));
		await executor.execute();

		// Update last sync time
		const lastSyncTime = new Date();
		await this.appSettings.clientLastSync.set(lastSyncTime);
		console.info(`Synchronization completed at ${lastSyncTime.toISOString()}`);
	}

	/**
	 * Legacy, simplified synchronization process.
	 *
	 * It cleans up the target folder entirely and recreates bookmarks based on Raindrop.io collections.
	 * @deprecated Use performSync() for a more efficient sync mechanism.
	 */
	protected async performSyncLegacy() {
		console.debug('Performing synchronization process');

		// Fetch the collection tree from Raindrop.io
		console.debug('Fetching collection tree from Raindrop.io');
		this.emitEvent(new SyncEventProgress('fetching-collections'));
		const treeNode = await this.raindropClient.collection.getCollectionTree();

		// Get the sync folder
		const syncFolderId = get(this.appSettings.syncLocation);
		const syncFolder = await this.repository.getFolderById(syncFolderId);
		console.debug(`Sync folder found: ${syncFolder.title} (${syncFolder.id})`);

		// Clear existing bookmarks in the sync folder
		console.debug('Clearing existing bookmarks in sync folder');
		this.emitEvent(new SyncEventProgress('clearing-bookmarks'));
		await this.repository.clearAllBookmarksInFolder(syncFolder);

		// Create bookmarks recursively based on the Raindrop.io collection tree
		console.debug('Creating bookmarks from Raindrop.io collections');
		this.emitEvent(new SyncEventProgress('creating-bookmarks'));
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
	 * @param opts.currentBookmarkTree Optional current bookmark tree from Chrome.
	 * @param opts.expectedBookmarkTree Optional expected bookmark tree from Raindrop.io.
	 * @param opts.precalculatedDiff Optional pre-calculated SyncDiff object.
	 * @param opts.force Whether to force sync regardless of checks. Default is false.
	 * @param opts.thresholdSeconds Threshold in seconds to determine if sync is needed.
	 *  Ignored if force is true. Default is 300 seconds (5 minutes).
	 * @param opts.useLegacy Whether to use the legacy sync mechanism. Default is false.
	 */
	async startSync(opts?: {
		currentBookmarkTree?: TreeNode<ChromeBookmarkNodeData>;
		expectedBookmarkTree?: TreeNode<RaindropNodeData>;
		precalculatedDiff?: SyncDiff<RaindropNodeData, ChromeBookmarkNodeData>;
		force?: boolean;
		thresholdSeconds?: number;
		useLegacy?: boolean;
	}) {
		let { currentBookmarkTree, expectedBookmarkTree } = opts ?? {};
		let diff: SyncDiff<RaindropNodeData, ChromeBookmarkNodeData> | undefined;
		const precalculatedDiff = opts?.precalculatedDiff;
		const force = opts?.force ?? false;
		const thresholdSeconds = opts?.thresholdSeconds ?? 300;
		const useLegacy = opts?.useLegacy ?? false;

		// Calculate diff
		if (!useLegacy) {
			if (precalculatedDiff) {
				console.debug('Using precalculated sync diff');
				diff = precalculatedDiff;
			} else {
				if (!currentBookmarkTree) {
					// Fetch the current bookmark tree from Chrome
					console.debug('Fetching current bookmark tree from Chrome');
					this.emitEvent(new SyncEventProgress('fetching-bookmarks'));
					currentBookmarkTree = await this.getCurrentBookmarkTree();
				}
				if (!expectedBookmarkTree) {
					// Fetch the collection tree from Raindrop.io
					console.debug('Fetching collection tree from Raindrop.io');
					this.emitEvent(new SyncEventProgress('fetching-collections'));
					expectedBookmarkTree = await this.getExpectedBookmarkTree();
				}
				this.emitEvent(new SyncEventProgress('calculating-diff'));
				console.debug('Calculating sync diff');
				diff = await this.calculateSyncDiff(expectedBookmarkTree, currentBookmarkTree);
			}
		}

		// Start sync process
		let shouldSync: boolean;
		try {
			this.emitEvent(new SyncEventStart());
			if (force) {
				console.warn('Force sync enabled, skipping checks');
				shouldSync = true;
			} else {
				this.emitEvent(new SyncEventProgress('validating'));
				await this.validateBeforeSync();
				this.emitEvent(new SyncEventProgress('check-should-sync'));
				shouldSync = await this.shouldSync(thresholdSeconds);
			}

			if (shouldSync) {
				if (useLegacy) {
					await this.performSyncLegacy();
				} else {
					await this.performSync(diff!);
				}
			} else {
				console.info('No synchronization needed at this time');
			}
			this.emitEvent(new SyncEventComplete());
		} catch (error) {
			console.error('Error during synchronization:', error);
			this.emitEvent(new SyncEventError(error));
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
