import type { client, generated, utils } from '@lasuillard/raindrop-client';

/**
 * Repository for Chrome bookmarks.
 */
export class ChromeBookmarkRepository {
	/**
	 * Find a folder by its ID.
	 * @param id Folder ID.
	 * @returns The bookmark folder or null if not found.
	 */
	async findFolderById(id: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
		const folder = (await chrome.bookmarks.getSubTree(id))[0];
		if (!folder) {
			return null;
		}
		return folder;
	}

	/**
	 * Get a folder by its ID.
	 * @param id Folder ID.
	 * @throws {Error} if folder is not found.
	 * @returns The bookmark folder.
	 */
	async getFolderById(id: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
		const folder = await this.findFolderById(id);
		if (!folder) {
			throw new Error(`Folder with ID ${id} not found`);
		}
		return folder;
	}

	async createBookmarksRecursively(opts: {
		baseFolder: chrome.bookmarks.BookmarkTreeNode;
		tree: utils.tree.TreeNode<generated.Collection | null>;
		raindropClient: client.Raindrop;
	}) {
		const collectionId = opts.tree.data?._id ?? -1;
		const raindrops = await opts.raindropClient.raindrop.getAllRaindrops(collectionId);
		await Promise.all(
			raindrops.map((rd) =>
				chrome.bookmarks.create({
					parentId: opts.baseFolder.id,
					title: rd.title,
					url: rd.link
				})
			)
		);
		await Promise.all(
			opts.tree.children.map(async (collection) => {
				chrome.bookmarks.create(
					{
						parentId: opts.baseFolder.id,
						title: collection.data?.title || 'No Title'
					},
					async (result) =>
						await this.createBookmarksRecursively({
							...opts,
							baseFolder: result,
							tree: collection
						})
				);
			})
		);
	}

	/**
	 * Clear all bookmarks in a folder.
	 * @param folder Folder to clear bookmarks.
	 */
	async clearAllBookmarksInFolder(folder: chrome.bookmarks.BookmarkTreeNode) {
		const promises = [];
		for (const child of folder.children ?? []) {
			promises.push(chrome.bookmarks.removeTree(child.id));
		}
		await Promise.all(promises);
	}
}
