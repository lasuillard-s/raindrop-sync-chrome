import { describe, expect, it, vi } from 'vitest';
import type { StorageAdapter } from './adapter';
import { SettingsRepository } from './repository';
import { DEFAULT_SETTINGS } from './settings';

type AdapterDouble = {
	adapter: StorageAdapter;
	get: ReturnType<typeof vi.fn>;
	set: ReturnType<typeof vi.fn>;
	remove: ReturnType<typeof vi.fn>;
};

/**
 * Creates a test double for StorageAdapter.
 * @param args Optional configuration for the adapter double.
 * @param args.stored Value to return from get().
 * @param args.getError Error to throw from get().
 * @param args.setError Error to throw from set().
 * @param args.removeError Error to throw from remove().
 * @returns An object with the adapter and spy references.
 */
function createAdapterDouble(args?: {
	stored?: unknown;
	getError?: Error;
	setError?: Error;
	removeError?: Error;
}): AdapterDouble {
	const get = vi.fn(async () => {
		if (args?.getError) {
			throw args.getError;
		}
		return args?.stored;
	});
	const set = vi.fn(async () => {
		if (args?.setError) {
			throw args.setError;
		}
	});
	const remove = vi.fn(async () => {
		if (args?.removeError) {
			throw args.removeError;
		}
	});

	return {
		adapter: {
			get,
			set,
			remove
		},
		get,
		set,
		remove
	};
}

describe('SettingsRepository', () => {
	it('returns default settings when no stored value exists', async () => {
		const { adapter, get } = createAdapterDouble({ stored: undefined });
		const repository = new SettingsRepository(adapter);

		const loaded = await repository.load();

		expect(get).toHaveBeenCalledWith(SettingsRepository.STORAGE_KEY);
		expect(loaded).toEqual(DEFAULT_SETTINGS);
	});

	it('parses and returns stored settings when value exists', async () => {
		const stored = {
			clientId: '',
			clientSecret: '',
			accessToken: '',
			refreshToken: '',
			clientLastSync: new Date(0).toISOString(),
			syncLocation: '',
			autoSyncEnabled: true,
			autoSyncIntervalInMinutes: 42,
			autoSyncExecOnStartup: false,
			useLegacySyncMechanism: true
		};
		const { adapter } = createAdapterDouble({ stored });
		const repository = new SettingsRepository(adapter);

		const loaded = await repository.load();

		expect(loaded.autoSyncEnabled).toBe(true);
		expect(loaded.autoSyncIntervalInMinutes).toBe(42);
	});

	it('returns default settings when load throws', async () => {
		const error = new Error('boom-load');
		const { adapter } = createAdapterDouble({ getError: error });
		const repository = new SettingsRepository(adapter);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const loaded = await repository.load();

		expect(loaded).toEqual(DEFAULT_SETTINGS);
		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});

	it('saves settings under the appSettings storage key', async () => {
		const { adapter, set } = createAdapterDouble();
		const repository = new SettingsRepository(adapter);

		await repository.save(DEFAULT_SETTINGS);

		expect(set).toHaveBeenCalledWith(SettingsRepository.STORAGE_KEY, DEFAULT_SETTINGS);
	});

	it('rethrows save errors', async () => {
		const error = new Error('boom-save');
		const { adapter } = createAdapterDouble({ setError: error });
		const repository = new SettingsRepository(adapter);

		await expect(repository.save(DEFAULT_SETTINGS)).rejects.toThrow('boom-save');
	});

	it('clears settings from the appSettings storage key', async () => {
		const { adapter, remove } = createAdapterDouble();
		const repository = new SettingsRepository(adapter);

		await repository.clear();

		expect(remove).toHaveBeenCalledWith(SettingsRepository.STORAGE_KEY);
	});

	it('rethrows clear errors', async () => {
		const error = new Error('boom-clear');
		const { adapter } = createAdapterDouble({ removeError: error });
		const repository = new SettingsRepository(adapter);

		await expect(repository.clear()).rejects.toThrow('boom-clear');
	});
});
