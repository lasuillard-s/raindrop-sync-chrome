import { SyncManager } from '~/lib/sync';
import { doMigrate } from '~/migrations';
import type { MigrationContext } from '~/migrations/types';

// Test-specific code
// ============================================================================
import { SettingsStore } from '~/config';
import { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import { Path } from '~/lib/util/path';

// ? Expose some elements to the global scope for testing (/e2e/lib) and debugging purposes.
const testPopulateGlobals = !!import.meta.env.VITE_TEST_POPULATE_GLOBALS;
if (testPopulateGlobals) {
	console.warn(
		'Populating global scope with internal modules for testing and debugging purposes. This should not be used in production.'
	);
	Object.assign(globalThis, {
		ChromeBookmarkRepository,
		Path
	});
}
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
	switch (details.reason) {
		case chrome.runtime.OnInstalledReason.INSTALL: {
			console.debug('Extension installed');
			break;
		}
		case chrome.runtime.OnInstalledReason.UPDATE: {
			console.debug('Extension updated');

			// Run migrations on extension update
			const context: MigrationContext = {
				previousVersion: details.previousVersion || '0.0.0',
				installedVersion: (await chrome.management.getSelf()).version
			};
			await doMigrate(context);

			break;
		}
	}

	await new SyncManager().scheduleAutoSync();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
	console.debug('Alarm fired:', alarm.name);
	switch (alarm.name) {
		case 'sync-bookmarks': {
			console.debug('Syncing bookmarks');
			const settings = SettingsStore.getOrCreate();
			await settings.ready();
			const useLegacySyncMechanism = settings.snapshot.useLegacySyncMechanism;
			await new SyncManager({ settings }).startSync({ useLegacy: useLegacySyncMechanism });
			break;
		}
	}
});
