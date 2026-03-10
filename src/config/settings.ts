import { z } from 'zod';

export const Settings = z.object({
	clientId: z.string().default(''),
	clientSecret: z.string().default(''),
	accessToken: z.string().default(''),
	refreshToken: z.string().default(''),
	clientLastSync: z.string().pipe(z.coerce.date()).default(new Date(0)),
	syncLocation: z.string().default(''),
	autoSyncEnabled: z.boolean().default(false),
	autoSyncIntervalInMinutes: z.int().min(1).max(1_440 /* 24H */).default(5),
	autoSyncExecOnStartup: z.boolean().default(false),
	useLegacySyncMechanism: z.boolean().default(true)
});
export type Settings = z.infer<typeof Settings>;

export const DEFAULT_SETTINGS = Settings.parse({});
