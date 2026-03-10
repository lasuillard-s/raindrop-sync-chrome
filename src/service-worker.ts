import { SyncManager } from '~/lib/sync';
import { doMigrate } from '~/migrations';
import type { MigrationContext } from '~/migrations/types';
import { SettingsStore } from './config';

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
			await new SyncManager().startSync({ useLegacy: useLegacySyncMechanism });
			break;
		}
	}
});
