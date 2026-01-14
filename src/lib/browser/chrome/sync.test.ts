import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTreeFromChromeBookmarks } from './sync';
import { ChromeBookmarkRepository } from './repository';

// Full result of `await chrome.bookmarks.getTree()` for testing
const testTreeData: chrome.bookmarks.BookmarkTreeNode[] = [
	{
		children: [
			{
				children: [
					{
						children: [
							{
								dateAdded: 1768201707926,
								id: '6',
								index: 0,
								parentId: '5',
								syncing: false,
								title: 'updateRaindrops',
								url: 'https://raindrop.io/'
							}
						],
						dateAdded: 1768201707921,
						dateGroupModified: 1768201707926,
						id: '5',
						index: 0,
						parentId: '1',
						syncing: false,
						title: 'updateRaindrops'
					},
					{
						dateAdded: 1768201707941,
						id: '7',
						index: 1,
						parentId: '1',
						syncing: false,
						title: 'GitHub · Change is constant. GitHub keeps you ahead.',
						url: 'https://github.com/'
					},
					{
						dateAdded: 1768201707944,
						id: '8',
						index: 2,
						parentId: '1',
						syncing: false,
						title: 'https://raindrop.io',
						url: 'https://raindrop.io/'
					},
					{
						dateAdded: 1768201707949,
						id: '9',
						index: 3,
						parentId: '1',
						syncing: false,
						title: 'getAllHighlights',
						url: 'https://raindrop.io/'
					}
				],
				dateAdded: 1768200846043,
				dateGroupModified: 1768201707949,
				folderType: 'bookmarks-bar',
				id: '1',
				index: 0,
				parentId: '0',
				syncing: false,
				title: 'Bookmarks bar'
			},
			{
				children: [],
				dateAdded: 1768200846043,
				folderType: 'other',
				id: '2',
				index: 1,
				parentId: '0',
				syncing: false,
				title: 'Other bookmarks'
			}
		],
		dateAdded: 1768279993452,
		id: '0',
		syncing: false,
		title: ''
	}
];

let repository: ChromeBookmarkRepository;

beforeEach(() => {
	repository = new ChromeBookmarkRepository();
	vi.mocked(chrome.bookmarks.getTree).mockImplementation(() => {
		return Promise.resolve(testTreeData);
	});
	vi.mocked(chrome.bookmarks.getSubTree).mockImplementation((id) => {
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
		const node = findNodeById(testTreeData, id);
		if (node) {
			return Promise.resolve([node]);
		} else {
			return Promise.reject(new Error("Can't find bookmark for id."));
		}
	});
});

describe('createTreeFromChromeBookmarks', () => {
	it('should create a tree structure from Chrome bookmarks', async () => {
		const root = await createTreeFromChromeBookmarks();
		const paths: string[] = [];
		root.dfs((node) => {
			paths.push(node.getFullPath().toString() || '');
		});
		expect(paths).toEqual([
			'/',
			'/Bookmarks bar',
			'/Bookmarks bar/updateRaindrops',
			'/Bookmarks bar/updateRaindrops/updateRaindrops',
			'/Bookmarks bar/GitHub · Change is constant. GitHub keeps you ahead.',
			'/Bookmarks bar/https://raindrop.io',
			'/Bookmarks bar/getAllHighlights',
			'/Other bookmarks'
		]);
	});

	it('pass base parameter to get non-root node as base', async () => {
		const baseNode = await repository.getFolderById('5'); // 'updateRaindrops' folder
		const base = await createTreeFromChromeBookmarks(baseNode);
		const paths: string[] = [];
		base.dfs((node) => {
			paths.push(node.getFullPath().toString() || '');
		});
		expect(paths).toEqual([
			'/Bookmarks bar/updateRaindrops',
			'/Bookmarks bar/updateRaindrops/updateRaindrops'
		]);
	});
});
