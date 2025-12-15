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
 * @param root Optional base tree node to start from. If not provided, the entire bookmark tree is used.
 * @returns Root node of the tree
 */
export async function createTreeFromChromeBookmarks(
	root?: chrome.bookmarks.BookmarkTreeNode
): Promise<TreeNode<ChromeBookmarkNodeData>> {
	if (root) {
		// * Monkey-patch provided base to make it look like root
		console.debug(`Using provided Chrome bookmark subtree as root: ${root.title} (${root.id})`);
		root.title = '';
		root.parentId = undefined;
	} else {
		console.debug('Fetching entire Chrome bookmark tree as root');
		const tree = await chrome.bookmarks.getTree();
		root = tree[0];
	}

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
	const innerRoot = rootWrapper.children[0];
	innerRoot.parent = null;
	return innerRoot;
}
