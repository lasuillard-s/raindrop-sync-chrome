import { Migration as _001_Migration } from './001_migrateConfig';
import type { MigrationContext } from './types';

const migrations = [new _001_Migration()];

/**
 * Runs necessary migrations based on the provided context.
 * @param context Migration context.
 */
export async function doMigrate(context: MigrationContext) {
	console.debug('Running migrations');
	for (const migration of migrations) {
		console.debug(`${migration.name}: ${migration.description}`);
		if (!(await migration.shouldMigrate(context))) {
			continue;
		}
		await migration.run(context);
	}
}
