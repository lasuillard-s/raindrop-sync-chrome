import { describe, expect, it, vi } from 'vitest';
import type { SettingsRepository } from '~/config/repository';
import { DEFAULT_SETTINGS, type Settings } from '~/config/settings';
import { SettingsStore } from '~/config/store';

describe('SettingsStore', () => {
	it('snapshotReady loads settings and returns loaded snapshot', async () => {
		// Arrange
		const loadedSettings: Settings = {
			...DEFAULT_SETTINGS,
			clientId: 'test-client-id',
			autoSyncEnabled: true,
			autoSyncIntervalInMinutes: 15
		};
		const repository = {
			load: vi.fn(async () => loadedSettings),
			save: vi.fn(async () => undefined),
			clear: vi.fn(async () => undefined)
		};
		const store = new SettingsStore(repository as unknown as SettingsRepository);

		// Act
		const snapshot = await store.snapshotReady();

		// Assert
		expect(repository.load).toHaveBeenCalledTimes(1);
		expect(snapshot).toEqual(loadedSettings);
		expect(store.isReady()).toBe(true);
	});

	it('init is idempotent and shares one load promise', async () => {
		// Arrange
		const repository = {
			load: vi.fn(async () => {
				await Promise.resolve();
				return DEFAULT_SETTINGS;
			}),
			save: vi.fn(async () => undefined),
			clear: vi.fn(async () => undefined)
		};
		const store = new SettingsStore(repository as unknown as SettingsRepository);

		// Act
		await Promise.all([store.init(), store.init(), store.ready()]);

		// Assert
		expect(repository.load).toHaveBeenCalledTimes(1);
		expect(store.isReady()).toBe(true);
	});

	it('update persists merged settings', async () => {
		// Arrange
		const repository = {
			load: vi.fn(async () => DEFAULT_SETTINGS),
			save: vi.fn(async () => undefined),
			clear: vi.fn(async () => undefined)
		};
		const store = new SettingsStore(repository as unknown as SettingsRepository);

		// Act
		await store.update({ autoSyncExecOnStartup: true, syncLocation: 'folder-id' });

		// Assert
		expect(repository.save).toHaveBeenCalledTimes(1);
		expect(repository.save).toHaveBeenCalledWith(
			expect.objectContaining({ autoSyncExecOnStartup: true, syncLocation: 'folder-id' })
		);
	});
});
