import { z } from 'zod';
import { persisted, type AsyncWritable, type Storage } from '~/lib/store';

export const Settings = z.object({
	clientId: z.string().default(''),
	clientSecret: z.string().default(''),
	accessToken: z.string().default(''),
	refreshToken: z.string().default(''),
	clientLastSync: z.date().default(new Date(0)),
	syncLocation: z.string().default(''),
	autoSyncEnabled: z.boolean().default(false),
	autoSyncIntervalInMinutes: z.int().min(1).max(1_440 /* 24H */).default(5),
	autoSyncExecOnStartup: z.boolean().default(false),
	useLegacySyncMechanism: z.boolean().default(false)
});
export type Settings = z.infer<typeof Settings>;
export const DEFAULT_SETTINGS = Settings.parse({});

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
	useLegacySyncMechanism: AsyncWritable<boolean>;

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
		this.useLegacySyncMechanism = persisted('useLegacySyncMechanism', false, storeOpts);
	}
}
