import { describe, expect, it, vi } from 'vitest';
import {
	SyncActionCreateBookmark,
	SyncActionDelete,
	SyncActionUpdateBookmark,
	SyncExecutor,
	SyncPlan,
	WritableAdapter,
	type SyncAction,
	type TreeNode
} from '~/lib/sync';
import { Path } from '~/lib/util/path';

class RecordingWritableAdapter extends WritableAdapter {
	readonly applied: SyncAction[] = [];
	readonly shouldFailAt: number | null;

	constructor(shouldFailAt: number | null = null) {
		super();
		this.shouldFailAt = shouldFailAt;
	}

	protected resolveBaseNodeId(baseNodeId?: string): string {
		return baseNodeId ?? 'root';
	}

	protected async fetchNodes(): Promise<TreeNode[]> {
		return [];
	}

	protected buildTree(): TreeNode {
		throw new Error('not used in this test');
	}

	async applyAction(action: SyncAction): Promise<void> {
		this.applied.push(action);
		if (this.shouldFailAt !== null && this.applied.length === this.shouldFailAt) {
			throw new Error(`boom-${this.applied.length}`);
		}
	}
}

describe('SyncExecutor', () => {
	it('applies actions and returns aggregate report', async () => {
		const plan = new SyncPlan();
		plan.addAction(
			new SyncActionCreateBookmark({
				path: new Path({ pathString: '/Synced/Created' }),
				url: 'https://created.example'
			})
		);
		plan.addAction(
			new SyncActionUpdateBookmark({
				id: 'updated-id',
				title: 'Updated',
				url: 'https://updated.example'
			})
		);
		plan.addAction(new SyncActionDelete({ id: 'deleted-id' }));

		const target = new RecordingWritableAdapter();
		const report = await new SyncExecutor().execute(plan, target);

		expect(target.applied).toHaveLength(3);
		expect(report.created).toBe(1);
		expect(report.updated).toBe(1);
		expect(report.deleted).toBe(1);
		expect(report.errors).toEqual([]);
	});

	it('continues execution and captures errors when applying action fails', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const plan = new SyncPlan();
		plan.addAction(
			new SyncActionCreateBookmark({
				path: new Path({ pathString: '/Synced/First' }),
				url: 'https://first.example'
			})
		);
		plan.addAction(
			new SyncActionUpdateBookmark({
				id: 'update-id',
				title: 'Updated',
				url: 'https://updated.example'
			})
		);
		plan.addAction(new SyncActionDelete({ id: 'delete-id' }));

		const target = new RecordingWritableAdapter(2);
		const report = await new SyncExecutor().execute(plan, target);

		expect(target.applied).toHaveLength(3);
		expect(report.created).toBe(1);
		expect(report.updated).toBe(0);
		expect(report.deleted).toBe(1);
		expect(report.errors).toHaveLength(1);
		expect(report.errors[0].message).toBe('boom-2');

		errorSpy.mockRestore();
	});
});
