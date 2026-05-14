import { defaultBrowserProxy } from '$lib/browser';
import { BrowserSettingsRepository, Settings } from '$config';
import { MigrationBase, type MigrationContext } from './types';

export class Migration extends MigrationBase {
	name = '001 - Migrate Config';
	description = 'Migrate configuration from individual keys to a single settings object';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async shouldMigrate(context: MigrationContext): Promise<boolean> {
		let existing: unknown;

		// Check if new settings key already exists and is valid
		try {
			existing = await defaultBrowserProxy.storage.get(BrowserSettingsRepository.STORAGE_KEY);
			if (!existing) {
				console.debug('New settings key does not exist, proceeding with migration');
				return true;
			}
		} catch (err) {
			console.warn(
				'Failed to read unified settings during migration check, continuing with migration:',
				err
			);
			return true;
		}

		// If the key exists, check if it can be parsed as valid JSON
		try {
			Settings.parse(JSON.parse(existing as string));
			console.debug('New settings key is valid, skipping migration');
			return false;
		} catch (err) {
			console.warn('New settings key is invalid, proceeding with migration:', err);
			return true;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async run(context: MigrationContext) {
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
			['autoSyncExecOnStartup']
		];

		// Migrate existing settings to the new structure (a single settings object)
		const newObj: Record<string, unknown> = {};
		for (const [key, oldKey] of keysToMigrate) {
			const oldKeyToUse = oldKey ?? key;
			console.debug(`Migrating setting "${key}" from old key "${oldKeyToUse}"`);
			const value = await defaultBrowserProxy.storage.get(oldKeyToUse);
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
		const serialized = JSON.stringify(newSettings);
		await defaultBrowserProxy.storage.set(BrowserSettingsRepository.STORAGE_KEY, serialized);
		console.debug('Migration completed, new settings saved');

		// * Leave old keys in place for now
	}
}
