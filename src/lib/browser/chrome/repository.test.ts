import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getClient } from '~/lib/raindrop/client';
import { Path } from '~/lib/util/path';
import { BookmarkNotFoundError, ChromeBookmarkRepository, FolderNotFoundError } from './repository';

let repository: ChromeBookmarkRepository;

beforeEach(() => {
	repository = new ChromeBookmarkRepository();
});

describe('getFolderById', () => {
	it('should return the folder when found', async () => {
		expect(await repository.findFolderById('5')).toEqual({
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
		});
	});

	it('should throw FolderNotFoundError when folder not found', async () => {
		await expect(repository.getFolderById('non-existent-id')).rejects.toThrowError(
			FolderNotFoundError
		);
	});
});

describe('findFolderById', () => {
	it('should return the folder when found', async () => {
		expect(await repository.findFolderById('5')).toEqual({
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
		});
	});

	it('should return null when folder not found', async () => {
		vi.mocked(chrome.bookmarks.getSubTree).mockRejectedValueOnce(
			new Error("Can't find bookmark for id.")
		);
		expect(await repository.findFolderById('non-existent-id')).toBeNull();
	});
});

describe('getBookmarkByPath', () => {
	it('should return the bookmark when found', async () => {
		const bookmark = await repository.getBookmarkByPath(
			new Path({
				segments: ['Bookmarks bar', 'updateRaindrops', 'updateRaindrops']
			})
		);
		expect(bookmark).toEqual({
			dateAdded: 1768201707926,
			id: '6',
			index: 0,
			parentId: '5',
			syncing: false,
			title: 'updateRaindrops',
			url: 'https://raindrop.io/'
		});
	});

	it('should throw BookmarkNotFoundError when bookmark not found', async () => {
		await expect(
			repository.getBookmarkByPath(
				new Path({
					segments: ['Bookmarks bar', 'NonExistentFolder', 'SomeBookmark']
				})
			)
		).rejects.toThrowError(BookmarkNotFoundError);
	});
});

describe('findBookmarkByPath', () => {
	it('should return the bookmark when found', async () => {
		const bookmark = await repository.findBookmarkByPath(
			new Path({
				segments: ['Bookmarks bar', 'updateRaindrops', 'updateRaindrops']
			})
		);
		expect(bookmark).toEqual({
			dateAdded: 1768201707926,
			id: '6',
			index: 0,
			parentId: '5',
			syncing: false,
			title: 'updateRaindrops',
			url: 'https://raindrop.io/'
		});
	});

	it('should return null when bookmark not found', async () => {
		const bookmark = await repository.findBookmarkByPath(
			new Path({
				segments: ['Bookmarks bar', 'NonExistentFolder', 'SomeBookmark']
			})
		);
		expect(bookmark).toBeNull();
	});
});

describe('createFolder', () => {
	it('should create folder and parent folders if not exist', async () => {
		await repository.createFolder(
			new Path({
				segments: ['Bookmarks bar', 'New Parent Folder', 'New Folder']
			}),
			{
				createParentIfNotExists: true
			}
		);
		expect(chrome.bookmarks.create).toHaveBeenCalledTimes(2); // One for parent folder, one for folder
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: '1',
			title: 'New Parent Folder'
		});
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: expect.any(String),
			title: 'New Folder'
		});
	});

	it('should throw FolderNotFoundError when parent folder not found and createParentIfNotExists is false', async () => {
		await expect(
			repository.createFolder(
				new Path({
					segments: ['Bookmarks bar', 'NonExistentParent', 'New Folder']
				}),
				{
					createParentIfNotExists: false
				}
			)
		).rejects.toThrowError(FolderNotFoundError);
	});

	it.todo(
		'should throw BadStructureError when non-folder node encountered while creating folder',
		async () => {}
	);
});

describe('createBookmark', () => {
	it('should create bookmark and parent folder if not exist', async () => {
		await repository.createBookmark(
			new Path({
				segments: ['Bookmarks bar', 'New Parent Folder', 'New Bookmark']
			}),
			{
				title: 'New Bookmark',
				url: 'https://example.com'
			},
			{
				createParentIfNotExists: true
			}
		);
		expect(chrome.bookmarks.create).toHaveBeenCalledTimes(2); // One for parent folder, one for bookmark
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: '1',
			title: 'New Parent Folder'
		});
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: expect.any(String),
			title: 'New Bookmark',
			url: 'https://example.com'
		});
	});

	it('should throw BookmarkNotFoundError when parent folder not found and createParentIfNotExists is false', async () => {
		await expect(
			repository.createBookmark(
				new Path({
					segments: ['Bookmarks bar', 'NonExistentParent', 'New Bookmark']
				}),
				{
					title: 'New Bookmark',
					url: 'https://example.com'
				},
				{
					createParentIfNotExists: false
				}
			)
		).rejects.toThrowError(BookmarkNotFoundError);
	});
});

