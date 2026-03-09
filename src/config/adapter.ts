export interface StorageAdapter {
	get(key: string): Promise<unknown>;
	set(key: string, value: unknown): Promise<void>;
	remove(key: string): Promise<void>;
}

export class InMemoryStorageAdapter implements StorageAdapter {
	private map: Map<string, unknown> = new Map();

	async get(key: string): Promise<unknown> {
		return this.map.get(key);
	}

	async set(key: string, value: unknown): Promise<void> {
		this.map.set(key, value);
	}

	async remove(key: string): Promise<void> {
		this.map.delete(key);
	}
}

export class ChromeStorageAdapter implements StorageAdapter {
	private storageArea: chrome.storage.StorageArea;

	constructor(storageArea?: chrome.storage.StorageArea) {
		this.storageArea = storageArea ?? chrome.storage.sync;
	}

	async get(key: string): Promise<unknown> {
		const result = await this.storageArea.get([key]);
		const stored = result[key];
		return stored;
	}

	async set(key: string, value: unknown): Promise<void> {
		await this.storageArea.set({ [key]: value });
	}

	async remove(key: string): Promise<void> {
		await this.storageArea.remove([key]);
	}
}
