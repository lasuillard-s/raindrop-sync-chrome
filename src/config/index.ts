import { DummyStorage } from '~/lib/store';
import { AppSettings } from './settings';

export const appSettings = new AppSettings({
	storage: import.meta.env.MODE === 'test' ? new DummyStorage() : chrome.storage.sync
});
