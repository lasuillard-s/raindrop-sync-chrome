import { expect, it } from 'vitest';
import { Settings } from '~/config';

it('defaults', () => {
	expect(Settings.parse({})).toEqual({
		accessToken: '',
		autoSyncEnabled: false,
		autoSyncExecOnStartup: false,
		autoSyncIntervalInMinutes: 5,
		clientId: '',
		clientLastSync: new Date(0),
		clientSecret: '',
		refreshToken: '',
		syncLocation: '',
		useLegacySyncMechanism: true
	});
});
