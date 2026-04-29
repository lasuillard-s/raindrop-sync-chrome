import { describe, expect, it } from 'vitest';
import {
	SyncActionCreateBookmark,
	SyncActionDelete,
	SyncActionUpdateBookmark,
	SyncDiff,
	SyncPlanner,
	TreeNode
} from '~/lib/sync';

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

describe('SyncPlanner', () => {
	it('generates create, update, and delete actions from a diff', () => {
		const leftRoot = createNode({ id: 'left-root', title: '', type: 'folder' });
		const rightRoot = createNode({ id: 'right-root', title: '', type: 'folder' });
		const leftFolder = createNode({
			id: 'left-folder',
			title: 'Collection',
			type: 'folder',
			parent: leftRoot
		});
		const rightFolder = createNode({
			id: 'right-folder',
			title: 'Collection',
			type: 'folder',
			parent: rightRoot
		});

		const added = createNode({
			id: 'added-left',
			title: 'Added bookmark',
			type: 'bookmark',
			url: 'https://added.example',
			parent: leftFolder
		});
		const updatedLeft = createNode({
			id: 'updated-left',
			title: 'Updated bookmark',
			type: 'bookmark',
			url: 'https://updated.example',
			parent: leftFolder
		});
		const updatedRight = createNode({
			id: 'updated-right',
			title: 'Updated bookmark',
			type: 'bookmark',
			url: 'https://old.example',
			parent: rightFolder
		});
		const removed = createNode({
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
