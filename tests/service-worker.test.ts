import { afterEach, describe, expect, it, vi } from 'vitest';

type InstalledListener = (details: {
	reason: string;
	previousVersion?: string;
}) => Promise<void> | void;

type AlarmListener = (alarm: { name: string }) => Promise<void> | void;

/**
 * Loads the service worker module with mocked dependencies and captured listeners.
 * @param args Optional scenario configuration.
 * @param args.installedVersion Version reported by chrome.management.getSelf.
 * @param args.useLegacySyncMechanism Whether settings should enable legacy sync.
 * @returns Captured listeners and dependency spies for assertions.
 */
async function loadServiceWorker(args?: {
	installedVersion?: string;
	useLegacySyncMechanism?: boolean;
}) {
	vi.resetModules();

	const installedListeners: InstalledListener[] = [];
	const alarmListeners: AlarmListener[] = [];
	const scheduleAutoSync = vi.fn(async () => undefined);
	const startSync = vi.fn(async () => undefined);
	const doMigrate = vi.fn(async () => undefined);
	const ready = vi.fn(async () => undefined);
	const settings = {
		ready,
		snapshot: {
			useLegacySyncMechanism: args?.useLegacySyncMechanism ?? false
		}
	};
	const getOrCreate = vi.fn(() => settings);
	const SyncManager = vi.fn(function SyncManager(this: {
		scheduleAutoSync: typeof scheduleAutoSync;
		startSync: typeof startSync;
	}) {
		this.scheduleAutoSync = scheduleAutoSync;
		this.startSync = startSync;
	});

	vi.doMock('~/lib/sync', () => ({
		SYNC_BOOKMARKS_ALARM_NAME: 'sync-bookmarks',
		SyncManager
	}));
	vi.doMock('~/migrations', () => ({ doMigrate }));
	vi.doMock('~/config', () => ({
		SettingsStore: {
			getOrCreate
		}
	}));

	vi.stubGlobal('chrome', {
		runtime: {
			OnInstalledReason: {
				INSTALL: 'install',
				UPDATE: 'update'
			},
			onInstalled: {
				addListener: vi.fn((listener: InstalledListener) => {
					installedListeners.push(listener);
				})
			}
		},
		alarms: {
			onAlarm: {
				addListener: vi.fn((listener: AlarmListener) => {
					alarmListeners.push(listener);
				})
			}
		},
		management: {
			getSelf: vi.fn(async () => ({
				version: args?.installedVersion ?? '1.2.3'
			}))
		}
	});

	await import('~/service-worker');

	return {
		installedListener: installedListeners[0],
		alarmListener: alarmListeners[0],
		scheduleAutoSync,
		startSync,
		doMigrate,
		ready,
		getOrCreate,
		SyncManager,
		managementGetSelf: vi.mocked(chrome.management.getSelf)
	};
}

afterEach(() => {
	vi.resetModules();
	vi.unstubAllGlobals();
	vi.clearAllMocks();
	vi.doUnmock('~/lib/sync');
	vi.doUnmock('~/migrations');
	vi.doUnmock('~/config');
});

describe('service worker installation flow', () => {
	it('runs migrations on update and always schedules auto sync afterward', async () => {
		// Arrange
		const { installedListener, doMigrate, scheduleAutoSync, managementGetSelf, SyncManager } =
			await loadServiceWorker({ installedVersion: '0.6.1' });

		// Act
		await installedListener({
			reason: chrome.runtime.OnInstalledReason.UPDATE,
			previousVersion: '0.5.0'
		});

		// Assert
		expect(managementGetSelf).toHaveBeenCalledTimes(1);
		expect(doMigrate).toHaveBeenCalledWith({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});
		expect(SyncManager).toHaveBeenCalledTimes(1);
		expect(scheduleAutoSync).toHaveBeenCalledTimes(1);
	});

	it('uses 0.0.0 as previousVersion when update event omits it', async () => {
		// Arrange
		const { installedListener, doMigrate, managementGetSelf } = await loadServiceWorker({
			installedVersion: '0.6.1'
		});

		// Act
		await installedListener({
			reason: chrome.runtime.OnInstalledReason.UPDATE
		});

		// Assert
		expect(managementGetSelf).toHaveBeenCalledTimes(1);
		expect(doMigrate).toHaveBeenCalledWith({
			previousVersion: '0.0.0',
			installedVersion: '0.6.1'
		});
	});

	it('skips migrations on install but still schedules auto sync', async () => {
		// Arrange
		const { installedListener, doMigrate, scheduleAutoSync, managementGetSelf } =
			await loadServiceWorker();

		// Act
		await installedListener({
			reason: chrome.runtime.OnInstalledReason.INSTALL
		});

		// Assert
		expect(managementGetSelf).not.toHaveBeenCalled();
		expect(doMigrate).not.toHaveBeenCalled();
		expect(scheduleAutoSync).toHaveBeenCalledTimes(1);
	});
});

describe('service worker alarm flow', () => {
	it('starts sync with the legacy flag from settings when the sync alarm fires', async () => {
		// Arrange
		const { alarmListener, ready, getOrCreate, startSync, SyncManager } = await loadServiceWorker({
			useLegacySyncMechanism: true
		});

		// Act
		await alarmListener({ name: 'sync-bookmarks' });

		// Assert
		expect(getOrCreate).toHaveBeenCalledTimes(1);
		expect(ready).toHaveBeenCalledTimes(1);
		expect(SyncManager).toHaveBeenCalledWith(
			expect.objectContaining({
				settings: expect.objectContaining({
					snapshot: expect.objectContaining({ useLegacySyncMechanism: true })
				})
			})
		);
		expect(startSync).toHaveBeenCalledWith({ useLegacy: true });
	});

	it('ignores unrelated alarms', async () => {
		// Arrange
		const { alarmListener, ready, getOrCreate, startSync, SyncManager } = await loadServiceWorker();

		// Act
		await alarmListener({ name: 'other-alarm' });

		// Assert
		expect(getOrCreate).not.toHaveBeenCalled();
		expect(ready).not.toHaveBeenCalled();
		expect(SyncManager).not.toHaveBeenCalled();
		expect(startSync).not.toHaveBeenCalled();
	});
});
