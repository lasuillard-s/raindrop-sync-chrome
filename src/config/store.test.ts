import { describe, expect, it, vi } from 'vitest';
import type { SettingsRepository } from './repository';
import { DEFAULT_SETTINGS, type Settings } from './settings';
import { SettingsStore } from './store';

describe('SettingsStore', () => {
	it('snapshotReady loads settings and returns loaded snapshot', async () => {
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

		const snapshot = await store.snapshotReady();

		expect(repository.load).toHaveBeenCalledTimes(1);
		expect(snapshot).toEqual(loadedSettings);
		expect(store.isReady()).toBe(true);
	});

	it('init is idempotent and shares one load promise', async () => {
		const repository = {
			load: vi.fn(async () => {
				await Promise.resolve();
				return DEFAULT_SETTINGS;
			}),
			save: vi.fn(async () => undefined),
			clear: vi.fn(async () => undefined)
		};
		const store = new SettingsStore(repository as unknown as SettingsRepository);

		await Promise.all([store.init(), store.init(), store.ready()]);

		expect(repository.load).toHaveBeenCalledTimes(1);
		expect(store.isReady()).toBe(true);
	});

	it('update persists merged settings', async () => {
		const repository = {
			load: vi.fn(async () => DEFAULT_SETTINGS),
			save: vi.fn(async () => undefined),
			clear: vi.fn(async () => undefined)
		};
		const store = new SettingsStore(repository as unknown as SettingsRepository);

		await store.update({ autoSyncExecOnStartup: true, syncLocation: 'folder-id' });

		expect(repository.save).toHaveBeenCalledTimes(1);
		expect(repository.save).toHaveBeenCalledWith(
			expect.objectContaining({ autoSyncExecOnStartup: true, syncLocation: 'folder-id' })
		);
	});
});
