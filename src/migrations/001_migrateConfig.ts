import { ChromeStorageAdapter, Settings, SettingsRepository } from '~/config';
import { MigrationBase, type MigrationContext } from './types';

export class Migration extends MigrationBase {
	name = '001 - Migrate Config';
	description = 'Migrate configuration from individual keys to a single settings object';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async shouldMigrate(context: MigrationContext): Promise<boolean> {
		const adapter = new ChromeStorageAdapter();
		if (await adapter.get(SettingsRepository.STORAGE_KEY)) {
			console.debug('New settings key already exists, skipping migration');
			return false;
		}

		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async run(context: MigrationContext) {
		const adapter = new ChromeStorageAdapter();
		const keysToMigrate = [
			// [newKey, oldKey] - if oldKey is not provided, it defaults to newKey
			['clientId', 'clientID'],
			['clientSecret'],
			['accessToken'],
			['refreshToken'],
			['clientLastSync'],
			['syncLocation'],
			['autoSyncEnabled'],
			['autoSyncIntervalInMinutes'],
			['autoSyncExecOnStartup'],
			['useLegacySyncMechanism']
		];

		// Migrate existing settings to the new structure (a single settings object)
		const newObj: Record<string, unknown> = {};
		for (const [key, oldKey] of keysToMigrate) {
			const oldKeyToUse = oldKey ?? key;
			console.debug(`Migrating setting "${key}" from old key "${oldKeyToUse}"`);
			const value = (await chrome.storage.sync.get(oldKeyToUse))[oldKeyToUse];
			if (value !== undefined) {
				try {
					newObj[key] = JSON.parse(value as string);
				} catch {
					console.warn(`Failed to parse value for key "${oldKeyToUse}", using raw string value`);
					newObj[key] = value;
				}
				console.debug(`Migrated setting "${key}"`);
			}
		}
		const newSettings = Settings.parse(newObj);
		await adapter.set(SettingsRepository.STORAGE_KEY, newSettings);
		console.debug('Migration completed, new settings saved');

		// * Leave old keys in place for now
	}
}
