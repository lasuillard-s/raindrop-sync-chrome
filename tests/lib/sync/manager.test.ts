import { describe, expect, it, vi } from 'vitest';
import type { SettingsStore } from '~/config';
import type { TreeBuilder } from '~/lib/bookmark';
import type {
	AlarmScheduler,
	ChromeBookmarkNodeData,
	ReadableBookmarkRepository,
	WritableBookmarkRepository
} from '~/lib/browser';
import type { RaindropNodeData } from '~/lib/raindrop';
import type { Raindrop } from '~/lib/raindrop/client';
import type { SyncEvent, SyncEventListener } from '~/lib/sync';
import { SYNC_BOOKMARKS_ALARM_NAME, SyncManager, type SyncDiff } from '~/lib/sync';

class CapturingListener implements SyncEventListener {
	events: SyncEvent[] = [];

	onEvent(event: SyncEvent): void {
		this.events.push(event);
	}
}

const createManager = (args?: {
	clientLastSync?: Date;
	autoSyncEnabled?: boolean;
	autoSyncExecOnStartup?: boolean;
	autoSyncIntervalInMinutes?: number;
	serverLastUpdate?: string;
}) => {
	const clientLastSync = args?.clientLastSync ?? new Date(0);
	const autoSyncEnabled = args?.autoSyncEnabled ?? false;
	const autoSyncExecOnStartup = args?.autoSyncExecOnStartup ?? false;
	const autoSyncIntervalInMinutes = args?.autoSyncIntervalInMinutes ?? 5;
	const serverLastUpdate = args?.serverLastUpdate ?? new Date().toISOString();

	const snapshot = {
		accessToken: 'token',
		syncLocation: 'folder-id',
		autoSyncEnabled,
		autoSyncExecOnStartup,
		autoSyncIntervalInMinutes,
		clientLastSync
	};

	const settings = {
		ready: vi.fn(async () => undefined),
		snapshotReady: vi.fn(async () => snapshot),
		get snapshot() {
			return snapshot;
		},
		update: vi.fn(async () => undefined)
	} as unknown as SettingsStore;

	const sourceRepo = {
		findFolderById: vi.fn(async () => ({ id: 'folder-id', title: 'folder' })),
		getFolderById: vi.fn(async () => ({ id: 'folder-id', title: 'folder' }))
	} as unknown as ReadableBookmarkRepository;

	const targetRepo = {
		createBookmark: vi.fn(async () => ({ id: 'bookmark-id' })),
		updateBookmark: vi.fn(async () => ({ id: 'bookmark-id' })),
		deleteBookmark: vi.fn(async () => undefined),
		clearAllBookmarksInFolder: vi.fn(async () => undefined),
		createBookmarksRecursively: vi.fn(async () => undefined)
	} as unknown as WritableBookmarkRepository;

	const getCurrentUser = vi.fn(async () => ({
		data: { user: { email: 'a@example.com', lastUpdate: serverLastUpdate } }
	}));

	const raindropClient = {
		user: { getCurrentUser }
	} as unknown as Raindrop;
	const alarmScheduler = {
		clearAll: vi.fn(async () => undefined),
		create: vi.fn(async () => undefined)
	} as AlarmScheduler;
	const currentBookmarkTreeBuilder = {
		build: vi.fn(async () => ({ getFullPathSegments: () => ['/'] }))
	} as unknown as TreeBuilder<unknown, ChromeBookmarkNodeData>;
	const expectedBookmarkTreeBuilder = {
		build: vi.fn(async () => ({ getFullPathSegments: () => ['/'] }))
	} as unknown as TreeBuilder<unknown, RaindropNodeData>;

	const manager = new SyncManager({
		settings,
		sourceRepo,
		targetRepo,
		raindropClient,
		alarmScheduler,
		currentBookmarkTreeBuilder,
		expectedBookmarkTreeBuilder
	});
	return {
		manager,
		settings,
		getCurrentUser,
		alarmScheduler,
		currentBookmarkTreeBuilder,
		expectedBookmarkTreeBuilder
	};
};

