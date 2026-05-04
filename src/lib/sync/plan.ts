import {
	SyncActionCreateBookmark,
	SyncActionCreateFolder,
	SyncActionDelete,
	SyncActionUpdateBookmark,
	SyncActionUpdateFolder,
	type SyncAction
} from './action';
import type { SyncDiff } from './diff';

export class SyncPlan {
	readonly actions: SyncAction[] = [];

	addAction(action: SyncAction): void {
		this.actions.push(action);
	}
}

export class SyncPlanner {
	/**
	 * Generate a synchronization plan based on the differences between two trees.
	 * @param diff The SyncDiff object representing the differences between the source and target trees.
	 * @returns A SyncPlan object containing the actions needed to synchronize the target tree to match the source tree.
	 */
	generatePlan(diff: SyncDiff): SyncPlan {
		const plan = new SyncPlan();

		for (const node of diff.onlyInLeft) {
			if (node.isRoot()) {
				continue;
			}
			if (node.isFolder()) {
				plan.addAction(
					new SyncActionCreateFolder({
						path: node.getPath()
					})
				);
			} else {
				plan.addAction(
					new SyncActionCreateBookmark({
						path: node.getPath(),
						url: node.url!
					})
				);
			}
		}

		for (const { left, right } of diff.inBothButDifferent) {
			if (left.isRoot()) {
				continue;
			}
			if (left.isFolder()) {
				plan.addAction(
					new SyncActionUpdateFolder({
						id: right.id,
						title: left.title
					})
				);
			} else {
				plan.addAction(
					new SyncActionUpdateBookmark({
						id: right.id,
						title: left.title,
						url: left.url!
					})
				);
			}
		}

		// No action needed for unchanged nodes, but we can add a noop for clarity if desired.
		// for (const { left, right } of diff.unchanged) {
		// 	plan.addAction(new SyncActionNoop());
		// }

		for (const node of diff.onlyInRight) {
			if (node.isRoot()) {
				continue;
			}
			plan.addAction(
				new SyncActionDelete({
					id: node.id
				})
			);
		}

		return plan;
	}
}

export class SyncPlanOptimizer {
	optimize(plan: SyncPlan): SyncPlan {
		// No optimization implemented yet, just return the original plan for now.
		return plan;
	}
}
