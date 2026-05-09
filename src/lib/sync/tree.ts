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
	readonly children?: TreeNode[];

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
		this.children = this.isFolder() ? [] : undefined;
		if (args.parent) {
			args.parent.addChild(this);
		}
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
		this.children!.push(child);
		child.parent = this;
	}

	/**
	 * Depth-first traversal of the tree, applying the callback to each node.
	 * @param callback The function to apply to each node. If the callback returns a truthy value, the traversal will stop.
	 */
	dfs(callback: (node: TreeNode) => any): void {
		const stop = callback(this);
		if (stop) {
			return;
		}
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
		while (queue.length > 0) {
			const currentNode = queue.shift()!;
			const stop = callback(currentNode);
			if (stop) {
				return;
			}
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
