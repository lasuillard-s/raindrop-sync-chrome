import browserPolyfill from 'webextension-polyfill';
import { App } from '~/app';
import { doMigrate } from '~/migrations';
import type { MigrationContext } from '~/migrations/types';
import { SYNC_BOOKMARKS_ALARM_NAME } from '~/services/sync';

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
