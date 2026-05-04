import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserSettingsRepository, DEFAULT_SETTINGS } from '~/config';
import { defaultBrowserProxy } from '~/lib/browser';
import { Migration } from '~/migrations/001_migrateConfig';

let migration: Migration;

beforeEach(() => {
	migration = new Migration();
});

describe('shouldMigrate', () => {
	it('returns false when new settings already exist', async () => {
		// Arrange
		vi.spyOn(defaultBrowserProxy.storage, 'get').mockResolvedValue(
			JSON.stringify(DEFAULT_SETTINGS)
		);

		// Act
		const shouldMigrate = await migration.shouldMigrate({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});

		// Assert
		expect(shouldMigrate).toBe(false);
	});

	it('returns true when unified settings do not exist yet', async () => {
		// Arrange
		vi.spyOn(defaultBrowserProxy.storage, 'get').mockResolvedValue(undefined);

		// Act
		const shouldMigrate = await migration.shouldMigrate({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});

		// Assert
		expect(shouldMigrate).toBe(true);
	});

	it('returns true when unified settings cannot be parsed', async () => {
		// Arrange
		vi.spyOn(defaultBrowserProxy.storage, 'get').mockResolvedValue('not a valid json');

		// Act
		const shouldMigrate = await migration.shouldMigrate({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});

		// Assert
		expect(shouldMigrate).toBe(true);
	});
});

describe('run', () => {
	it('collects legacy keys and saves a normalized settings object', async () => {
		// Arrange
		const oldSettings = {
			clientID: '"client-123"',
			clientSecret: 'secret-raw',
			accessToken: '"access-token"',
			refreshToken: '"refresh-token"',
			clientLastSync: '"2026-01-01T00:00:00.000Z"',
			syncLocation: '"folder-id"',
			autoSyncEnabled: 'true',
			autoSyncIntervalInMinutes: '15',
			autoSyncExecOnStartup: 'true',
			useLegacySyncMechanism: 'false'
		};
		vi.spyOn(defaultBrowserProxy.storage, 'get').mockImplementation((key) => {
			return Promise.resolve(oldSettings[key as keyof typeof oldSettings]);
		});
		const mockSet = vi.spyOn(defaultBrowserProxy.storage, 'set');

		// Act
		await migration.run({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});

		// Assert
		expect(mockSet).toHaveBeenCalledExactlyOnceWith(
			BrowserSettingsRepository.STORAGE_KEY,
			JSON.stringify({
				clientId: 'client-123',
				clientSecret: 'secret-raw',
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				clientLastSync: '2026-01-01T00:00:00.000Z',
				syncLocation: 'folder-id',
				autoSyncEnabled: true,
				autoSyncIntervalInMinutes: 15,
				autoSyncExecOnStartup: true,
				useLegacySyncMechanism: false
			})
		);
	});
});
