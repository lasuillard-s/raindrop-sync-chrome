import type { SyncAction } from './action';
import type { TreeNode } from './tree';

export abstract class ReadableAdapter<T extends TreeNode = TreeNode> {
	/**
	 * Resolves the base node ID to fetch. If `baseNodeId` is not provided, should return the default root node ID for the data source.
	 * @param baseNodeId The base node ID to resolve.
	 */
	protected abstract resolveBaseNodeId(baseNodeId?: string): string;

	/**
	 * Fetches nodes from the data source. If `baseNodeId` is provided, only fetches the subtree at that node.
	 */
	protected abstract fetchNodes(baseNodeId: string): Promise<T[]>;

	/**
	 * Builds a tree structure from the flat list of nodes. The `baseNodeId` is provided to identify the root of the subtree being built.
	 */
	protected abstract buildTree(nodes: T[], baseNodeId: string): T;

	/**
	 * Fetches the tree structure from the data source. If `baseNodeId` is provided, fetches the subtree at that node; otherwise, fetches the entire tree.
	 * @param baseNodeId The base node ID to fetch the tree from.
	 * @returns The root node of the fetched tree.
	 */
	async getTree(baseNodeId?: string): Promise<T> {
		const resolvedBaseNodeId = this.resolveBaseNodeId(baseNodeId);
		const nodes = await this.fetchNodes(resolvedBaseNodeId);
		console.debug(`Fetched ${nodes.length} nodes`);
		return this.buildTree(nodes, resolvedBaseNodeId);
	}

	/**
	 * Checks if there have been changes in the data source since the given timestamp.
	 * @param date The date to check changes against.
	 * @param options Additional options for checking changes, such as a threshold for considering changes.
	 * @param options.thresholdSeconds A time threshold in seconds. Changes that occurred within this threshold may be ignored, depending on the implementation.
	 * @returns A boolean indicating whether there have been changes since the given date.
	 */
	abstract changedSince(date: Date, options?: { thresholdSeconds: number }): Promise<boolean>;
}

export abstract class WritableAdapter<T extends TreeNode = TreeNode> extends ReadableAdapter<T> {
	/**
	 * Checks if a folder with the given ID exists in the tree.
	 * @param id The ID of the folder to check for.
	 */
	abstract hasFolderWithId(id: string): Promise<boolean>;

	/**
	 * Applies a synchronization action to the data source.
	 * @param action The synchronization action to apply.
	 */
	abstract applyAction(action: SyncAction): Promise<void>;
}
