import type { SyncDiff } from './diff';
import { SyncOp, SyncOpAdd, SyncOpDelete, SyncOpNoop, SyncOpUpdate } from './op';
import type { NodeData } from './tree';

export class SyncPlan {
	readonly operations: SyncOp[] = [];

	static fromDiff<L extends NodeData, R extends NodeData>(diff: SyncDiff<L, R>): SyncPlan {
		const plan = new SyncPlan();

		for (const node of diff.onlyInLeft) {
			const name = node.getName(),
				url = node.getUrl();

			if (!name || !url) {
				console.warn('Skipping adding node with missing name or url:', node);
				continue;
			}

			plan.addOp(
				new SyncOpAdd({
					path: node.getFullPath(),
					title: name,
					url: url
				})
			);
		}

		for (const { left, right } of diff.inBothButDifferent) {
			const name = left.getName(),
				url = left.getUrl();

			if (!name || !url) {
				console.warn('Skipping updating node with missing name or url:', left);
				continue;
			}

			plan.addOp(
				new SyncOpUpdate({
					path: right.getFullPath(),
					title: name,
					url: url
				})
			);
		}

		// Although no operation needed for unchanged nodes, leave it here for clarity
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const { left, right } of diff.unchanged) {
			plan.addOp(new SyncOpNoop({ path: right.getFullPath() }));
		}

		for (const node of diff.onlyInRight) {
			plan.addOp(
				new SyncOpDelete({
					path: node.getFullPath()
				})
			);
		}

		return plan;
	}

	addOp(op: SyncOp) {
		this.operations.push(op);
	}
}
