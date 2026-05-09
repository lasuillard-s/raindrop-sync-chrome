import { DuplicateBookmarkError } from './errors';
import type { TreeNode } from './tree';

export class SyncDiff {
	left: TreeNode;
	right: TreeNode;
	onlyInLeft: TreeNode[] = [];
	inBothButDifferent: Array<{ left: TreeNode; right: TreeNode }> = [];
	unchanged: Array<{ left: TreeNode; right: TreeNode }> = [];
	onlyInRight: TreeNode[] = [];

	constructor(left: TreeNode, right: TreeNode) {
		this.left = left;
		this.right = right;
		this.onlyInLeft = [];
		this.inBothButDifferent = [];
		this.unchanged = [];
		this.onlyInRight = [];
	}
}

export class SyncDiffAnalyzer {
	compare(
		source: TreeNode,
		target: TreeNode,
		options: { conflict: 'throw' | 'ignore' } = { conflict: 'throw' }
	): SyncDiff {
		const diff = new SyncDiff(source, target);
		const sourceMap = toPathMap(source, options);
		const targetMap = toPathMap(target, options);
		for (const [path, sourceNode] of sourceMap.entries()) {
			const targetNode = targetMap.get(path);

			// New node in source that doesn't exist in target
			if (!targetNode) {
				console.debug(`Node with path "${path}" only in source:`, sourceNode);
				diff.onlyInLeft.push(sourceNode);
				continue;
			}

			// Node exists in both, check if content or path has changed
			const isContentChanged = sourceNode.getHash() !== targetNode.getHash();
			const isMoved = sourceNode.getPath().toString() !== targetNode.getPath().toString();
			if (isContentChanged || isMoved) {
				console.debug(`Node with path "${path}" changed:`, { sourceNode, targetNode });
				diff.inBothButDifferent.push({ left: sourceNode, right: targetNode });
			} else {
				console.debug(`Node with path "${path}" unchanged:`, sourceNode);
				diff.unchanged.push({ left: sourceNode, right: targetNode });
			}
		}

		// Nodes in target that don't exist in source (deleted in source or new in target)
		for (const [path, targetNode] of targetMap.entries()) {
			if (!sourceMap.has(path)) {
				console.debug(`Node with path "${path}" only in target:`, targetNode);
				diff.onlyInRight.push(targetNode);
			}
		}

		return diff;
	}
}

/**
 * Helper function to create a map of nodes by their path for easy lookup during diffing.
 * @param tree Root node of the tree to create the map from
 * @param options Options for building the path map
 * @param options.conflict Conflict handling strategy for duplicate paths. Defaults to 'throw'.
 * @returns Map where keys are node paths and values are the corresponding nodes
 */
function toPathMap(
	tree: TreeNode,
	options: { conflict: 'throw' | 'ignore' } = { conflict: 'throw' }
): Map<string, TreeNode> {
	const pathMap = new Map<string, TreeNode>();
	tree.dfs((node) => {
		const path = node.getPath().toString();
		if (!pathMap.has(path)) {
			pathMap.set(path, node);
			return;
		}

		// Handle duplicate paths according to the specified conflict strategy
		switch (options.conflict) {
			case 'throw':
				throw new DuplicateBookmarkError(`Duplicate node path detected during diffing: ${path}`);
			case 'ignore':
				// * First one wins
				return;
		}
	});
	return pathMap;
}
