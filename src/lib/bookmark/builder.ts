import { NodeData, TreeNode } from './tree';

export interface TreeBuildOptions {
	baseNodeId?: string;
	unwrapRoot?: boolean;
	missingBaseMessage?: string;
}

type ResolvedTreeBuildOptions = Readonly<
	Required<Pick<TreeBuildOptions, 'unwrapRoot'>> & TreeBuildOptions
>;

/**
 * Generic orchestration pipeline for building trees from source data.
 */
export abstract class TreeBuilder<S, D extends NodeData> {
	/**
	 * Fetch raw source data required for tree construction.
	 */
	protected abstract fetchSources(): Promise<S>;

	/**
	 * Normalize raw sources into flat tree node data.
	 */
	protected abstract preprocess(sources: S): Promise<D[]> | D[];

	/**
	 * Build a tree structure from normalized node data.
	 * @param nodes Flat node data produced by preprocessing.
	 * @returns Built tree rooted at a logical wrapper node.
	 */
	protected buildTree(nodes: D[]): TreeNode<D> {
		return TreeNode.createTree(null, nodes);
	}

	/**
	 * Post-process the built tree before returning it to callers.
	 * @param tree Built tree rooted at a logical wrapper node.
	 * @param options Resolved build options after applying defaults.
	 * @returns Final tree result returned to the caller.
	 */
	protected postprocess(tree: TreeNode<D>, options: ResolvedTreeBuildOptions): TreeNode<D> {
		const defaultRoot = options.unwrapRoot ? (tree.children[0] ?? tree) : tree;

		if (!options.baseNodeId) {
			return defaultRoot;
		}

		let baseNode: TreeNode<D> | undefined;
		tree.dfs((node) => {
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

	/**
	 * Override to provide source-specific default build behavior.
	 * @returns Default build options for this builder.
	 */
	protected getDefaultBuildOptions(): Required<Pick<TreeBuildOptions, 'unwrapRoot'>> {
		return { unwrapRoot: true };
	}

	/**
	 * Build the final tree by executing fetch, preprocess, build, and postprocess stages.
	 * @param options Build options for base-node selection and root unwrapping.
	 * @returns Final tree returned by the builder pipeline.
	 */
	async build(options?: TreeBuildOptions): Promise<TreeNode<D>> {
		const sources = await this.fetchSources();
		const nodes = await this.preprocess(sources);
		const tree = this.buildTree(nodes);
		const defaults = this.getDefaultBuildOptions();
		const resolvedOptions: ResolvedTreeBuildOptions = {
			baseNodeId: options?.baseNodeId,
			missingBaseMessage: options?.missingBaseMessage,
			unwrapRoot: options?.unwrapRoot ?? defaults.unwrapRoot
		};
		return this.postprocess(tree, resolvedOptions);
	}
}
