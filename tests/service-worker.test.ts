import { afterEach, describe, expect, it, vi } from 'vitest';

type InstalledListener = (details: {
	reason: string;
	previousVersion?: string;
}) => Promise<void> | void;

type AlarmListener = (alarm: { name: string }) => Promise<void> | void;

/**
 * Loads service-worker module with mocked dependencies and captures registered listeners.
 * @param args Optional test scenario overrides.
 * @param args.installedVersion Mock extension version returned by management API.
 * @returns Captured listeners and dependency spies for assertions.
 */
async function loadServiceWorker(args?: { installedVersion?: string }) {
	const installedListeners: InstalledListener[] = [];
	const alarmListeners: AlarmListener[] = [];
	const scheduleAutoSync = vi.fn(async () => undefined);
	const runFullSync = vi.fn(async () => undefined);
	const ready = vi.fn(async () => undefined);
	const settings = { ready };
	const app = {
		settings,
		sync: {
			scheduleAutoSync,
			runFullSync
		}
	};
	const getInstance = vi.fn(() => app);
	const doMigrate = vi.fn(async () => undefined);
	const managementGetSelf = vi.fn(async () => ({ version: args?.installedVersion ?? '1.2.3' }));
	const onInstalledAddListener = vi.fn((listener: InstalledListener) => {
		installedListeners.push(listener);
	});
	const onAlarmAddListener = vi.fn((listener: AlarmListener) => {
		alarmListeners.push(listener);
	});
	const getOnInstalledReason = vi.fn(() => ({
		INSTALL: 'install',
		UPDATE: 'update'
	}));

	vi.doMock('~/app', () => ({
		App: {
			getInstance
		}
	}));
	vi.doMock('~/migrations', () => ({ doMigrate }));
	vi.doMock('~/services/sync', () => ({
		SYNC_BOOKMARKS_ALARM_NAME: 'sync-bookmarks'
	}));
	vi.doMock('~/lib/browser', () => ({
		defaultBrowserProxy: {
			runtime: {
				onInstalledAddListener,
				getOnInstalledReason
			},
			alarms: {
				onAlarmAddListener
			},
			management: {
				getSelf: managementGetSelf
			}
		}
	}));

	await import('~/service-worker');

	return {
		installedListener: installedListeners[0],
		alarmListener: alarmListeners[0],
		scheduleAutoSync,
		runFullSync,
		doMigrate,
		ready,
		getInstance,
		managementGetSelf,
		onInstalledAddListener,
		onAlarmAddListener
	};
}

afterEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	vi.doUnmock('~/app');
	vi.doUnmock('~/migrations');
	vi.doUnmock('~/services/sync');
	vi.doUnmock('~/lib/browser');
});

describe('service worker installation flow', () => {
	it('runs migrations on update and always schedules auto sync afterward', async () => {
		const {
			installedListener,
			doMigrate,
			scheduleAutoSync,
			managementGetSelf,
			getInstance,
			onInstalledAddListener,
			onAlarmAddListener
		} = await loadServiceWorker({ installedVersion: '0.6.1' });

		expect(getInstance).toHaveBeenCalledTimes(1);
		expect(onInstalledAddListener).toHaveBeenCalledTimes(1);
		expect(onAlarmAddListener).toHaveBeenCalledTimes(1);

		await installedListener({ reason: 'update', previousVersion: '0.5.0' });

		expect(managementGetSelf).toHaveBeenCalledTimes(1);
		expect(doMigrate).toHaveBeenCalledWith({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});
		expect(scheduleAutoSync).toHaveBeenCalledTimes(1);
	});

	it('uses 0.0.0 as previousVersion when update event omits it', async () => {
		const { installedListener, doMigrate, managementGetSelf, scheduleAutoSync } =
			await loadServiceWorker({ installedVersion: '0.6.1' });

		await installedListener({ reason: 'update' });

		expect(managementGetSelf).toHaveBeenCalledTimes(1);
		expect(doMigrate).toHaveBeenCalledWith({
			previousVersion: '0.0.0',
			installedVersion: '0.6.1'
		});
		expect(scheduleAutoSync).toHaveBeenCalledTimes(1);
	});

	it('skips migrations on install but still schedules auto sync', async () => {
		const { installedListener, doMigrate, scheduleAutoSync, managementGetSelf } =
			await loadServiceWorker();

		await installedListener({ reason: 'install' });

		expect(managementGetSelf).not.toHaveBeenCalled();
		expect(doMigrate).not.toHaveBeenCalled();
		expect(scheduleAutoSync).toHaveBeenCalledTimes(1);
	});
});

describe('service worker alarm flow', () => {
	it('starts sync after settings are ready when the sync alarm fires', async () => {
		const { alarmListener, ready, runFullSync } = await loadServiceWorker();

		await alarmListener({ name: 'sync-bookmarks' });

		expect(ready).toHaveBeenCalledTimes(1);
		expect(runFullSync).toHaveBeenCalledTimes(1);
	});

	it('ignores unrelated alarms', async () => {
		const { alarmListener, ready, runFullSync } = await loadServiceWorker();

		await alarmListener({ name: 'other-alarm' });

		expect(ready).not.toHaveBeenCalled();
		expect(runFullSync).not.toHaveBeenCalled();
	});
});
