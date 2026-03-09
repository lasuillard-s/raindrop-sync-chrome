import { InMemoryStorage } from '~/lib/store';
import { AppSettings } from './settings';

export { ChromeStorageAdapter, InMemoryStorageAdapter, type StorageAdapter } from './adapter';
export { SettingsRepository } from './repository';
export { DEFAULT_SETTINGS, Settings } from './settings';
export { SettingsStore, type SettingsState } from './store';

export const appSettings = new AppSettings({
	storage: import.meta.env.MODE === 'test' ? new InMemoryStorage() : chrome.storage.sync
});
