import { Path, PathMap } from '~/lib/util/path';

export class PathConflictError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, PathConflictError.prototype);
		this.name = 'PathConflictError';
	}
}

/** Abstraction for required functionality of raw source data types. */
export abstract class NodeData {
	abstract getId(): string;
	abstract getParentId(): string | null;

	/**
	 * Generate hash based on current node data for comparison with other node data types.
	 *
	 * If two different data type is equal, it should return same hash for equality comparison.
	 * For empty data, it should generate random hash to avoid equality with any other data.
	 */
	abstract getHash(): string;

	abstract getName(): string;
	abstract getUrl(): string | null;
	abstract isFolder(): boolean;
}

/** Callback function for tree traversal. */
export type TraversalCallback<T> = (node: T) => void;

/** Represents a node in a tree structure. */
export class TreeNode<D extends NodeData> {
	data: D | null; // Allow null for empty root nodes used for logical grouping

	// Need this reverse reference for full path resolution
	parent: TreeNode<D> | null; // null if root

	children: TreeNode<D>[] = [];

	constructor(args: { data: D | null; parent?: TreeNode<D> }) {
		this.data = args.data;
		this.parent = args.parent ?? null;
	}

	// This tree creation algorithm would be very inefficient for large data sets,
	// but do it this way for simplicity for now.
	private static _createTree<D extends NodeData>(
		parent: TreeNode<D>,
		parentId: string | null,
		parentToChildren: Map<string | null, D[]>
	) {
		const children = parentToChildren.get(parentId) ?? [];
		parentToChildren.delete(parentId); // Prevent re-processing
		for (const child of children) {
			const childNode = new TreeNode<D>({ data: child, parent: parent });
			this._createTree(childNode, child.getId(), parentToChildren);
			parent.addChild(childNode);
		}
	}

	/**
	 * Create a tree from a flat list of data
	 * @param data Data for the root node
	 * @param dataList Flat list of data to create the tree from
	 * @returns Root node of the tree
	 */
	static createTree<D extends NodeData>(data: D | null, dataList: D[]): TreeNode<D> {
		const rootNode = new TreeNode<D>({ data });

		// Create map of parent ID to children for efficient searching
		// (#165) It would preserve the ordering of original data list, but it's quite implicit behavior
		//        If possible, should refactor this to function explicitly
		const parentToChildren = new Map<string | null, D[]>();
		for (const item of dataList) {
			const parentId = item.getParentId();
			if (!parentToChildren.has(parentId)) {
				parentToChildren.set(parentId, []);
			}
			parentToChildren.get(parentId)!.push(item);
		}
		this._createTree(rootNode, null, parentToChildren);

		// Warn about unprocessed nodes
		if (parentToChildren.size > 0) {
			console.warn(
				`Some nodes were not attached to the tree because their parent IDs were not found: ${Array.from(
					parentToChildren.keys()
				).join(', ')}`
			);
		}

		return rootNode;
	}

	getId(): string {
		return this.data?.getId() ?? Math.random().toString();
	}

	getName(): string | null {
		if (this.isRoot()) {
			return '/';
		}
		return this.data?.getName() ?? null;
	}

	getUrl(): string | null {
		return this.data?.getUrl() ?? null;
	}

	getFullPathSegments(relativeTo?: TreeNode<D>): string[] {
		const segments: string[] = [];

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let currentNode: TreeNode<D> | null = this;

		while (currentNode && !currentNode.isRoot() && currentNode !== relativeTo) {
			segments.unshift(currentNode.getName() || '');
			currentNode = currentNode.parent;
		}

		return segments;
	}

	getFullPath(relativeTo?: TreeNode<D>): Path {
		const segments = this.getFullPathSegments(relativeTo);
		return new Path({ segments });
	}

	isRoot(): boolean {
		return this.parent === null;
	}

	isFolder(): boolean {
		return this.data?.isFolder() || this.isRoot();
	}

	isTerminal(): boolean {
		return !this.isFolder() && this.children.length === 0;
	}

	addChild(child: TreeNode<D>) {
		child.parent = this;
		this.children.push(child);
	}

	removeChild(child: TreeNode<D>) {
		child.parent = null;
		this.children = this.children.filter((c) => c !== child);
	}

	/**
	 * Depth-first traversal of the tree.
	 * @param callback Callback function to execute on each node
	 */
	dfs(callback: TraversalCallback<TreeNode<D>>) {
		callback(this);
		for (const child of this.children) {
			child.dfs(callback);
		}
	}

	/**
	 * Convert the tree to a map of its children to their path.
	 * @param opts Options
	 * @param opts.onlyTerminal If true, only include terminal nodes in the map
	 * @param opts.relativeTo If provided, paths will be relative to this node
	 * @returns Map where keys are paths and values are Tree nodes
	 */
	toMap(opts?: { onlyTerminal?: boolean; relativeTo?: TreeNode<D> }): PathMap<TreeNode<D>> {
		const onlyTerminal = opts?.onlyTerminal ?? false;
		const map = new PathMap<TreeNode<D>>();
		this.dfs((node) => {
			const key = node.getFullPath(opts?.relativeTo);
			if (map.has(key)) {
				throw new PathConflictError(`Conflicting node found in tree map: ${key}`);
			}
			if (!onlyTerminal || (onlyTerminal && node.isTerminal())) {
				map.set(key, node);
			}
		});
		return map;
	}
}
