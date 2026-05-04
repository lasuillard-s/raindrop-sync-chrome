import { defaultBrowserProxy, type BrowserProxy } from '~/lib/browser';
import { DEFAULT_SETTINGS, Settings } from './settings';

export abstract class SettingsRepository {
	abstract load(): Promise<Settings>;
	abstract save(settings: Settings): Promise<void>;
	abstract clear(): Promise<void>;
}

export class BrowserSettingsRepository extends SettingsRepository {
	static readonly STORAGE_KEY = 'appSettings';

	protected browserProxy: BrowserProxy;

	constructor(browserProxy?: BrowserProxy) {
		super();
		this.browserProxy = browserProxy ?? defaultBrowserProxy;
	}

	async load(): Promise<Settings> {
		try {
			const stored = await this.browserProxy.storage.get(BrowserSettingsRepository.STORAGE_KEY);
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
			await this.browserProxy.storage.set(BrowserSettingsRepository.STORAGE_KEY, serialized);
			console.debug('Settings saved to storage successfully');
		} catch (err) {
			console.error('Failed to save settings:', err);
			throw err;
		}
	}

	async clear(): Promise<void> {
		try {
			await this.browserProxy.storage.remove(BrowserSettingsRepository.STORAGE_KEY);
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
