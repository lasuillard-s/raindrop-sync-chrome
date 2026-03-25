import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsRepository } from '~/config';
import { Migration } from './001_migrateConfig';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe('Migration.shouldMigrate', () => {
	it('returns false when unified settings already exist', async () => {
		// Arrange
		const get = vi.fn(async (keyOrKeys: string | string[]) => {
			const key = Array.isArray(keyOrKeys) ? keyOrKeys[0] : keyOrKeys;
			if (key === SettingsRepository.STORAGE_KEY) {
				return {
					[key]: JSON.stringify({ autoSyncEnabled: true })
				};
			}
			return { [key]: undefined };
		});

		vi.stubGlobal('chrome', {
			storage: {
				sync: {
					get,
					set: vi.fn()
				}
			}
		});

		const migration = new Migration();

		// Act
		const shouldMigrate = await migration.shouldMigrate({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});

		// Assert
		expect(shouldMigrate).toBe(false);
		expect(get).toHaveBeenCalledWith([SettingsRepository.STORAGE_KEY]);
	});

	it('returns true when unified settings do not exist yet', async () => {
		// Arrange
		const get = vi.fn(async (keyOrKeys: string | string[]) => {
			const key = Array.isArray(keyOrKeys) ? keyOrKeys[0] : keyOrKeys;
			return { [key]: undefined };
		});

		vi.stubGlobal('chrome', {
			storage: {
				sync: {
					get,
					set: vi.fn()
				}
			}
		});

		const migration = new Migration();

		// Act
		const shouldMigrate = await migration.shouldMigrate({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});

		// Assert
		expect(shouldMigrate).toBe(true);
		expect(get).toHaveBeenCalledWith([SettingsRepository.STORAGE_KEY]);
	});
});

describe('Migration.run', () => {
	it('collects legacy keys and saves a normalized settings object', async () => {
		// Arrange
		const legacyValues: Record<string, string | undefined> = {
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
		const get = vi.fn(async (key: string) => ({
			[key]: legacyValues[key]
		}));
		const set = vi.fn(async (value: Record<string, string>) => {
			void value;
		});

		vi.stubGlobal('chrome', {
			storage: {
				sync: {
					get,
					set
				}
			}
		});

		const migration = new Migration();

		// Act
		await migration.run({
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		});

		// Assert
		expect(get).toHaveBeenCalledWith('clientID');
		expect(get).toHaveBeenCalledWith('clientSecret');
		expect(get).toHaveBeenCalledWith('autoSyncEnabled');
		expect(set).toHaveBeenCalledTimes(1);

		const firstSetCall = vi.mocked(set).mock.calls[0];
		expect(firstSetCall).toBeDefined();
		const persistedPayload = firstSetCall[0];
		const persisted = JSON.parse(persistedPayload[SettingsRepository.STORAGE_KEY]);
		expect(persisted).toMatchObject({
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
		});
	});
});
