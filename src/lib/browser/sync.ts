import { buildTreeFromSource, type TreeSourceAdapter } from '~/lib/bookmark/source';
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

const chromeBookmarkTreeSource: TreeSourceAdapter<ChromeBookmarkNodeData> = {
	async loadNodes() {
		const tree = await chrome.bookmarks.getTree();
		const root = tree[0];

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

		return dataList;
	}
};

/**
 * Creates a tree structure from Chrome bookmarks.
 * @param base Optional base node to start from
 * @returns Root node of the tree
 */
export async function createTreeFromChromeBookmarks(
	base?: chrome.bookmarks.BookmarkTreeNode
): Promise<TreeNode<ChromeBookmarkNodeData>> {
	const missingBaseMessage = base
		? `Failed to locate the base node (${base.id}) in the created tree`
		: undefined;

	return await buildTreeFromSource(chromeBookmarkTreeSource, {
		baseNodeId: base?.id,
		unwrapRoot: true,
		missingBaseMessage
	});
}
