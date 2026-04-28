import { type TreeBuildOptions, TreeBuilder } from './builder';
import type { NodeData, TreeNode } from './tree';

export interface TreeSourceAdapter<D extends NodeData> {
	loadNodes(): Promise<D[]>;
	postProcess?(nodes: D[]): D[] | Promise<D[]>;
}

class TreeSourceAdapterBuilder<D extends NodeData> extends TreeBuilder<D[], D> {
	private readonly adapter: TreeSourceAdapter<D>;

	constructor(adapter: TreeSourceAdapter<D>) {
		super();
		this.adapter = adapter;
	}

	protected async fetchSources(): Promise<D[]> {
		return await this.adapter.loadNodes();
	}

	protected async preprocess(nodes: D[]): Promise<D[]> {
		return this.adapter.postProcess ? await this.adapter.postProcess(nodes) : nodes;
	}
}

/**
 * Backward-compatible helper for building a tree from a flat source adapter.
 * @param adapter Source adapter that loads flattened node data.
 * @param options Build options for base-node selection and root unwrapping.
 * @returns Final tree returned by the adapter-backed builder.
 */
export async function buildTreeFromSource<D extends NodeData>(
	adapter: TreeSourceAdapter<D>,
	options?: TreeBuildOptions
): Promise<TreeNode<D>> {
	return await new TreeSourceAdapterBuilder(adapter).build(options);
}
