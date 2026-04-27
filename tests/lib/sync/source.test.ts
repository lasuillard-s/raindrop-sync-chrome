import { describe, expect, it } from 'vitest';
import { buildTreeFromSource, TreeBuilder, type TreeSourceAdapter } from '~/lib/sync/source';
import { NodeData, TreeNode } from '~/lib/sync/tree';

class TestNodeData extends NodeData {
	private readonly id: string;
	private readonly parentId: string | null;
	private readonly name: string;
	private readonly url: string | null;

	constructor(args: { id: string; parentId: string | null; name: string; url?: string | null }) {
		super();
		this.id = args.id;
		this.parentId = args.parentId;
		this.name = args.name;
		this.url = args.url ?? null;
	}

	getId(): string {
		return this.id;
	}

	getParentId(): string | null {
		return this.parentId;
	}

	getHash(): string {
		return this.id;
	}

	getName(): string {
		return this.name;
	}

	getUrl(): string | null {
		return this.url;
	}

	isFolder(): boolean {
		return this.url === null;
	}
}

const createAdapter = (nodes: TestNodeData[]): TreeSourceAdapter<TestNodeData> => ({
	async loadNodes() {
		return nodes;
	}
});

class RecordingTreeBuilder extends TreeBuilder<TestNodeData[], TestNodeData> {
	readonly stages: string[] = [];
	private readonly nodes: TestNodeData[];

	constructor(nodes: TestNodeData[]) {
		super();
		this.nodes = nodes;
	}

	protected async fetchSources(): Promise<TestNodeData[]> {
		this.stages.push('fetch');
		return this.nodes;
	}

	protected preprocess(sources: TestNodeData[]): TestNodeData[] {
		this.stages.push('preprocess');
		return sources;
	}

	protected override buildTree(nodes: TestNodeData[]): TreeNode<TestNodeData> {
		this.stages.push('build');
		return super.buildTree(nodes);
	}

	protected override postprocess(
		tree: TreeNode<TestNodeData>,
		options: Readonly<{ unwrapRoot: boolean; baseNodeId?: string; missingBaseMessage?: string }>
	): TreeNode<TestNodeData> {
		this.stages.push('postprocess');
		return super.postprocess(tree, options);
	}
}

describe('buildTreeFromSource', () => {
	it('runs pipeline stages in order', async () => {
		const nodes = [new TestNodeData({ id: 'folder', parentId: null, name: 'Folder' })];
		const builder = new RecordingTreeBuilder(nodes);

		await builder.build();

		expect(builder.stages).toEqual(['fetch', 'preprocess', 'build', 'postprocess']);
	});

	it('returns inner root when unwrapRoot is true (default)', async () => {
		const nodes = [
			new TestNodeData({ id: 'folder', parentId: null, name: 'Folder' }),
			new TestNodeData({
				id: 'bookmark',
				parentId: 'folder',
				name: 'Bookmark',
				url: 'https://example.com'
			})
		];

		const root = await buildTreeFromSource(createAdapter(nodes));

		expect(root.getId()).toBe('folder');
		expect(root.children).toHaveLength(1);
		expect(root.children[0].getId()).toBe('bookmark');
	});

	it('returns wrapper root when unwrapRoot is false', async () => {
		const nodes = [new TestNodeData({ id: 'folder', parentId: null, name: 'Folder' })];

		const root = await buildTreeFromSource(createAdapter(nodes), { unwrapRoot: false });

		expect(root.isRoot()).toBe(true);
		expect(root.children).toHaveLength(1);
		expect(root.children[0].getId()).toBe('folder');
	});

	it('returns requested base node when baseNodeId is provided', async () => {
		const nodes = [
			new TestNodeData({ id: 'folder', parentId: null, name: 'Folder' }),
			new TestNodeData({
				id: 'bookmark',
				parentId: 'folder',
				name: 'Bookmark',
				url: 'https://example.com'
			})
		];

		const base = await buildTreeFromSource(createAdapter(nodes), { baseNodeId: 'bookmark' });

		expect(base.getId()).toBe('bookmark');
		expect(base.children).toHaveLength(0);
	});

	it('applies postProcess hook before tree creation', async () => {
		const duplicateA = new TestNodeData({ id: 'duplicate', parentId: null, name: 'Duplicate A' });
		const duplicateB = new TestNodeData({ id: 'duplicate', parentId: null, name: 'Duplicate B' });

		const adapter: TreeSourceAdapter<TestNodeData> = {
			async loadNodes() {
				return [duplicateA, duplicateB];
			},
			postProcess(items) {
				return items.filter((item, index, self) => {
					return index === self.findIndex((other) => other.getId() === item.getId());
				});
			}
		};

		const root = await buildTreeFromSource(adapter, { unwrapRoot: false });

		expect(root.children).toHaveLength(1);
		expect(root.children[0].getName()).toBe('Duplicate A');
	});

	it('throws custom message when base node cannot be found', async () => {
		const nodes = [new TestNodeData({ id: 'folder', parentId: null, name: 'Folder' })];

		await expect(
			buildTreeFromSource(createAdapter(nodes), {
				baseNodeId: 'missing',
				missingBaseMessage: 'Expected base was not found'
			})
		).rejects.toThrowError('Expected base was not found');
	});
});
