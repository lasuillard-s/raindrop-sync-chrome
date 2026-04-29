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
	compare(source: TreeNode, target: TreeNode): SyncDiff {
		const diff = new SyncDiff(source, target);
		const sourceMap = toPathMap(source);
		const targetMap = toPathMap(target);
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
 * @returns Map where keys are node paths and values are the corresponding nodes
 */
function toPathMap(tree: TreeNode): Map<string, TreeNode> {
	const pathMap = new Map<string, TreeNode>();
	tree.dfs((node) => {
		pathMap.set(node.getPath().toString(), node);
	});
	return pathMap;
}
