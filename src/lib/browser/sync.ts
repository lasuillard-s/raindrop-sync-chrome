import { TreeBuilder, type TreeBuildOptions } from '~/lib/sync/builder';
import { NodeData, TreeNode } from '~/lib/sync/tree';
import { normalizeUrl } from '~/lib/util/string';
import { defaultBrowserProxy, type BrowserProxy } from './proxy';

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
 * Builds a bookmark tree from the browser bookmark service.
 */
export class ChromeBookmarkTreeBuilder extends TreeBuilder<
	chrome.bookmarks.BookmarkTreeNode[],
	ChromeBookmarkNodeData
> {
	private readonly browserProxy: BrowserProxy;

	constructor(browserProxy: BrowserProxy = defaultBrowserProxy) {
		super();
		this.browserProxy = browserProxy;
	}

	protected async fetchSources(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
		return await this.browserProxy.bookmarks.getTree();
	}

	protected preprocess(nodes: chrome.bookmarks.BookmarkTreeNode[]): ChromeBookmarkNodeData[] {
		const dataList: ChromeBookmarkNodeData[] = [];
		const queue = [...nodes];
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

	protected override getDefaultBuildOptions(): Required<Pick<TreeBuildOptions, 'unwrapRoot'>> {
		return { unwrapRoot: true };
	}
}

/**
 * Creates a tree structure from Chrome bookmarks.
 * @param base Optional base node to start from
 * @param builder Tree builder instance to use for construction.
 * @returns Root node of the tree
 */
export async function createTreeFromChromeBookmarks(
	base?: chrome.bookmarks.BookmarkTreeNode,
	builder: ChromeBookmarkTreeBuilder = new ChromeBookmarkTreeBuilder()
): Promise<TreeNode<ChromeBookmarkNodeData>> {
	const missingBaseMessage = base
		? `Failed to locate the base node (${base.id}) in the created tree`
		: undefined;

	return await builder.build({
		baseNodeId: base?.id,
		missingBaseMessage
	});
}
