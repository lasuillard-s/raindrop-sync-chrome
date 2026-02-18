import { NodeData, TreeNode } from '~/lib/sync/tree';
import { normalizeUrl } from '~/lib/util/string';

export class ChromeBookmarkNodeData extends NodeData {
	rawData: chrome.bookmarks.BookmarkTreeNode;

	constructor(data: chrome.bookmarks.BookmarkTreeNode) {
		super();
		this.rawData = data;
	}

	// Chrome bookmark internal ID
	getId(): string {
		return this.rawData.id;
	}

	getParentId(): string | null {
		return this.rawData.parentId || null;
	}

	getHash(): string {
		let hash: string | null | undefined;
		if (this.isFolder()) {
			hash = this.getName();
		} else {
			// * Chrome handles redirection so URL changes after saved to bookmarks
			hash = normalizeUrl(this.getUrl() || '');
		}
		return hash || Math.random().toString();
	}

	getName(): string {
		return this.rawData.title;
	}

	getUrl(): string | null {
		return this.rawData.url || null;
	}

	isFolder(): boolean {
		return !this.rawData.url;
	}
}

/**
 * Creates a tree structure from Chrome bookmarks.
 * @param base Optional base node to start from
 * @returns Root node of the tree
 */
export async function createTreeFromChromeBookmarks(
	base?: chrome.bookmarks.BookmarkTreeNode
): Promise<TreeNode<ChromeBookmarkNodeData>> {
	const tree = await chrome.bookmarks.getTree();
	const root = tree[0];

	// Perform BFS to flatten the tree
	const dataList = [];
	const queue = [root];
	while (queue.length > 0) {
		const node = queue.shift()!;
		dataList.push(new ChromeBookmarkNodeData(node));
		if (node.children) {
			for (const child of node.children) {
				queue.push(child);
			}
		}
	}

	// Unwrap redundant root wrapper added during tree creation
	const rootWrapper = TreeNode.createTree(null, dataList);
	if (!base) {
		const innerRoot = rootWrapper.children[0];
		return innerRoot;
	}

	// Locate the base node in the created tree
	let baseNode: TreeNode<ChromeBookmarkNodeData> | undefined;
	rootWrapper.dfs((node) => {
		if (node.getId() === base?.id && !baseNode) {
			baseNode = node;
		}
	});
	if (baseNode === undefined) {
		throw new Error(`Failed to locate the base node (${base.id}) in the created tree`);
	}
	return baseNode;
}
