import { describe, expect, it } from 'vitest';
import { SyncDiffAnalyzer, TreeNode } from '~/lib/sync';

class TestTreeNode extends TreeNode {
	getHash(): string {
		return `${this.title}|${this.url ?? ''}`;
	}
}

const createNode = (args: {
	id: string;
	title: string;
	type: 'folder' | 'bookmark';
	url?: string | null;
	parent?: TestTreeNode;
}) => {
	const node = new TestTreeNode({
		id: args.id,
		parent: args.parent ?? null,
		title: args.title,
		url: args.url ?? null,
		type: args.type,
		raw: null
	});
	args.parent?.addChild(node);
	return node;
};

describe('SyncDiffAnalyzer', () => {
	it('categorizes only-in-left, changed, unchanged, and only-in-right nodes', () => {
		const leftRoot = createNode({ id: 'left-root', title: '', type: 'folder' });
		const rightRoot = createNode({ id: 'right-root', title: '', type: 'folder' });

		createNode({
			id: 'left-only',
			title: 'left-only',
			type: 'bookmark',
			url: 'https://left-only.example',
			parent: leftRoot
		});

		createNode({
			id: 'left-updated',
			title: 'updated',
			type: 'bookmark',
			url: 'https://left-updated.example',
			parent: leftRoot
		});
		createNode({
			id: 'right-updated',
			title: 'updated',
			type: 'bookmark',
			url: 'https://right-updated.example',
			parent: rightRoot
		});

		createNode({
			id: 'left-stable',
			title: 'stable',
			type: 'bookmark',
			url: 'https://stable.example',
			parent: leftRoot
		});
		createNode({
			id: 'right-stable',
			title: 'stable',
			type: 'bookmark',
			url: 'https://stable.example',
			parent: rightRoot
		});

		createNode({
			id: 'right-only',
			title: 'right-only',
			type: 'bookmark',
			url: 'https://right-only.example',
			parent: rightRoot
		});

		const diff = new SyncDiffAnalyzer().compare(leftRoot, rightRoot);

		expect(diff.onlyInLeft.map((n) => n.title)).toEqual(['left-only']);
		expect(diff.inBothButDifferent).toHaveLength(1);
		expect(diff.inBothButDifferent[0].left.title).toBe('updated');
		expect(diff.inBothButDifferent[0].right.title).toBe('updated');
		expect(diff.unchanged.some((pair) => pair.left.title === 'stable')).toBe(true);
		expect(diff.onlyInRight.map((n) => n.title)).toEqual(['right-only']);
	});
});
