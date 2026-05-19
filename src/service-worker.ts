import { App } from '$app';
import { doMigrate } from '$migrations';
import type { MigrationContext } from '$migrations/types';
import { SYNC_BOOKMARKS_ALARM_NAME } from '$services/sync';
import browserPolyfill from 'webextension-polyfill';

globalThis.browser = browserPolyfill as unknown as typeof browser;

const app = App.getInstance();

browser.runtime.onInstalled.addListener(async (details) => {
	switch (details.reason) {
		case 'install': {
			console.debug('Extension installed');
			break;
		}
		case 'update': {
			console.debug('Extension updated');

			// Run migrations on extension update
			const context: MigrationContext = {
				previousVersion: details.previousVersion || '0.0.0',
				installedVersion: (await browser.management.getSelf()).version
			};
			await doMigrate(context);

			break;
		}
	}

	await app.sync.scheduleAutoSync();
});

// ! onStartup callback may not be triggered if you launch the browser with extension loaded (--load-extension),
// ! because the browser would consider it as a new installation or update, thus triggering onInstalled event instead.
// ! To test onStartup behavior, load the extension, then restart the browser without --load-extension flag
browser.runtime.onStartup.addListener(async () => {
	console.debug('Browser startup detected');
	const settings = app.settings;
	await settings.ready();
	if (settings.snapshot.autoSyncEnabled && settings.snapshot.autoSyncExecOnStartup) {
		console.debug('Auto-sync is enabled and startup sync is enabled, running sync now...');
		await app.sync.runFullSync();
	} else {
		console.debug('Auto-sync is disabled or startup sync is disabled, skipping sync.');
	}
});

browser.alarms.onAlarm.addListener(async (alarm) => {
	console.debug('Alarm fired:', alarm.name);
	switch (alarm.name) {
		case SYNC_BOOKMARKS_ALARM_NAME: {
			console.debug('Syncing bookmarks');
			const settings = app.settings;
			await settings.ready();
			await app.sync.runFullSync();
			break;
		}
	}
});