describe('deleteBookmark', () => {
	it('should delete the bookmark when found', async () => {
		await repository.deleteBookmark(
			new Path({
				segments: ['Bookmarks bar', 'updateRaindrops', 'updateRaindrops']
			})
		);
		expect(chrome.bookmarks.remove).toHaveBeenCalledWith('6');
	});

	it('should throw BookmarkNotFoundError when bookmark not found', async () => {
		await expect(
			repository.deleteBookmark(
				new Path({
					segments: ['Bookmarks bar', 'NonExistentFolder', 'SomeBookmark']
				})
			)
		).rejects.toThrowError(BookmarkNotFoundError);
	});
});

describe('updateBookmark', () => {
	it('should update the bookmark when found', async () => {
		await repository.updateBookmark(
			new Path({
				segments: ['Bookmarks bar', 'updateRaindrops', 'updateRaindrops']
			}),
			{
				title: 'Updated Title',
				url: 'https://updated-url.com'
			}
		);
		expect(chrome.bookmarks.update).toHaveBeenCalledWith('6', {
			title: 'Updated Title',
			url: 'https://updated-url.com'
		});
	});

	it('should throw BookmarkNotFoundError when bookmark not found', async () => {
		await expect(
			repository.updateBookmark(
				new Path({
					segments: ['Bookmarks bar', 'NonExistentFolder', 'SomeBookmark']
				}),
				{
					title: 'Updated Title',
					url: 'https://updated-url.com'
				}
			)
		).rejects.toThrowError(BookmarkNotFoundError);
	});
});

describe('clearAllBookmarksInFolder', () => {
	it('should clear all bookmarks in the specified folder', async () => {
		await repository.clearAllBookmarksInFolder(await repository.getFolderById('1')); // 'Bookmarks bar' folder

		// Verify that chrome.bookmarks.removeTree was called for each bookmark in the folder
		expect(chrome.bookmarks.removeTree).toHaveBeenCalledTimes(4); // 4 bookmarks in 'Bookmarks bar'
		expect(chrome.bookmarks.removeTree).toHaveBeenCalledWith('5');
		expect(chrome.bookmarks.removeTree).toHaveBeenCalledWith('7');
		expect(chrome.bookmarks.removeTree).toHaveBeenCalledWith('8');
		expect(chrome.bookmarks.removeTree).toHaveBeenCalledWith('9');
	});
});

