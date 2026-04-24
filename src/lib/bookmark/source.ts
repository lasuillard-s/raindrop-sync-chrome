import { NodeData, TreeNode } from '~/lib/sync/tree';

export interface TreeSourceAdapter<D extends NodeData> {
	loadNodes(): Promise<D[]>;
	postProcess?(nodes: D[]): D[];
}

export interface BuildTreeFromSourceOptions {
	baseNodeId?: string;
	unwrapRoot?: boolean;
	missingBaseMessage?: string;
}

/**
 * Build a tree from a source adapter that provides flattened NodeData items.
 * @param adapter Source adapter for loading and optional post-processing of tree nodes.
 * @param options Build options for root unwrapping and base-node selection.
 * @returns Built tree root node.
 */
export async function buildTreeFromSource<D extends NodeData>(
	adapter: TreeSourceAdapter<D>,
	options?: BuildTreeFromSourceOptions
): Promise<TreeNode<D>> {
	let nodes = await adapter.loadNodes();
	if (adapter.postProcess) {
		nodes = adapter.postProcess(nodes);
	}

	const rootWrapper = TreeNode.createTree(null, nodes);
	const unwrapRoot = options?.unwrapRoot ?? true;
	const defaultRoot = unwrapRoot ? (rootWrapper.children[0] ?? rootWrapper) : rootWrapper;

	if (!options?.baseNodeId) {
		return defaultRoot;
	}

	let baseNode: TreeNode<D> | undefined;
	rootWrapper.dfs((node) => {
		if (node.getId() === options.baseNodeId && !baseNode) {
			baseNode = node;
		}
	});

	if (!baseNode) {
		throw new Error(
			options.missingBaseMessage ||
				`Failed to locate the base node (${options.baseNodeId}) in the created tree`
		);
	}

	return baseNode;
}
