import type { WritableBookmarkRepository } from '~/lib/browser';
import type { SyncPlan } from './plan';

export class SyncExecutor {
	repository: WritableBookmarkRepository;
	plan: SyncPlan;

	constructor(opts: { repository: WritableBookmarkRepository; plan: SyncPlan }) {
		this.repository = opts.repository;
		this.plan = opts.plan;
	}

	async execute() {
		for (const op of this.plan.operations) {
			await op.apply(this.repository);
		}
	}
}
