import { SyncActionType } from './action';
import type { WritableAdapter } from './adapter';
import type { SyncPlan } from './plan';

export class SyncReport {
	created: number;
	updated: number;
	deleted: number;
	errors: Error[];

	constructor() {
		this.created = 0;
		this.updated = 0;
		this.deleted = 0;
		this.errors = [];
	}
}

export class SyncExecutor {
	async execute(plan: SyncPlan, target: WritableAdapter): Promise<SyncReport> {
		const report = new SyncReport();
		for (const action of plan.actions) {
			try {
				await target.applyAction(action);
				switch (action.type) {
					case SyncActionType.CreateBookmark:
						report.created++;
						break;
					case SyncActionType.UpdateBookmark:
						report.updated++;
						break;
					case SyncActionType.Delete:
						report.deleted++;
						break;
				}
			} catch (error) {
				const errorObj = error instanceof Error ? error : new Error(String(error));
				console.error(`Failed to apply action: ${action.constructor.name}`, errorObj);
				report.errors.push(errorObj);
			}
		}
		return report;
	}
}
