import type { Worker } from '@playwright/test';

const APP_SETTINGS_STORAGE_KEY = 'appSettings';

type AppSettings = Record<string, unknown>;

export class AppSettingsFixture {
	constructor(private readonly serviceWorker: Worker) {}

	async get(): Promise<AppSettings | null> {
		return await this.serviceWorker.evaluate(async (storageKey) => {
			const stored = await chrome.storage.sync.get(storageKey);
			const raw = stored[storageKey];
			if (raw === undefined) {
				return null;
			}
			if (typeof raw === 'string') {
				return JSON.parse(raw) as AppSettings;
			}
			return raw as AppSettings;
		}, APP_SETTINGS_STORAGE_KEY);
	}

	async set(patch: AppSettings): Promise<void> {
		await this.serviceWorker.evaluate(
			async ({ storageKey, nextPatch }) => {
				const stored = await chrome.storage.sync.get(storageKey);
				const currentRaw = stored[storageKey];
				const current =
					typeof currentRaw === 'string'
						? (JSON.parse(currentRaw) as AppSettings)
						: ((currentRaw as AppSettings | undefined) ?? {});
				const merged = {
					...current,
					...nextPatch
				};
				await chrome.storage.sync.set({
					[storageKey]: JSON.stringify(merged)
				});
			},
			{ storageKey: APP_SETTINGS_STORAGE_KEY, nextPatch: patch }
		);
	}

	async clear(): Promise<void> {
		await this.serviceWorker.evaluate(async (storageKey) => {
			await chrome.storage.sync.remove(storageKey);
		}, APP_SETTINGS_STORAGE_KEY);
	}
}
