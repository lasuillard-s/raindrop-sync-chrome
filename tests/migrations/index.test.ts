import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MigrationContext } from '~/migrations/types';

afterEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	vi.doUnmock('~/migrations/001_migrateConfig');
});

/**
 * Dynamically imports the migration runner with a mocked migration implementation.
 * @param args Optional migration behavior configuration.
 * @param args.shouldMigrate Guard decision returned by mocked shouldMigrate.
 * @returns The runner function plus migration guard/action spies.
 */
async function loadDoMigrate(args?: { shouldMigrate?: boolean }) {
	const shouldMigrate = vi.fn(async () => args?.shouldMigrate ?? true);
	const run = vi.fn(async () => undefined);

	vi.doMock('~/migrations/001_migrateConfig', () => ({
		Migration: class {
			name = '001 - Migrate Config';
			description = 'Migrate configuration from individual keys to a single settings object';
			shouldMigrate = shouldMigrate;
			run = run;
		}
	}));

	const module = await import('~/migrations/index');

	return {
		doMigrate: module.doMigrate,
		shouldMigrate,
		run
	};
}

describe('doMigrate', () => {
	it('runs migrations whose guard passes', async () => {
		// Arrange
		const context: MigrationContext = {
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		};
		const { doMigrate, shouldMigrate, run } = await loadDoMigrate({ shouldMigrate: true });

		// Act
		await doMigrate(context);

		// Assert
		expect(shouldMigrate).toHaveBeenCalledWith(context);
		expect(run).toHaveBeenCalledWith(context);
	});

	it('skips migrations whose guard fails', async () => {
		// Arrange
		const context: MigrationContext = {
			previousVersion: '0.5.0',
			installedVersion: '0.6.1'
		};
		const { doMigrate, shouldMigrate, run } = await loadDoMigrate({ shouldMigrate: false });

		// Act
		await doMigrate(context);

		// Assert
		expect(shouldMigrate).toHaveBeenCalledWith(context);
		expect(run).not.toHaveBeenCalled();
	});
});
