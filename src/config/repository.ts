import type { StorageAdapter } from './adapter';
import { ChromeStorageAdapter } from './adapter';
import { DEFAULT_SETTINGS, Settings } from './settings';

export class SettingsRepository {
	static readonly STORAGE_KEY = 'appSettings';

	private adapter: StorageAdapter;

	constructor(adapter?: StorageAdapter) {
		this.adapter = adapter ?? new ChromeStorageAdapter();
	}

	async load(): Promise<Settings> {
		try {
			const stored = await this.adapter.get(SettingsRepository.STORAGE_KEY);
			if (!stored) {
				console.debug('No settings found in storage, using default settings');
				return DEFAULT_SETTINGS;
			}
			return Settings.parse(stored);
		} catch (err) {
			console.error('Failed to load settings:', err);
			return DEFAULT_SETTINGS;
		}
	}

	async save(settings: Settings): Promise<void> {
		try {
			await this.adapter.set(SettingsRepository.STORAGE_KEY, settings);
			console.debug('Settings saved to storage successfully');
		} catch (err) {
			console.error('Failed to save settings:', err);
			throw err;
		}
	}

	async clear(): Promise<void> {
		try {
			await this.adapter.remove(SettingsRepository.STORAGE_KEY);
			console.debug('Settings cleared from storage successfully');
		} catch (err) {
			console.error('Failed to clear settings from storage:', err);
			throw err;
		}
	}
}
