import { Path } from '~/lib/util/path';
import type { SyncDiff } from './diff';
import { SyncOp, SyncOpAdd, SyncOpDelete, SyncOpNoop, SyncOpUpdate } from './op';
import type { NodeData } from './tree';

export class SyncPlan {
	readonly operations: SyncOp[] = [];

	/**
	 * Create a SyncPlan from a SyncDiff.
	 * @param diff The SyncDiff object representing differences between trees.
	 * @param syncFolder The base folder path for synchronization.
	 * @returns A SyncPlan representing the operations needed to synchronize.
	 */
	static fromDiff<L extends NodeData, R extends NodeData>(
		diff: SyncDiff<L, R>,
		syncFolder: Path
	): SyncPlan {
		const plan = new SyncPlan();

		for (const node of diff.onlyInLeft) {
			const name = node.getName(),
				url = node.getUrl();

			if (!name || !url) {
				console.warn('Skipping adding node with missing name or url:', node);
				continue;
			}
			const path = syncFolder.joinPath(...node.getFullPath().getSegments());
			console.debug('Computed path for addition:', path, 'from:', syncFolder, node);
			plan.addOp(
				new SyncOpAdd({
					path,
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

	/**
	 * Add an operation to the sync plan.
	 * @param op The SyncOp to add.
	 */
	addOp(op: SyncOp) {
		this.operations.push(op);
	}
}
