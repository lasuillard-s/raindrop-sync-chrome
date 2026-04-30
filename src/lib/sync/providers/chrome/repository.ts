import { AssertionError, InvalidSearchQueryError, NodeNotFoundError } from '@lib/browser/errors';
import { defaultBrowserProxy, type BookmarkService, type BrowserProxy } from '@lib/browser/proxy';
import { Path } from '@lib/util/path';

type NodeType = chrome.bookmarks.BookmarkTreeNode;

export type SearchQuery = {
	id?: string;
	path?: Path;
};

export class ChromeBookmarkRepository {
	protected readonly bookmarks: BookmarkService;

	constructor(browserProxy: BrowserProxy = defaultBrowserProxy) {
		this.bookmarks = browserProxy.bookmarks;
	}

	// Internal base operations with no strict bookmark type checks.
	// ! These operations are not exposed publicly and should only be used internally with proper type checks.
	// --------------------------------------------------------------------------
	protected async getRoot(): Promise<NodeType> {
		const tree = await this.bookmarks.getTree();
		return tree[0];
	}

	/**
	 * Get a node by its ID.
	 * @param id Node ID.
	 * @returns The bookmark node.
	 * @throws {NodeNotFoundError} if the node is not found.
	 */
	protected async getById(id: string): Promise<NodeType> {
		try {
			const [node] = await this.bookmarks.getSubTree(id);
			return node;
		} catch (err) {
			throw new NodeNotFoundError(`Node with ID ${id} not found: ${err}`, { cause: err });
		}
	}

	/**
	 * Get a node by its path. Throws an error if not found.
	 * @param path The path of the node.
	 * @returns The bookmark node.
	 * @throws {NodeNotFoundError} if the node is not found.
	 */
	protected async getByPath(path: Path): Promise<NodeType> {
		const root = await this.getRoot();

		// Traverse the bookmark tree based on the path segments to find the target node
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

			if (segments.length === 0 && nextNode.url === undefined) {
				return nextNode;
			}
		}