describe('createBookmarksRecursively', () => {
	it('should create bookmarks and necessary parent folders recursively', async () => {
		const baseFolder = await repository.getFolderById('1');
		const raindropClient = getClient();
		const mockedRaindropClient = vi.mockObject(raindropClient);
		// @ts-expect-error Ignore type mismatch for mocks
		mockedRaindropClient.collection.getCollectionTree.mockImplementation(() => ({
			children: [
				{
					children: [],
					data: {
						_id: 57172489,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 0,
						cover: [],
						created: '2025-07-02T07:15:38.506Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-12-16T05:30:15.443Z',
						lastUpdate: '2025-12-16T05:30:15.444Z',
						parent: null,
						public: false,
						slug: 'get-highlights-in-collection',
						sort: 0,
						title: 'getHighlightsInCollection',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					},
					_parent: null
				},
				{
					children: [],
					data: {
						_id: 57172499,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 0,
						cover: [],
						created: '2025-07-02T07:15:46.143Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-07-02T07:15:46.143Z',
						lastUpdate: '2025-07-02T07:15:46.143Z',
						parent: null,
						public: false,
						slug: 'share-collection',
						sort: 0,
						title: 'shareCollection',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					},
					_parent: null
				},
				{
					children: [],
					data: {
						_id: 57172486,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 1,
						cover: [],
						created: '2025-07-02T07:15:37.776Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-07-02T07:15:38.746Z',
						lastUpdate: '2025-07-02T07:15:38.746Z',
						parent: null,
						public: false,
						slug: 'update-raindrops',
						sort: 0,
						title: 'updateRaindrops',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					},
					_parent: null
				}
			],
			data: null,
			_parent: null
		}));
		mockedRaindropClient.raindrop.getAllRaindrops.mockResolvedValue([
			{
				_id: 1491378920,
				collection: {
					$id: -1,
					$ref: 'collections',
					oid: -1
				},
				collectionId: -1,
				cover:
					'https://images.ctfassets.net/8aevphvgewt8/4pe4eOtUJ0ARpZRE4fNekf/f52b1f9c52f059a33170229883731ed0/GH-Homepage-Universe-img.png',
				created: '2025-12-16T05:32:04.883Z',
				creatorRef: {
					_id: 2067190,
					avatar: '',
					email: '',
					name: 'miyil99106'
				},
				domain: 'github.com',
				excerpt:
					"Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.",
				highlights: [],
				lastUpdate: '2025-12-16T05:32:06.197Z',
				link: 'https://github.com',
				media: [
					{
						link: 'https://images.ctfassets.net/8aevphvgewt8/4pe4eOtUJ0ARpZRE4fNekf/f52b1f9c52f059a33170229883731ed0/GH-Homepage-Universe-img.png',
						type: 'image'
					}
				],
				note: '',
				removed: false,
				sort: 1491378920,
				tags: [],
				title: 'GitHub · Change is constant. GitHub keeps you ahead.',
				type: 'link',
				user: {
					$id: 2067190,
					$ref: 'users'
				}
			},
			{
				_id: 1210279722,
				collection: {
					$id: -1,
					$ref: 'collections',
					oid: -1
				},
				collectionId: -1,
				cover:
					'https://t3.ftcdn.net/jpg/00/92/53/56/360_F_92535664_IvFsQeHjBzfE6sD4VHdO8u5OHUSc6yHF.jpg',
				created: '2025-07-02T07:15:40.097Z',
				creatorRef: {
					_id: 2067190,
					avatar: '',
					email: '',
					name: 'miyil99106'
				},
				domain: 'raindrop.io',
				excerpt: '',
				highlights: [],
				lastUpdate: '2025-07-02T07:15:40.098Z',
				link: 'https://raindrop.io',
				media: [
					{
						link: 'https://t3.ftcdn.net/jpg/00/92/53/56/360_F_92535664_IvFsQeHjBzfE6sD4VHdO8u5OHUSc6yHF.jpg',
						type: 'image'
					}
				],
				note: '',
				removed: false,
				sort: 1210279722,
				tags: ['raindrop'],
				title: 'https://raindrop.io',
				type: 'link',
				user: {
					$id: 2067190,
					$ref: 'users'
				}
			},
			{
				_id: 1210279712,
				collection: {
					$id: -1,
					$ref: 'collections',
					oid: -1
				},
				collectionId: -1,
				cover: '',
				created: '2025-07-02T07:15:37.885Z',
				creatorRef: {
					_id: 2067190,
					avatar: '',
					email: '',
					name: 'miyil99106'
				},
				domain: 'raindrop.io',
				excerpt: '',
				highlights: [
					{
						_id: '6864dc99f9cbdb7d1ee0f3ae',
						created: '2025-07-02T07:15:37.884Z',
						creatorRef: 2067190,
						lastUpdate: '2025-07-02T07:15:37.885Z',
						note: '',
						text: 'ignore'
					}
				],
				lastUpdate: '2025-07-02T07:15:37.885Z',
				link: 'https://raindrop.io',
				media: [],
				note: '',
				removed: false,
				sort: 1210279712,
				tags: [],
				title: 'getAllHighlights',
				type: 'link',
				user: {
					$id: 2067190,
					$ref: 'users'
				}
			}
		]);

		await repository.createBookmarksRecursively({
			baseFolder,
			tree: await mockedRaindropClient.collection.getCollectionTree(),
			raindropClient: mockedRaindropClient
		});
		expect(chrome.bookmarks.create).toHaveBeenCalledTimes(6);
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: '1',
			title: 'GitHub · Change is constant. GitHub keeps you ahead.',
			url: 'https://github.com'
		});
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: '1',
			title: 'https://raindrop.io',
			url: 'https://raindrop.io'
		});
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: '1',
			title: 'getAllHighlights',
			url: 'https://raindrop.io'
		});
		expect(chrome.bookmarks.create).toHaveBeenCalledWith(
			{
				parentId: '1',
				title: 'getHighlightsInCollection'
			},
			expect.any(Function) // Callback function
		);
		expect(chrome.bookmarks.create).toHaveBeenCalledWith(
			{
				parentId: '1',
				title: 'shareCollection'
			},
			expect.any(Function) // Callback function
		);
		expect(chrome.bookmarks.create).toHaveBeenCalledWith(
			{
				parentId: '1',
				title: 'updateRaindrops'
			},
			expect.any(Function) // Callback function
		);
	});
});
