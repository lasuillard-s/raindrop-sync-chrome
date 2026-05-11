import type { Worker } from '@playwright/test';

export class BookmarkFixture {
	constructor(private readonly serviceWorker: Worker) {}

	async getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
		return await this.serviceWorker.evaluate(async () => {
			return await chrome.bookmarks.getTree();
		});
	}

	/**
	 * Returns a simplified text representation of tree for easier assertions in tests.
	 * @returns String representation of the bookmark tree.
	 * @example
	 * Root
	 * - Work
	 *   - Project A (https://project-a.com)
	 *   - Project B (https://project-b.com)
	 * - Personal
	 * - Delete 1 (https://delete-1.example)
	 * - Delete 2 (https://delete-2.example)
	 */
	async getTreeRepr(): Promise<string> {
		return await this.serviceWorker.evaluate(async () => {
			const [root] = await chrome.bookmarks.getTree();

			// DFS to flatten the tree structure
			let result = '';
			const dfs = (node: chrome.bookmarks.BookmarkTreeNode, depth: number) => {
				result += `${'  '.repeat(depth)}${node.title}`;
				if (node.url) {
					result += ` (${node.url})`;
				}
				result += '\n';
				if (node.children) {
					for (const child of node.children) {
						dfs(child, depth + 1);
					}
				}
			};
			if (root) {
				for (const child of root.children ?? []) {
					dfs(child, 0);
				}
			}
			return result;
		});
	}

	async removeTree(id: string): Promise<void> {
		await this.serviceWorker.evaluate(async (nodeId) => {
			await chrome.bookmarks.removeTree(nodeId);
		}, id);
	}

	async clearAllBookmarks(): Promise<void> {
		await this.serviceWorker.evaluate(async () => {
			const [root] = await chrome.bookmarks.getTree();
			const rootFolders = root?.children ?? [];
			for (const folder of rootFolders) {
				for (const child of folder.children ?? []) {
					if (child.url === undefined) {
						await chrome.bookmarks.removeTree(child.id);
					} else {
						await chrome.bookmarks.remove(child.id);
					}
				}
			}
		});
	}

	async createBookmark(args: {
		title: string;
		url: string;
		parentId?: string;
	}): Promise<chrome.bookmarks.BookmarkTreeNode> {
		return await this.serviceWorker.evaluate(async (createArgs) => {
			return await chrome.bookmarks.create({
				title: createArgs.title,
				url: createArgs.url,
				parentId: createArgs.parentId
			});
		}, args);
	}

	async findBookmarkByTitle(
		title: string
	): Promise<{ id: string; title: string; url: string; parentId: string | null } | null> {
		return await this.serviceWorker.evaluate(async (bookmarkTitle) => {
			const [root] = await chrome.bookmarks.getTree();
			const queue = [...(root?.children ?? [])];
			while (queue.length > 0) {
				const node = queue.shift()!;
				if (node.url !== undefined && node.title === bookmarkTitle) {
					return {
						id: node.id,
						title: node.title,
						url: node.url ?? '',
						parentId: node.parentId ?? null
					};
				}
				queue.push(...(node.children ?? []));
			}
			return null;
		}, title);
	}

	async createFolder(args: {
		title: string;
		parentId?: string;
	}): Promise<chrome.bookmarks.BookmarkTreeNode> {
		return await this.serviceWorker.evaluate(async (createArgs) => {
			return await chrome.bookmarks.create({
				title: createArgs.title,
				parentId: createArgs.parentId
			});
		}, args);
	}

	async findFolderByTitle(
		title: string
	): Promise<{ id: string; title: string; parentId: string | null } | null> {
		return await this.serviceWorker.evaluate(async (folderTitle) => {
			const [root] = await chrome.bookmarks.getTree();
			const queue = [...(root?.children ?? [])];
			while (queue.length > 0) {
				const node = queue.shift()!;
				if (node.url === undefined && node.title === folderTitle) {
					return {
						id: node.id,
						title: node.title,
						parentId: node.parentId ?? null
					};
				}
				queue.push(...(node.children ?? []));
			}
			return null;
		}, title);
	}
}