		// If we exhaust the segments without finding a match, it means the node does not exist
		throw new NodeNotFoundError(`Node with path ${path.toString()} not found`);
	}

	/**
	 * Find a node by its ID or path. Throws an error if not found.
	 * @param search criteria to find the node.
	 * @returns The bookmark node.
	 * @throws {NodeNotFoundError} if the node is not found.
	 * @throws {InvalidSearchQueryError} if neither id nor path is provided in the search criteria.
	 */
	protected async getBy(search: SearchQuery): Promise<NodeType> {
		if (search.id) {
			return await this.getById(search.id);
		}
		if (search.path) {
			return await this.getByPath(search.path);
		}
		throw new InvalidSearchQueryError(
			'Unhandled search query: at least one of id or path must be provided'
		);
	}

	/**
	 * Find a node by its ID or path.
	 * @param search criteria to find the node.
	 * @returns The bookmark node or null if not found.
	 */
	protected async findBy(search: SearchQuery): Promise<NodeType | null> {
		try {
			return await this.getBy(search);
		} catch (err) {
			if (err instanceof NodeNotFoundError) {
				return null;
			}
			throw err;
		}
	}

	/**
	 * Assert that a node is of the expected type (folder or bookmark). Throws an error if the type does not match.
	 * @param node The bookmark node to check.
	 * @param assertions The expected type assertions for the node.
	 * @param assertions.typeIs The expected type of the node ('folder' or 'bookmark').
	 * @returns The bookmark node if it matches the expected type.
	 * @throws {AssertionError} if the node type does not pass the assertions.
	 */
	protected assertNodeIs(
		node: NodeType,
		assertions: {
			typeIs: 'folder' | 'bookmark';
		}
	): NodeType {
		// Assert node type
		const nodeType = node.url === undefined ? 'folder' : 'bookmark';
		if (nodeType !== assertions.typeIs) {
			throw new AssertionError(
				`Node type mismatch: expected ${assertions.typeIs}, got ${nodeType}`
			);
		}

		return node;
	}

	// Exposed APIs
	// --------------------------------------------------------------------------
	/**
	 * Get the path of a node by traversing up to the root. The path is constructed based on the titles of the nodes.
	 * @param node The bookmark node to get the path for.
	 * @returns The Path object representing the path of the node.
	 */
	async getPathOf(node: NodeType): Promise<Path> {
		const segments: string[] = [];
		let currentNode: NodeType | undefined = node;
		while (currentNode) {
			segments.unshift(currentNode.title);
			if (!currentNode.parentId) {
				break;
			}
			currentNode = await this.getById(currentNode.parentId);
		}
		return new Path({ segments });
	}

	/**
	 * Get a folder by its ID.
	 * @param search query to find the folder.
	 * @throws {NodeNotFoundError} if folder is not found.
	 * @returns The bookmark folder.
	 */
	async getFolderBy(search: SearchQuery): Promise<NodeType> {
		const node = await this.getBy(search);
		return this.assertNodeIs(node, { typeIs: 'folder' });
	}

	/**
	 * Find a folder by its ID or path.
	 * @param search query to find the folder.
	 * @returns The bookmark folder or null if not found.
	 * @throws {InvalidSearchQueryError} if neither id nor path is provided in the search criteria.
	 * @throws {AssertionError} if a node is found but it is not a folder.
	 */
	async findFolderBy(search: SearchQuery): Promise<NodeType | null> {
		const node = await this.findBy(search);
		if (!node) {
			return null;
		}
		return this.assertNodeIs(node, { typeIs: 'folder' });
	}

	/**
	 * Get a bookmark by its ID or path.
	 * @param search query to find the bookmark.
	 * @throws {NodeNotFoundError} if bookmark is not found.
	 * @returns The bookmark node.
	 */
	async getBookmarkBy(search: SearchQuery): Promise<NodeType> {
		const node = await this.getBy(search);
		return this.assertNodeIs(node, { typeIs: 'bookmark' });
	}

	/**
	 * Find a bookmark by its ID or path.
	 * @param search query to find the bookmark.
	 * @returns The bookmark node or null if not found.
	 * @throws {InvalidSearchQueryError} if neither id nor path is provided in the search criteria.
	 * @throws {AssertionError} if a node is found but it is not a bookmark.
	 */
	async findBookmarkBy(search: SearchQuery): Promise<NodeType | null> {
		const node = await this.findBy(search);
		if (!node) {
			return null;
		}
		return this.assertNodeIs(node, { typeIs: 'bookmark' });
	}

	/**
	 * Create a folder by its path.
	 * @param path The path of the folder.
	 * @param options Options for folder creation.
	 * @param options.createParentsIfNotExists Whether to create parent folders if they do not exist.
	 * @returns The created folder node.
	 */
	async createFolderByPath(
		path: Path,
		options?: { createParentsIfNotExists?: boolean }
	): Promise<NodeType> {
		const createParentsIfNotExists = options?.createParentsIfNotExists ?? false;

		// Traverse the path and create folders as needed
		let current = await this.getRoot();
		for (const segment of path.getSegments()) {
			// Assert current node is a folder before traversing its children
			this.assertNodeIs(current, { typeIs: 'folder' });

			// Find the next node in the path
			const children = current.children || [];
			const nextNode = children.find((node) => node.title === segment);

			// If the next node does not exist and createParentIfNotExists is false, throw an error.
			if (nextNode) {
				current = nextNode;
				continue;
			}

			// If the next node does not exist and createParentIfNotExists is true, create the folder.
			if (createParentsIfNotExists) {
				current = await this.bookmarks.create({
					parentId: current.id,
					title: segment
				});
				continue;
			}

			// If the next node does not exist and createParentIfNotExists is false, throw an error.
			throw new NodeNotFoundError(`Folder with path ${path.toString()} not found`);
		}

		return current;
	}

	/**
	 * Create a new bookmark.
	 * @param path The path where the bookmark should be created.
	 * @param args The bookmark details.
	 * @param args.url The URL of the bookmark.
	 * @param options Options for bookmark creation.
	 * @param options.createParentsIfNotExists Whether to create the parent folder if it does not exist.
	 * @returns The created bookmark node.
	 */
	async createBookmarkByPath(
		path: Path,
		args: {
			url: string;
		},
		options?: {
			createParentsIfNotExists?: boolean;
		}
	): Promise<NodeType> {
		const createParentsIfNotExists = options?.createParentsIfNotExists ?? false;

		// Ensure parent folder exists (create it if allowed)
		const parent = path.getParent();
		let parentFolder: NodeType;
		if (createParentsIfNotExists) {
			parentFolder = await this.createFolderByPath(parent, { createParentsIfNotExists });
		} else {
			parentFolder = await this.getFolderBy({ path: parent });
		}

		// Create the bookmark under the parent folder
		return await this.bookmarks.create({
			parentId: parentFolder.id,
			title: path.basename(),
			url: args.url
		});
	}

	/**
	 * Delete a bookmark or folder by its ID.
	 * @param id ID of the bookmark or folder to delete.
	 * @throws {NodeNotFoundError} if bookmark or folder is not found.
	 */
	async delete(id: string) {
		console.log(`Deleting node with ID ${id}`);
		const node = await this.getBy({ id });
		await this.bookmarks.remove(node.id);
	}

	/**
	 * Update a folder by its ID.
	 * @param id The ID of the folder to update.
	 * @param changes The folder details to update.
	 * @param changes.title The new title of the folder.
	 * @returns The updated folder node.
	 */
	async updateFolder(
		id: string,
		changes: {
			title?: string;
		}
	): Promise<NodeType> {
		const folder = await this.getFolderBy({ id });
		return await this.bookmarks.update(folder.id, {
			...changes
		});
	}

	/**
	 * Update a bookmark by its ID.
	 * @param id The ID of the bookmark to update.
	 * @param changes The bookmark details to update.
	 * @param changes.title The new title of the bookmark.
	 * @param changes.url The new URL of the bookmark.
	 * @returns The updated bookmark node.
	 */
	async updateBookmark(
		id: string,
		changes: {
			title?: string;
			url?: string;
		}
	): Promise<NodeType> {
		const bookmark = await this.getBookmarkBy({ id });
		return await this.bookmarks.update(bookmark.id, {
			...changes
		});
	}

	/**
	 * Move a bookmark or folder to a new parent folder.
	 * @param id The ID of the bookmark or folder to move.
	 * @param changes The changes to apply, including the new parent ID.
	 * @param changes.parentId The ID of the new parent folder.
	 * @returns The moved node.
	 */
	async move(id: string, changes: { parentId: string }): Promise<NodeType> {
		const node = await this.getById(id);
		return await this.bookmarks.move(node.id, changes);
	}
}
