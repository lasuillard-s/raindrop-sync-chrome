import { TestTreeNode } from '@test-helpers/tree';
import { describe, expect, it } from 'vitest';
import { SyncDiffAnalyzer } from '~/lib/sync';

describe('SyncDiffAnalyzer', () => {
	it('categorizes only-in-left, changed, unchanged, and only-in-right nodes', () => {
		const leftRoot = new TestTreeNode({ id: 'left-root', title: '', type: 'folder' });
		const rightRoot = new TestTreeNode({ id: 'right-root', title: '', type: 'folder' });

		new TestTreeNode({
			id: 'left-only',
			title: 'left-only',
			type: 'bookmark',
			url: 'https://left-only.example',
			parent: leftRoot
		});

		new TestTreeNode({
			id: 'left-updated',
			title: 'updated',
			type: 'bookmark',
			url: 'https://left-updated.example',
			parent: leftRoot
		});
		new TestTreeNode({
			id: 'right-updated',
			title: 'updated',
			type: 'bookmark',
			url: 'https://right-updated.example',
			parent: rightRoot
		});

		new TestTreeNode({
			id: 'left-stable',
			title: 'stable',
			type: 'bookmark',
			url: 'https://stable.example',
			parent: leftRoot
		});
		new TestTreeNode({
			id: 'right-stable',
			title: 'stable',
			type: 'bookmark',
			url: 'https://stable.example',
			parent: rightRoot
		});

		new TestTreeNode({
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
