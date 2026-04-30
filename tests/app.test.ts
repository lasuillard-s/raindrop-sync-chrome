import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SettingsStore } from '~/config';
import type { SyncService } from '~/services/sync';

describe('App', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('returns the same singleton instance from App.getInstance', async () => {
		// Arrange
		const { App } = await import('~/app');

		// Act
		const first = App.getInstance();
		const second = App.getInstance();

		// Assert
		expect(first).toBe(second);
	});

	it('preserves constructor-based dependency injection', async () => {
		// Arrange
		const { App } = await import('~/app');
		const settings = {} as SettingsStore;
		const sync = {} as SyncService;

		// Act
		const app = new App({ settings, sync });

		// Assert
		expect(app.settings).toBe(settings);
		expect(app.sync).toBe(sync);
	});
});
