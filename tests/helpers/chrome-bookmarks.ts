import { vi } from 'vitest';
import _getTree from '@fixtures/chrome/bookmarks/getTree.json';

// @ts-expect-error Ignore type mismatch for mocks
const getTree: chrome.bookmarks.BookmarkTreeNode[] = _getTree;

export const mocks = {
	getTree: vi.fn(() => getTree),
	getSubTree: vi.fn((id) => {
		// Simple recursive search for the node by ID
		const findNodeById = (
			nodes: chrome.bookmarks.BookmarkTreeNode[],
			idToFind: string
		): chrome.bookmarks.BookmarkTreeNode | null => {
			for (const node of nodes) {
				if (node.id === idToFind) {
					return node;
				}
				if (node.children) {
					const foundInChildren = findNodeById(node.children, idToFind);
					if (foundInChildren) {
						return foundInChildren;
					}
				}
			}
			return null;
		};
		const node = findNodeById(getTree, id);
		if (node) {
			return Promise.resolve([node]);
		} else {
			return Promise.reject(new Error("Can't find bookmark for id."));
		}
	}),
	create: vi.fn(({ parentId, title }) => ({
		dateAdded: Date.now(),
		id: Math.random().toString(36).substring(2, 15),
		parentId,
		syncing: false,
		title,
		children: []
	})),
	remove: vi.fn(),
	removeTree: vi.fn(),
	update: vi.fn()
};
