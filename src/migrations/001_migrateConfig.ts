import { ChromeStorageAdapter } from '~/config/adapter';
import { SettingsRepository } from '~/config/repository';
import { MigrationBase, type MigrationContext } from './types';

export class Migration extends MigrationBase {
	name = '001 - Migrate Config';
	description = 'Migrate configuration from individual keys to a single settings object';

	async shouldMigrate(context: MigrationContext): Promise<boolean> {
		const adapter = new ChromeStorageAdapter();
		if (await adapter.get(SettingsRepository.STORAGE_KEY)) {
			console.debug('New settings key already exists, skipping migration');
			return false;
		}

		// ? Consider using a proper semver library for version comparison if the logic gets more complex in the future
		if (context.previousVersion <= '0.6.1') {
			return true;
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
			console.debug(`Migrating setting "${key}" from old key "${oldKey ?? key}"`);
			const value = (await adapter.get(oldKey ?? key)) as string;
			if (value !== undefined) {
				newObj[key] = JSON.parse(value);
				console.debug(`Migrated setting "${key}"`);
			}
		}
		await adapter.set(SettingsRepository.STORAGE_KEY, newObj);

		// * Leave old keys in place for now
	}
}
