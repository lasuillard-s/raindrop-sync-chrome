import { ReadableAdapter } from '@lib/sync';
import { TestTreeNode } from '@test-helpers/tree';
import { describe, expect, it } from 'vitest';

class RecordingAdapter extends ReadableAdapter<TestTreeNode> {
	readonly calls: string[] = [];

	protected resolveBaseNodeId(baseNodeId?: string): string {
		this.calls.push(`resolve:${baseNodeId ?? 'undefined'}`);
		return baseNodeId ?? 'default-root';
	}

	protected async fetchNodes(baseNodeId: string): Promise<TestTreeNode[]> {
		this.calls.push(`fetch:${baseNodeId}`);
		return [
			new TestTreeNode({
				id: baseNodeId,
				title: '',
				url: null,
				type: 'folder'
			})
		];
	}

	protected buildTree(nodes: TestTreeNode[], baseNodeId: string): TestTreeNode {
		this.calls.push(`build:${baseNodeId}:${nodes.length}`);
		return nodes[0];
	}

	async changedSince(): Promise<boolean> {
		return false;
	}
}

describe('ReadableAdapter', () => {
	it('runs resolve, fetch, and build in sequence', async () => {
		const adapter = new RecordingAdapter();

		const root = await adapter.getTree('base-id');

		expect(root.id).toBe('base-id');
		expect(adapter.calls).toEqual(['resolve:base-id', 'fetch:base-id', 'build:base-id:1']);
	});

	it('uses resolved default base id when not provided', async () => {
		const adapter = new RecordingAdapter();

		const root = await adapter.getTree();

		expect(root.id).toBe('default-root');
		expect(adapter.calls).toEqual([
			'resolve:undefined',
			'fetch:default-root',
			'build:default-root:1'
		]);
	});
});
