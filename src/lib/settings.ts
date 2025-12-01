import { DummyStorage, persisted, type AsyncWritable, type Storage } from './stores';

export class AppSettings {
	// API credentials
	clientID: AsyncWritable<string>;
	clientSecret: AsyncWritable<string>;
	accessToken: AsyncWritable<string>;
	refreshToken: AsyncWritable<string>;

	/** Timestamp of the last time changes made in Raindrop.io */
	clientLastSync: AsyncWritable<Date>;

	/** Parent bookmark ID to create new bookmarks under */
	syncLocation: AsyncWritable<string>;

	// Auto-sync configurations
	autoSyncEnabled: AsyncWritable<boolean>;
	autoSyncIntervalInMinutes: AsyncWritable<number>;
	autoSyncExecOnStartup: AsyncWritable<boolean>;

	constructor(opts: { storage: Storage }) {
		const storeOpts = {
			storage: opts.storage
		};

		this.clientID = persisted('clientID', '', storeOpts);
		this.clientSecret = persisted('clientSecret', '', storeOpts);
		this.accessToken = persisted('accessToken', '', storeOpts);
		this.refreshToken = persisted('refreshToken', '', storeOpts);

		// Timestamp of the last time changes made in Raindrop.io
		this.clientLastSync = persisted('clientLastSync', new Date(0), {
			...storeOpts,
			serializer: (value: Date) => value.toJSON(),
			deserializer: (value: string) => new Date(value)
		});

		// Parent bookmark ID to create new bookmarks under
		this.syncLocation = persisted<string>('syncLocation', '', storeOpts);

		// Auto-sync configurations
		this.autoSyncEnabled = persisted('autoSyncEnabled', false, storeOpts);
		this.autoSyncIntervalInMinutes = persisted('autoSyncIntervalInMinutes', 5, storeOpts);
		this.autoSyncExecOnStartup = persisted('autoSyncExecOnStartup', false, storeOpts);
	}
}

const appSettingsDefault = new AppSettings({
	storage: import.meta.env.MODE === 'test' ? new DummyStorage() : chrome.storage.sync
});
export default appSettingsDefault;
