export interface StorageService {
	get(key: string): Promise<unknown>;
	set(key: string, value: unknown): Promise<void>;
	remove(key: string): Promise<void>;
}

export class WebExtensionStorageService implements StorageService {
	async get(key: string): Promise<unknown> {
		const result = await chrome.storage.sync.get(key);
		return result[key];
	}

	async set(key: string, value: unknown): Promise<void> {
		await chrome.storage.sync.set({ [key]: value });
	}

	async remove(key: string): Promise<void> {
		await chrome.storage.sync.remove([key]);
	}
}
