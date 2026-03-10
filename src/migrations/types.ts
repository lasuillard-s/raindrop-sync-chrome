export interface MigrationContext {
	previousVersion: string;
	installedVersion: string;
}

export abstract class MigrationBase {
	abstract name: string;
	abstract description: string;

	abstract shouldMigrate(context: MigrationContext): Promise<boolean>;
	abstract run(context: MigrationContext): Promise<void>;
}
