import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserSettingsRepository, DEFAULT_SETTINGS } from '~/config';

describe('BrowserSettingsRepository', () => {
	let repository: BrowserSettingsRepository;

	beforeEach(() => {
		repository = new BrowserSettingsRepository();
	});

	it('returns default settings when no stored value exists', async () => {
		vi.spyOn(browser.storage.sync, 'get').mockResolvedValue({});
		const loaded = await repository.load();
		expect(loaded).toEqual(DEFAULT_SETTINGS);
	});

	it('parses and returns stored settings when value exists', async () => {
		vi.spyOn(browser.storage.sync, 'get').mockResolvedValue({
			[BrowserSettingsRepository.STORAGE_KEY]: JSON.stringify({
				clientId: '',
				clientSecret: '',
				accessToken: '',
				refreshToken: '',
				clientLastSync: new Date(0).toISOString(),
				syncLocation: '',
				autoSyncEnabled: true,
				autoSyncIntervalInMinutes: 42,
				autoSyncExecOnStartup: false
			})
		});
		const loaded = await repository.load();
		expect(loaded).toEqual({
			accessToken: '',
			autoSyncEnabled: true,
			autoSyncExecOnStartup: false,
			autoSyncIntervalInMinutes: 42,
			clientId: '',
			clientLastSync: new Date(0),
			clientSecret: '',
			refreshToken: '',
			syncLocation: ''
		});
	});

	it('returns default settings when load throws', async () => {
		const spyGet = vi.spyOn(browser.storage.sync, 'get').mockImplementation(() => {
			throw new Error('boom!');
		});
		const loaded = await repository.load();
		expect(loaded).toEqual(DEFAULT_SETTINGS);
		expect(spyGet).toHaveBeenCalled();
	});

	it('saves settings under the appSettings storage key', async () => {
		const spySet = vi.spyOn(browser.storage.sync, 'set');
		await repository.save(DEFAULT_SETTINGS);
		expect(spySet).toHaveBeenCalledWith({
			[BrowserSettingsRepository.STORAGE_KEY]: JSON.stringify(DEFAULT_SETTINGS)
		});
	});

	it('rethrows save errors', async () => {
		vi.spyOn(browser.storage.sync, 'set').mockImplementation(() => {
			throw new Error('boom!');
		});
		await expect(repository.save(DEFAULT_SETTINGS)).rejects.toThrow('boom!');
	});

	it('clears settings from the appSettings storage key', async () => {
		const spyRemove = vi.spyOn(browser.storage.sync, 'remove');
		await repository.clear();
		expect(spyRemove).toHaveBeenCalledWith(BrowserSettingsRepository.STORAGE_KEY);
	});

	it('rethrows clear errors', async () => {
		vi.spyOn(browser.storage.sync, 'remove').mockImplementation(() => {
			throw new Error('boom!');
		});
		await expect(repository.clear()).rejects.toThrow('boom');
	});
});
