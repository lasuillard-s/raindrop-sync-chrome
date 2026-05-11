import _getTree from '$fixtures/chrome/bookmarks/getTree.json';
import { cleanup } from '@testing-library/svelte';
import { afterEach, beforeEach, vi } from 'vitest';

// @ts-expect-error Ignore type mismatch for mocks
const getTree: chrome.bookmarks.BookmarkTreeNode[] = _getTree;

beforeEach(() => {
	// Tried to use both sinon-chrome and vitest-chrome, but it seems both are not being
	// maintained for a while. So opted to just stub the parts we need directly.
	vi.stubGlobal('chrome', {
		// Here only provide sane defaults and scaffolding for the parts we use in tests.
		// Each test can follow pattern like:
		//
		// vi.mocked(chrome.bookmarks.getSubTree).mockImplementationOnce(...)
		//
		alarms: {
			create: vi.fn(),
			clearAll: vi.fn()
		},
		bookmarks: {
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
			update: vi.fn(),
			move: vi.fn()
		},
		identity: {
			getRedirectURL: vi.fn(),
			launchWebAuthFlow: vi.fn()
		},
		storage: {
			sync: {
				get: vi.fn(async () => ({})),
				set: vi.fn(async () => undefined),
				remove: vi.fn(async () => undefined)
			}
		}
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	cleanup();
});
