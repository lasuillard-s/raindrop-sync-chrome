import type { Path } from '@lib/util/path';
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
					id: node.id,
					path: node.getPath(),
					nodeType: node.type
				})
			);
		}

		return plan;
	}
}

export class SyncPlanOptimizer {
	optimize(plan: SyncPlan): SyncPlan {
		const optimized = new SyncPlan();
		const deleteActions = plan.actions.filter(
			(action): action is SyncActionDelete => action instanceof SyncActionDelete
		);
		const otherActions = plan.actions.filter(
			(action): action is Exclude<SyncAction, SyncActionDelete> =>
				!(action instanceof SyncActionDelete)
		);

		for (const action of otherActions) {
			optimized.addAction(action);
		}

		// Deleting a folder will implicitly delete all of its contents,
		// so we can skip delete actions for any nodes that are descendants of a deleted folder.
		const folderDeletePaths = deleteActions.flatMap((action) =>
			action.args.nodeType === 'folder' && action.args.path ? [action.args.path] : []
		);
		const optimizedDeletes = deleteActions
			.filter(
				(action) =>
					!(
						action.args.path &&
						folderDeletePaths.some((folderPath) => isDescendantPath(action.args.path!, folderPath))
					)
			)
			.sort((left, right) => getPathDepth(right.args.path) - getPathDepth(left.args.path));

		for (const action of optimizedDeletes) {
			optimized.addAction(action);
		}

		return optimized;
	}
}

/**
 * Return the number of path segments for a delete target.
 * Deeper paths should be deleted first.
 * @param path Path associated with the delete action.
 * @returns Number of segments in the path.
 */
function getPathDepth(path?: Path): number {
	return path?.getSegments().length ?? 0;
}

/**
 * Check whether a path is nested beneath another path.
 * @param path Candidate descendant path.
 * @param ancestor Candidate ancestor path.
 * @returns True when path is a strict descendant of ancestor.
 */
function isDescendantPath(path: Path, ancestor: Path): boolean {
	const pathSegments = path.getSegments();
	const ancestorSegments = ancestor.getSegments();
	if (pathSegments.length <= ancestorSegments.length) {
		return false;
	}

	return ancestorSegments.every((segment, index) => pathSegments[index] === segment);
}
