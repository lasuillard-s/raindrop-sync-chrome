import { get } from 'svelte/store';
import { appSettings } from '~/config';
import syncManager from '~/lib/sync';

chrome.runtime.onInstalled.addListener(async (details) => {
	switch (details.reason) {
		case chrome.runtime.OnInstalledReason.INSTALL:
			console.debug('Extension installed');
			break;
		case chrome.runtime.OnInstalledReason.UPDATE:
			console.debug('Extension updated');
			break;
	}

	console.info('Re-scheduling auto-sync');
	await syncManager.scheduleAutoSync();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
	console.debug('Alarm fired:', alarm.name);
	switch (alarm.name) {
		case 'sync-bookmarks': {
			console.debug('Syncing bookmarks');
			const useLegacySyncMechanism = get(appSettings.useLegacySyncMechanism);
			await syncManager.startSync({
				useLegacy: useLegacySyncMechanism
			});
			break;
		}
	}
});
