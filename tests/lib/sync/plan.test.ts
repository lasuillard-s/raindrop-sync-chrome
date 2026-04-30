import { TestTreeNode } from '@test-helpers/tree';
import { describe, expect, it } from 'vitest';
import {
	SyncActionCreateBookmark,
	SyncActionDelete,
	SyncActionUpdateBookmark,
	SyncDiff,
	SyncPlanner
} from '~/lib/sync';

describe('SyncPlanner', () => {
	it('generates create, update, and delete actions from a diff', () => {
		const leftRoot = new TestTreeNode({ id: 'left-root', title: '', type: 'folder' });
		const rightRoot = new TestTreeNode({ id: 'right-root', title: '', type: 'folder' });
		const leftFolder = new TestTreeNode({
			id: 'left-folder',
			title: 'Collection',
			type: 'folder',
			parent: leftRoot
		});
		const rightFolder = new TestTreeNode({
			id: 'right-folder',
			title: 'Collection',
			type: 'folder',
			parent: rightRoot
		});

		const added = new TestTreeNode({
			id: 'added-left',
			title: 'Added bookmark',
			type: 'bookmark',
			url: 'https://added.example',
			parent: leftFolder
		});
		const updatedLeft = new TestTreeNode({
			id: 'updated-left',
			title: 'Updated bookmark',
			type: 'bookmark',
			url: 'https://updated.example',
			parent: leftFolder
		});
		const updatedRight = new TestTreeNode({
			id: 'updated-right',
			title: 'Updated bookmark',
			type: 'bookmark',
			url: 'https://old.example',
			parent: rightFolder
		});
		const removed = new TestTreeNode({
			id: 'removed-right',
			title: 'Removed bookmark',
			type: 'bookmark',
			url: 'https://removed.example',
			parent: rightFolder
		});

		const diff = new SyncDiff(leftRoot, rightRoot);
		diff.onlyInLeft.push(added);
		diff.inBothButDifferent.push({ left: updatedLeft, right: updatedRight });
		diff.onlyInRight.push(removed);

		const plan = new SyncPlanner().generatePlan(diff);

		expect(plan.actions).toHaveLength(3);
		expect(plan.actions[0]).toBeInstanceOf(SyncActionCreateBookmark);
		expect((plan.actions[0] as SyncActionCreateBookmark).args).toMatchObject({
			path: added.getPath(),
			url: 'https://added.example'
		});
		expect(plan.actions[1]).toBeInstanceOf(SyncActionUpdateBookmark);
		expect((plan.actions[1] as SyncActionUpdateBookmark).args).toEqual({
			id: 'updated-right',
			title: 'Updated bookmark',
			url: 'https://updated.example'
		});
		expect(plan.actions[2]).toBeInstanceOf(SyncActionDelete);
		expect((plan.actions[2] as SyncActionDelete).args).toEqual({ id: 'removed-right' });
	});
});
