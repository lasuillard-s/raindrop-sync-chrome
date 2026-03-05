import type { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import type { SyncPlan } from './plan';

export class SyncExecutor {
	repository: ChromeBookmarkRepository;
	plan: SyncPlan;

	constructor(opts: { repository: ChromeBookmarkRepository; plan: SyncPlan }) {
		this.repository = opts.repository;
		this.plan = opts.plan;
	}

	async execute() {
		for (const op of this.plan.operations) {
			await op.apply(this.repository);
		}
	}
}
