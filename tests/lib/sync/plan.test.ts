import { TestNodeData } from '@test-helpers/tree';
import { describe, expect, it } from 'vitest';
import { TreeNode } from '~/lib/bookmark';
import { SyncDiff, SyncOpAdd, SyncOpDelete, SyncOpNoop, SyncOpUpdate, SyncPlan } from '~/lib/sync';
import { Path } from '~/lib/util/path';

/**
 * Creates a tree node for diff/plan test fixtures.
 * @param args Node fixture fields.
 * @param args.id Node identifier.
 * @param args.name Node display name.
 * @param args.url Optional bookmark URL.
 * @param args.parent Optional parent node; if provided, the created node is attached to it.
 * @param args.parentId Optional explicit parent ID when parent is not passed.
 * @param args.isFolder Whether this node represents a folder.
 * @returns The created tree node.
 */
function createNode(args: {
	id: string;
	name: string;
	url?: string | null;
	parent?: TreeNode<TestNodeData>;
	parentId?: string | null;
	isFolder?: boolean;
}) {
	const node = new TreeNode({
		data: new TestNodeData({
			id: args.id,
			parentId: args.parent ? args.parent.getId() : (args.parentId ?? null),
			name: args.name,
			url: args.url ?? null,
			isFolder: args.isFolder ?? false
		})
	});

	args.parent?.addChild(node);

	return node;
}

describe('SyncPlan', () => {
	it('creates add, update, noop, and delete operations from a diff', () => {
		// Arrange
		const leftRoot = new TreeNode<TestNodeData>({ data: null });
		const rightRoot = new TreeNode<TestNodeData>({ data: null });
		const leftFolder = createNode({
			id: 'left-folder',
			name: 'Collection',
			isFolder: true,
			parent: leftRoot
		});
		const rightFolder = createNode({
			id: 'right-folder',
			name: 'Chrome',
			isFolder: true,
			parent: rightRoot
		});

		const added = createNode({
			id: 'add',
			name: 'Added bookmark',
			url: 'https://added.example',
			parent: leftFolder
		});
		const updatedLeft = createNode({
			id: 'updated-left',
			name: 'Updated bookmark',
			url: 'https://left.example',
			parent: leftFolder
		});
		const updatedRight = createNode({
			id: 'updated-right',
			name: 'Updated bookmark',
			url: 'https://right.example',
			parent: rightFolder
		});
		const unchangedLeft = createNode({
			id: 'unchanged-left',
			name: 'Stable bookmark',
			url: 'https://stable.example',
			parent: leftFolder
		});
		const unchangedRight = createNode({
			id: 'unchanged-right',
			name: 'Stable bookmark',
			url: 'https://stable.example',
			parent: rightFolder
		});
		const removed = createNode({
			id: 'delete',
			name: 'Removed bookmark',
			url: 'https://removed.example',
			parent: rightFolder
		});

		const diff = new SyncDiff(leftRoot, rightRoot);
		diff.onlyInLeft.push(added);
		diff.inBothButDifferent.push({ left: updatedLeft, right: updatedRight });
		diff.unchanged.push({ left: unchangedLeft, right: unchangedRight });
		diff.onlyInRight.push(removed);

		// Act
		const plan = SyncPlan.fromDiff(diff, new Path({ pathString: '/Synced' }));

		// Assert
		expect(plan.operations).toHaveLength(4);

		const [addOp, updateOp, noopOp, deleteOp] = plan.operations;
		expect(addOp).toBeInstanceOf(SyncOpAdd);
		expect((addOp as SyncOpAdd).args).toMatchObject({
			path: new Path({ pathString: '/Synced/Collection/Added bookmark' }),
			title: 'Added bookmark',
			url: 'https://added.example'
		});

		expect(updateOp).toBeInstanceOf(SyncOpUpdate);
		expect((updateOp as SyncOpUpdate).args).toMatchObject({
			path: new Path({ pathString: '/Chrome/Updated bookmark' }),
			title: 'Updated bookmark',
			url: 'https://left.example'
		});

		expect(noopOp).toBeInstanceOf(SyncOpNoop);
		expect((noopOp as SyncOpNoop).args.path.toString()).toBe('/Chrome/Stable bookmark');

		expect(deleteOp).toBeInstanceOf(SyncOpDelete);
		expect((deleteOp as SyncOpDelete).args.path.toString()).toBe('/Chrome/Removed bookmark');
	});

	it('skips additions and updates when left-side bookmark data is incomplete', () => {
		// Arrange
		const leftRoot = new TreeNode<TestNodeData>({ data: null });
		const rightRoot = new TreeNode<TestNodeData>({ data: null });
		const leftFolder = createNode({
			id: 'left-folder',
			name: 'Collection',
			isFolder: true,
			parent: leftRoot
		});
		const rightFolder = createNode({
			id: 'right-folder',
			name: 'Chrome',
			isFolder: true,
			parent: rightRoot
		});

		const missingUrl = createNode({
			id: 'missing-url',
			name: 'Missing URL',
			url: null,
			parent: leftFolder
		});
		const missingName = createNode({
			id: 'missing-name',
			name: '',
			url: 'https://updated.example',
			parent: leftFolder
		});
		const updateTarget = createNode({
			id: 'update-target',
			name: 'Target',
			url: 'https://target.example',
			parent: rightFolder
		});
		const deleted = createNode({
			id: 'deleted',
			name: 'Deleted bookmark',
			url: 'https://deleted.example',
			parent: rightFolder
		});

		const diff = new SyncDiff(leftRoot, rightRoot);
		diff.onlyInLeft.push(missingUrl);
		diff.inBothButDifferent.push({ left: missingName, right: updateTarget });
		diff.onlyInRight.push(deleted);

		// Act
		const plan = SyncPlan.fromDiff(diff, new Path({ pathString: '/Synced' }));

		// Assert
		expect(plan.operations).toHaveLength(1);
		expect(plan.operations[0]).toBeInstanceOf(SyncOpDelete);
		expect((plan.operations[0] as SyncOpDelete).args.path.toString()).toBe(
			'/Chrome/Deleted bookmark'
		);
	});
});
