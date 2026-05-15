import { DEFAULT_SETTINGS, Settings } from './settings';

export abstract class SettingsRepository {
	abstract load(): Promise<Settings>;
	abstract save(settings: Settings): Promise<void>;
	abstract clear(): Promise<void>;
}

export class BrowserSettingsRepository extends SettingsRepository {
	static readonly STORAGE_KEY = 'appSettings';

	async load(): Promise<Settings> {
		try {
			const stored = (await browser.storage.sync.get(BrowserSettingsRepository.STORAGE_KEY))[
				BrowserSettingsRepository.STORAGE_KEY
			];
			if (!stored) {
				console.debug('No settings found in storage, using default settings');
				return DEFAULT_SETTINGS;
			}
			const deserialized = JSON.parse(stored as string);
			return Settings.parse(deserialized);
		} catch (err) {
			console.error('Failed to load settings:', err);
			return DEFAULT_SETTINGS;
		}
	}

	async save(settings: Settings): Promise<void> {
		try {
			const serialized = JSON.stringify(settings);
			await browser.storage.sync.set({ [BrowserSettingsRepository.STORAGE_KEY]: serialized });
			console.debug('Settings saved to storage successfully');
		} catch (err) {
			console.error('Failed to save settings:', err);
			throw err;
		}
	}

	async clear(): Promise<void> {
		try {
			await browser.storage.sync.remove(BrowserSettingsRepository.STORAGE_KEY);
			console.debug('Settings cleared from storage successfully');
		} catch (err) {
			console.error('Failed to clear settings from storage:', err);
			throw err;
		}
	}
}

/** In-memory implementation of SettingsRepository for testing purposes */
export class InMemorySettingsRepository extends SettingsRepository {
	protected settings: Settings;

	constructor(settings?: Settings) {
		super();
		this.settings = settings ?? DEFAULT_SETTINGS;
	}

	async load(): Promise<Settings> {
		return this.settings;
	}

	async save(settings: Settings): Promise<void> {
		this.settings = settings;
	}

	async clear(): Promise<void> {
		this.settings = DEFAULT_SETTINGS;
	}
}
