import type { NodeData, TreeNode } from './tree';

export class SyncDiff<L extends NodeData, R extends NodeData> {
	onlyInLeft: TreeNode<L>[] = [];
	inBothButDifferent: Array<{
		left: TreeNode<L>;
		right: TreeNode<R>;
	}> = [];
	unchanged: Array<{
		left: TreeNode<L>;
		right: TreeNode<R>;
	}> = [];
	onlyInRight: TreeNode<R>[] = [];

	static calculateDiff<L extends NodeData, R extends NodeData>(
		left: TreeNode<L>,
		right: TreeNode<R>
	): SyncDiff<L, R> {
		const diff = new SyncDiff<L, R>();

		// Flatten both trees to maps of their terminal nodes for easier comparison
		const leftMap = left.toMap({ onlyTerminal: true });
		const rightMap = right.toMap({ onlyTerminal: true });

		// Compare left to right
		for (const [path, leftNode] of leftMap.entries()) {
			if (rightMap.has(path)) {
				const rightNode = rightMap.get(path)!;

				// ? Update below condition for more complex comparison logic if needed
				if (leftNode.data?.getHash() == rightNode.data?.getHash()) {
					diff.unchanged.push({ left: leftNode, right: rightNode });
				} else {
					diff.inBothButDifferent.push({ left: leftNode, right: rightNode });
				}

				// ... this makes easy to find nodes only in right later
				rightMap.delete(path);
			} else {
				diff.onlyInLeft.push(leftNode);
			}
		}

		// Any remaining nodes in rightMap are only in right
		for (const rightNode of rightMap.values()) {
			diff.onlyInRight.push(rightNode);
		}

		return diff;
	}
}
