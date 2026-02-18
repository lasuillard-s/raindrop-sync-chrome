import type { generated, utils } from '@lasuillard/raindrop-client';
import { Path } from '~/lib/util/path';
import type { Raindrop } from '~/lib/raindrop/client';

export class FolderNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, FolderNotFoundError.prototype);
		this.name = 'FolderNotFoundError';
	}
}

export class BookmarkNotFoundError extends Error {
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
	 * Get a folder by its ID.
	 * @param id Folder ID.
	 * @throws {FolderNotFoundError} if folder is not found.
	 * @returns The bookmark folder.
	 */
	async getFolderById(id: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
		try {
			return (await chrome.bookmarks.getSubTree(id))[0];
		} catch (err) {
			throw new FolderNotFoundError(`Folder with ID ${id} not found: ${err}`);
		}
	}

	/**
	 * Find a folder by its ID.
	 * @param id Folder ID.
	 * @returns The bookmark folder or null if not found.
	 */
	async findFolderById(id: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
		try {
			return await this.getFolderById(id);
		} catch {
			return null;
		}
	}

	/**
	 * Get a bookmark by its path.
	 * @param path The path of the bookmark.
	 * @throws {BookmarkNotFoundError} if bookmark is not found.
	 * @returns The bookmark node.
	 */
	async getBookmarkByPath(path: Path): Promise<chrome.bookmarks.BookmarkTreeNode> {
		const tree = await chrome.bookmarks.getTree();
		const root = tree[0];

		const segments = path.getSegments();
		let currentNodes = root.children ?? [];

		while (segments.length > 0) {
			const segment = segments.shift();
			const nextNode = currentNodes.find((node) => node.title === segment);
			if (!nextNode) {
				break;
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
		throw new BookmarkNotFoundError(`Bookmark with path ${path.toString()} not found`);
	}

	/**
	 * Find a bookmark by its path.
	 * @param path The path of the bookmark.
	 * @returns The bookmark node or null if not found.
	 */
	async findBookmarkByPath(path: Path): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
		try {
			return await this.getBookmarkByPath(path);
		} catch {
			return null;
		}
	}

	/**
	 * Create a folder by its path.
	 * @param path The path of the folder.
	 * @param options Options for folder creation.
	 * @param options.createParentIfNotExists Whether to create parent folders if they do not exist.
	 * @returns The created folder node.
	 */
	async createFolder(
		path: Path,
		options?: { createParentIfNotExists?: boolean }
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		const createParentIfNotExists = options?.createParentIfNotExists ?? false;
		const tree = await chrome.bookmarks.getTree();
		let root = tree[0];
		for (const segment of path.getSegments()) {
			if (!root.children) {
				throw new Error(
					'Invalid bookmark structure; non-folder node encountered while creating folder'
				);
			}
			let nextNode = root.children.find((node) => node.title === segment);
			if (!nextNode && createParentIfNotExists) {
				nextNode = await chrome.bookmarks.create({
					parentId: root.id,
					title: segment
				});
			} else if (!nextNode) {
				throw new FolderNotFoundError(`Folder with path ${path.toString()} not found`);
			}
			root = nextNode;
		}
		return root;
	}

	/**
	 * Create a new bookmark.
	 * @param path The path where the bookmark should be created.
	 * @param args The bookmark details.
	 * @param args.title The title of the bookmark.
	 * @param args.url The URL of the bookmark.
	 * @param options Options for bookmark creation.
	 * @param options.createParentIfNotExists Whether to create the parent folder if it does not exist.
	 * @returns The created bookmark node.
	 */
	async createBookmark(
		path: Path,
		args: {
			title: string;
			url: string;
		},
		options?: {
			createParentIfNotExists?: boolean;
		}
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		const createParentIfNotExists = options?.createParentIfNotExists ?? false;
		const parent = path.getParent();
		let parentFolder: chrome.bookmarks.BookmarkTreeNode;
		if (createParentIfNotExists) {
			parentFolder = await this.createFolder(parent, { createParentIfNotExists });
		} else {
			parentFolder = await this.getBookmarkByPath(parent);
		}
		return await chrome.bookmarks.create({
			parentId: parentFolder.id,
			title: args.title,
			url: args.url
		});
	}

	/**
	 * Delete a bookmark by its path.
	 * @param path The path of the bookmark to delete.
	 * @throws {BookmarkNotFoundError} if bookmark is not found.
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
	 * @deprecated This method will be removed in future versions.
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
	 * @deprecated This method will be removed in future versions.
	 */
	async createBookmarksRecursively(opts: {
		baseFolder: chrome.bookmarks.BookmarkTreeNode;
		tree: utils.tree.TreeNode<generated.Collection | null>;
		raindropClient: Raindrop;
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