describe('SyncManager.startSync', () => {
	it('uses precalculated diff on forced sync and skips validation checks', async () => {
		// Arrange
		const { manager, settings } = createManager();
		const listener = new CapturingListener();
		manager.addListener(listener);

		const validateSpy = vi.spyOn(manager, 'validateBeforeSync');
		const shouldSyncSpy = vi.spyOn(manager, 'shouldSync');
		const performSyncSpy = vi.spyOn(manager, 'performSync').mockResolvedValue();

		const diff = { fake: true } as unknown as SyncDiff<any, any>;

		// Act
		await manager.startSync({ force: true, precalculatedDiff: diff });

		// Assert
		expect(settings.ready).toHaveBeenCalledTimes(1);
		expect(validateSpy).not.toHaveBeenCalled();
		expect(shouldSyncSpy).not.toHaveBeenCalled();
		expect(performSyncSpy).toHaveBeenCalledWith(diff);
		expect(listener.events.at(0)?.type).toBe('start');
		expect(listener.events.at(-1)?.type).toBe('complete');
	});

	it('does not run sync execution when shouldSync returns false', async () => {
		// Arrange
		const { manager } = createManager();
		const listener = new CapturingListener();
		manager.addListener(listener);
		const diff = { fake: true } as unknown as SyncDiff<any, any>;

		vi.spyOn(manager, 'validateBeforeSync').mockResolvedValue();
		vi.spyOn(manager, 'shouldSync').mockResolvedValue(false);
		const performSyncSpy = vi.spyOn(manager, 'performSync').mockResolvedValue();
		const performLegacySpy = vi
			.spyOn(
				manager as unknown as {
					performSyncLegacy: () => Promise<void>;
				},
				'performSyncLegacy'
			)
			.mockResolvedValue();

		// Act
		await manager.startSync({ precalculatedDiff: diff });

		// Assert
		expect(performSyncSpy).not.toHaveBeenCalled();
		expect(performLegacySpy).not.toHaveBeenCalled();
		expect(listener.events.at(-1)?.type).toBe('complete');
	});

	it('runs legacy path when useLegacy is true', async () => {
		// Arrange
		const { manager } = createManager();
		vi.spyOn(manager, 'validateBeforeSync').mockResolvedValue();
		vi.spyOn(manager, 'shouldSync').mockResolvedValue(true);
		const performSyncSpy = vi.spyOn(manager, 'performSync').mockResolvedValue();
		const performLegacySpy = vi
			.spyOn(
				manager as unknown as {
					performSyncLegacy: () => Promise<void>;
				},
				'performSyncLegacy'
			)
			.mockResolvedValue();

		// Act
		await manager.startSync({ useLegacy: true });

		// Assert
		expect(performLegacySpy).toHaveBeenCalledTimes(1);
		expect(performSyncSpy).not.toHaveBeenCalled();
	});

	it('emits error event when sync fails', async () => {
		// Arrange
		const { manager } = createManager();
		const listener = new CapturingListener();
		manager.addListener(listener);
		const diff = { fake: true } as unknown as SyncDiff<any, any>;

		vi.spyOn(manager, 'validateBeforeSync').mockRejectedValue(new Error('boom'));

		// Act
		await manager.startSync({ precalculatedDiff: diff });

		// Assert
		expect(listener.events.at(0)?.type).toBe('start');
		expect(listener.events.at(-1)?.type).toBe('error');
	});
});

describe('SyncManager.shouldSync', () => {
	it('returns false when last sync is within threshold', async () => {
		// Arrange
		const { manager, getCurrentUser, settings } = createManager({
			clientLastSync: new Date(Date.now() - 60_000)
		});

		// Act
		const result = await manager.shouldSync(300);

		// Assert
		expect(result).toBe(false);
		expect(settings.ready).toHaveBeenCalledTimes(1);
		expect(getCurrentUser).not.toHaveBeenCalled();
	});

	it('returns true when server was updated after last sync', async () => {
		// Arrange
		const lastSync = new Date('2026-01-01T00:00:00.000Z');
		const { manager, getCurrentUser } = createManager({
			clientLastSync: lastSync,
			serverLastUpdate: '2026-01-01T00:10:00.000Z'
		});

		// Act
		const result = await manager.shouldSync(1);

		// Assert
		expect(result).toBe(true);
		expect(getCurrentUser).toHaveBeenCalledTimes(1);
	});

	it('returns false when server was not updated after last sync', async () => {
		// Arrange
		const lastSync = new Date('2026-01-01T00:10:00.000Z');
		const { manager, getCurrentUser } = createManager({
			clientLastSync: lastSync,
			serverLastUpdate: '2026-01-01T00:00:00.000Z'
		});

		// Act
		const result = await manager.shouldSync(1);

		// Assert
		expect(result).toBe(false);
		expect(getCurrentUser).toHaveBeenCalledTimes(1);
	});
});

describe('SyncManager tree builders', () => {
	it('delegates current tree creation to the injected builder with the sync location as base', async () => {
		const { manager, currentBookmarkTreeBuilder } = createManager();

		await manager.getCurrentBookmarkTree();

		expect(currentBookmarkTreeBuilder.build).toHaveBeenCalledWith({
			baseNodeId: 'folder-id',
			missingBaseMessage: 'Failed to locate the base node (folder-id) in the created tree'
		});
	});

	it('delegates expected tree creation to the injected builder', async () => {
		const { manager, expectedBookmarkTreeBuilder } = createManager();

		await manager.getExpectedBookmarkTree();

		expect(expectedBookmarkTreeBuilder.build).toHaveBeenCalledWith();
	});
});

describe('SyncManager.scheduleAutoSync', () => {
	it('clears alarms and does not create one when auto sync is disabled', async () => {
		// Arrange
		const { manager, alarmScheduler } = createManager({ autoSyncEnabled: false });

		// Act
		await manager.scheduleAutoSync();

		// Assert
		expect(alarmScheduler.clearAll).toHaveBeenCalledTimes(1);
		expect(alarmScheduler.create).not.toHaveBeenCalled();
	});

	it('creates recurring alarm with startup delay when enabled and execOnStartup is true', async () => {
		// Arrange
		const { manager, alarmScheduler } = createManager({
			autoSyncEnabled: true,
			autoSyncExecOnStartup: true,
			autoSyncIntervalInMinutes: 15
		});

		// Act
		await manager.scheduleAutoSync();

		// Assert
		expect(alarmScheduler.clearAll).toHaveBeenCalledTimes(1);
		expect(alarmScheduler.create).toHaveBeenCalledWith(SYNC_BOOKMARKS_ALARM_NAME, {
			delayInMinutes: 0,
			periodInMinutes: 15
		});
	});

	it('creates recurring alarm without startup delay when enabled and execOnStartup is false', async () => {
		// Arrange
		const { manager, alarmScheduler } = createManager({
			autoSyncEnabled: true,
			autoSyncExecOnStartup: false,
			autoSyncIntervalInMinutes: 10
		});

		// Act
		await manager.scheduleAutoSync();

		// Assert
		expect(alarmScheduler.clearAll).toHaveBeenCalledTimes(1);
		expect(alarmScheduler.create).toHaveBeenCalledWith(SYNC_BOOKMARKS_ALARM_NAME, {
			delayInMinutes: undefined,
			periodInMinutes: 10
		});
	});
});
