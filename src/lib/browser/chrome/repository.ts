import type { client, generated, utils } from '@lasuillard/raindrop-client';
import { Path } from '~/lib/util/path';

class BookmarkNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, BookmarkNotFoundError.prototype);
		this.name = 'BookmarkNotFoundError';
	}
}

// TODO(lasuillard): Current implementation does not check for type of bookmark nodes (folder vs bookmark).
//                   This should be handled properly in future implementations to avoid potential issues.
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

	/**
	 * Find a bookmark by its path.
	 * @param path The path of the bookmark.
	 * @returns The bookmark node or null if not found.
	 */
	async findBookmarkByPath(path: Path): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
		const tree = await chrome.bookmarks.getTree();
		const root = tree[0];

		const segments = path.getSegments();
		let currentNodes = root.children ?? [];

		while (segments.length > 0) {
			const segment = segments.shift();
			const nextNode = currentNodes.find((node) => node.title === segment);
			if (!nextNode) {
				return null;
			}

			if (nextNode.children) {
				currentNodes = nextNode.children;
			} else {
				currentNodes = [];
			}

			if (segments.length === 0 && currentNodes.length === 0) {
				return nextNode;
			}
		}

		// Not found
		return null;
	}

	/**
	 * Get a bookmark by its path.
	 * @param path The path of the bookmark.
	 * @throws {BookmarkNotFoundError} if bookmark is not found.
	 * @returns The bookmark node.
	 */
	async getBookmarkByPath(path: Path): Promise<chrome.bookmarks.BookmarkTreeNode> {
		const bookmark = await this.findBookmarkByPath(path);
		if (!bookmark) {
			throw new BookmarkNotFoundError(`Bookmark with path ${path.getFullPath()} not found`);
		}
		return bookmark;
	}

	// TODO: Option to create parent folder if not exists
	/**
	 * Create a new bookmark.
	 * @param path The path where the bookmark should be created.
	 * @param args The bookmark details.
	 * @param args.title The title of the bookmark.
	 * @param args.url The URL of the bookmark.
	 * @returns The created bookmark node.
	 */
	async createBookmark(
		path: Path,
		args: {
			title: string;
			url: string;
		}
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		const parent = path.getParent();
		const parentFolder = await this.getBookmarkByPath(parent);
		return await chrome.bookmarks.create({
			parentId: parentFolder.id,
			title: args.title,
			url: args.url
		});
	}

	/**
	 * Delete a bookmark by its path.
	 * @param path The path of the bookmark to delete.
	 */
	async deleteBookmark(path: Path) {
		const bookmark = await this.getBookmarkByPath(path);
		await chrome.bookmarks.remove(bookmark.id);
	}

	/**
	 * Update a bookmark by its path.
	 * @param path The path of the bookmark to update.
	 * @param args The bookmark details to update.
	 * @param args.title The new title of the bookmark.
	 * @param args.url The new URL of the bookmark.
	 * @returns The updated bookmark node.
	 */
	async updateBookmark(
		path: Path,
		args: {
			title?: string;
			url?: string;
		}
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		const bookmark = await this.getBookmarkByPath(path);
		return await chrome.bookmarks.update(bookmark.id, {
			...args
		});
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

	/**
	 * Create bookmarks recursively based on the provided tree structure.
	 * @param opts Options for creating bookmarks.
	 * @param opts.baseFolder The base folder where bookmarks should be created.
	 * @param opts.tree The tree structure representing collections and bookmarks.
	 * @param opts.raindropClient The Raindrop.io client to fetch raindrops.
	 */
	async createBookmarksRecursively(opts: {
		baseFolder: chrome.bookmarks.BookmarkTreeNode;
		// TODO: Update below to use generic TreeNode type
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
}
