import { SyncDiffAnalyzer } from '$lib/sync';
import { TestTreeNode } from '$test-helpers/tree';
import { describe, expect, it } from 'vitest';

describe('SyncDiffAnalyzer', () => {
	it('categorizes only-in-left, changed, unchanged, and only-in-right nodes', () => {
		// Left tree structure (path):
		// - left-root (/)
		//   - left-only (/left-only)
		//   - left-updated (/updated)
		//   - left-stable (/stable)
		//
		const leftRoot = new TestTreeNode({ id: 'left-root', title: '', type: 'folder' });

		// Right tree structure:
		// - right-root (/)
		//   - right-only (/right-only)
		//   - right-updated (/updated)
		//   - right-stable (/stable)
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

	it('first-one-wins when duplicate node paths are present in one tree', () => {
		const leftRoot = new TestTreeNode({ id: 'left-root', title: '', type: 'folder' });
		const rightRoot = new TestTreeNode({ id: 'right-root', title: '', type: 'folder' });

		new TestTreeNode({
			id: 'duplicate-a',
			title: 'duplicate',
			type: 'bookmark',
			url: 'https://first.example',
			parent: leftRoot
		});
		new TestTreeNode({
			id: 'duplicate-b',
			title: 'duplicate',
			type: 'bookmark',
			url: 'https://second.example',
			parent: leftRoot
		});

		const diff = new SyncDiffAnalyzer().compare(leftRoot, rightRoot);
		expect(diff.onlyInLeft.map((n) => ({ title: n.title, url: n.url }))).toEqual([
			{ title: 'duplicate', url: 'https://first.example' }
		]);
	});
});
