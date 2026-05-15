import { Path } from '$lib/util/path';
import { normalizeUrl } from '$lib/util/string';
import { BookmarkIsNotAFolderError } from './errors';

export abstract class TreeNode {
	readonly id: string;
	readonly title: string;
	readonly url: string | null;
	readonly type: 'folder' | 'bookmark';
	protected readonly raw: unknown;
	protected parent: TreeNode | null;
	private readonly childNodes?: TreeNode[];
	private descendantCountCache: number | null = null;

	constructor(args: {
		id: string;
		title: string;
		url: string | null;
		type: 'folder' | 'bookmark';
		raw: unknown;
		parent?: TreeNode | null;
	}) {
		this.id = args.id;
		this.title = args.title;
		this.url = args.url;
		this.type = args.type;
		this.raw = args.raw;
		this.parent = null;
		this.childNodes = this.isFolder() ? [] : undefined;
		if (args.parent) {
			args.parent.addChild(this);
		}
	}

	get children(): readonly TreeNode[] | undefined {
		return this.childNodes;
	}

	/**
	 * Check if the node is the root node
	 * @returns true if the node is the root node, false otherwise
	 */
	isRoot(): boolean {
		return this.parent === null;
	}

	/**
	 * Check if the node is a folder
	 * @returns true if the node is a folder, false otherwise
	 */
	isFolder(): boolean {
		return this.type === 'folder';
	}

	/**
	 * Get the path of the node by traversing up to the root
	 * @returns the path of the node
	 */
	getPath(): Path {
		const segments: string[] = [];
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let currentNode: TreeNode | null = this;
		while (currentNode) {
			segments.unshift(currentNode.title);
			currentNode = currentNode.parent;
		}
		return new Path({ segments });
	}

	/**
	 * Get a hash string representing the node's identity and content for synchronization purposes.
	 * @returns a hash string that uniquely identifies the node and its content
	 */
	abstract getHash(): string;

	/**
	 * Add a child node to this node. Only valid if this node is a folder.
	 * @param child The child node to add
	 */
	addChild(child: TreeNode): void {
		if (this.type !== 'folder') {
			throw new BookmarkIsNotAFolderError(this.id);
		}
		this.childNodes!.push(child);
		child.parent = this;
		this.invalidateDescendantCountCache();
	}

	/**
	 * Remove all child nodes from this folder.
	 */
	clearChildren(): void {
		if (this.type !== 'folder') {
			throw new BookmarkIsNotAFolderError(this.id);
		}
		if (!this.childNodes?.length) {
			return;
		}
		for (const child of this.childNodes) {
			child.parent = null;
		}
		this.childNodes.splice(0, this.childNodes.length);
		this.invalidateDescendantCountCache();
	}

	/**
	 * Count all descendant bookmark nodes below this node.
	 * @returns Number of descendants, excluding this node itself.
	 */
	countDescendants(): number {
		if (this.descendantCountCache !== null) {
			return this.descendantCountCache;
		}

		const children = this.childNodes;
		if (!children?.length) {
			this.descendantCountCache = 0;
		} else {
			let count = 0;
			for (const child of children) {
				if (child.type === 'bookmark') {
					count += 1;
				}
				count += child.countDescendants();
			}
			this.descendantCountCache = count;
		}

		return this.descendantCountCache;
	}

	private invalidateDescendantCountCache(): void {
		if (this.descendantCountCache === null) {
			return;
		}
		this.descendantCountCache = null;
		this.parent?.invalidateDescendantCountCache();
	}

	/**
	 * Depth-first traversal of the tree, applying the callback to each node.
	 * @param callback The function to apply to each node. If the callback returns a truthy value, the traversal will stop.
	 */
	dfs(callback: (node: TreeNode) => any): void {
		// If the callback returns a truthy value, stop the traversal
		const stop = callback(this);
		if (stop) {
			return;
		}

		// Recursively traverse children if it's a folder
		if (this.type === 'folder' && this.children) {
			for (const child of this.children) {
				child.dfs(callback);
			}
		}
	}

	/**
	 * Breadth-first traversal of the tree, applying the callback to each node.
	 * @param callback The function to apply to each node. If the callback returns a truthy value, the traversal will stop.
	 */
	bfs(callback: (node: TreeNode) => any): void {
		const queue: TreeNode[] = [this];
		let head = 0;
		while (head < queue.length) {
			// Dequeue the next node to visit using indexing to avoid the overhead of Array.shift()
			// which can be O(n) due to re-indexing the array on each call
			const currentNode = queue[head];
			head += 1;

			// Apply the callback to the current node. If it returns a truthy value, stop the traversal.
			const stop = callback(currentNode);
			if (stop) {
				return;
			}

			// Enqueue children if it's a folder
			if (currentNode.type === 'folder' && currentNode.children) {
				queue.push(...currentNode.children);
			}
		}
	}
}

/**
 * Provider-neutral tree node used while diffing and reshaping trees.
 * It drops provider-specific raw data so subtrees can be cloned and re-parented
 * without mutating the original source or target trees.
 */
export class NeutralTreeNode extends TreeNode {
	getHash(): string {
		if (this.isFolder()) {
			return this.getPath().toString();
		}
		return this.getPath().toString() + '|' + normalizeUrl(this.url || '');
	}

	/**
	 * Deep-clone a tree into neutral nodes.
	 * @param node Root of the tree to clone.
	 * @returns Cloned tree detached from provider-specific raw data.
	 */
	static cloneFrom(node: TreeNode): NeutralTreeNode {
		const root = new NeutralTreeNode({
			id: node.id,
			parent: null, // Parent will be set when building the tree (.addChild())
			title: node.title,
			url: node.url,
			type: node.type,
			raw: null
		});

		// Recursively clone children if it's a folder
		for (const child of node.children ?? []) {
			root.addChild(NeutralTreeNode.cloneFrom(child));
		}

		return root;
	}
}
