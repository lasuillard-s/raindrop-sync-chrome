export interface BookmarkService {
	getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]>;
	getSubTree(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]>;
	create(bookmark: chrome.bookmarks.CreateDetails): Promise<chrome.bookmarks.BookmarkTreeNode>;
	remove(id: string): Promise<void>;
	removeTree(id: string): Promise<void>;
	update(
		id: string,
		changes: chrome.bookmarks.UpdateChanges
	): Promise<chrome.bookmarks.BookmarkTreeNode>;
	move(
		id: string,
		changes: chrome.bookmarks.MoveDestination
	): Promise<chrome.bookmarks.BookmarkTreeNode>;
}

export class WebExtensionBookmarkService implements BookmarkService {
	async getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
		return await chrome.bookmarks.getTree();
	}

	async getSubTree(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
		return await chrome.bookmarks.getSubTree(id);
	}

	async create(
		bookmark: chrome.bookmarks.CreateDetails
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		return await chrome.bookmarks.create(bookmark);
	}

	async remove(id: string): Promise<void> {
		await chrome.bookmarks.remove(id);
	}

	async removeTree(id: string): Promise<void> {
		await chrome.bookmarks.removeTree(id);
	}

	async update(
		id: string,
		changes: chrome.bookmarks.UpdateChanges
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		return await chrome.bookmarks.update(id, changes);
	}

	async move(
		id: string,
		changes: chrome.bookmarks.MoveDestination
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		return await chrome.bookmarks.move(id, changes);
	}
}
