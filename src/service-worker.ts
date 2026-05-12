import { App } from '~/app';
import { doMigrate } from '~/migrations';
import type { MigrationContext } from '~/migrations/types';
import { SYNC_BOOKMARKS_ALARM_NAME } from '~/services/sync';
import { defaultBrowserProxy } from './lib/browser';

const app = App.getInstance();
const browserProxy = defaultBrowserProxy;

browserProxy.runtime.onInstalledAddListener(async (details) => {
	const installedReason = browserProxy.runtime.getOnInstalledReason();

	switch (details.reason) {
		case installedReason.INSTALL: {
			console.debug('Extension installed');
			break;
		}
		case installedReason.UPDATE: {
			console.debug('Extension updated');

			// Run migrations on extension update
			const context: MigrationContext = {
				previousVersion: details.previousVersion || '0.0.0',
				installedVersion: (await browserProxy.management.getSelf()).version
			};
			await doMigrate(context);

			break;
		}
	}

	await app.sync.scheduleAutoSync();
});

browserProxy.alarms.onAlarmAddListener(async (alarm) => {
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
