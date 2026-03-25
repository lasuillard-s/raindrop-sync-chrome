import { describe, expect, it, vi } from 'vitest';
import type { SettingsStore } from '~/config';
import type { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import type { Raindrop } from '~/lib/raindrop/client';
import type { SyncDiff } from './diff';
import type { SyncEvent, SyncEventListener } from './event-listener';
import { SyncManager } from './manager';

class CapturingListener implements SyncEventListener {
	events: SyncEvent[] = [];

	onEvent(event: SyncEvent): void {
		this.events.push(event);
	}
}

const createManager = () => {
	const settings = {
		ready: vi.fn(async () => undefined),
		snapshotReady: vi.fn(async () => ({
			accessToken: 'token',
			syncLocation: 'folder-id',
			autoSyncEnabled: false,
			autoSyncExecOnStartup: false,
			autoSyncIntervalInMinutes: 5,
			clientLastSync: new Date(0)
		})),
		update: vi.fn(async () => undefined)
	} as unknown as SettingsStore;

	const repository = {
		findFolderById: vi.fn(async () => ({ id: 'folder-id', title: 'folder' })),
		getFolderById: vi.fn(async () => ({ id: 'folder-id', title: 'folder' }))
	} as unknown as ChromeBookmarkRepository;

	const raindropClient = {
		user: {
			getCurrentUser: vi.fn(async () => ({
				data: { user: { email: 'a@example.com', lastUpdate: new Date().toISOString() } }
			}))
		}
	} as unknown as Raindrop;

	const manager = new SyncManager({ settings, repository, raindropClient });
	return { manager, settings };
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
