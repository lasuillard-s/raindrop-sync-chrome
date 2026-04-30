import { AssertionError, InvalidSearchQueryError, NodeNotFoundError } from '@lib/browser';
import { ChromeBookmarkRepository } from '@lib/sync/providers/chrome';
import { Path } from '@lib/util/path';
import { beforeEach, describe, expect, it } from 'vitest';

let repository: ChromeBookmarkRepository;

beforeEach(() => {
	repository = new ChromeBookmarkRepository();
});

describe('getPathOf', () => {
	it('returns correct path for a given bookmark ID', async () => {
		const node = await repository.getBookmarkBy({ id: '6' });
		const path = await repository.getPathOf(node);
		expect(path.getSegments()).toEqual(['Bookmarks bar', 'updateRaindrops', 'updateRaindrops']);
	});
});

describe('getFolderBy', () => {
	it('returns folder when found by id', async () => {
		expect(await repository.getFolderBy({ id: '5' })).toEqual({
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

	it('returns folder when found by path', async () => {
		const folder = await repository.getFolderBy({
			path: new Path({ segments: ['Bookmarks bar', 'updateRaindrops'] })
		});
		expect(folder.id).toBe('5');
		expect(folder.url).toBeUndefined();
	});

	it('throws NodeNotFoundError when not found', async () => {
		await expect(repository.getFolderBy({ id: 'non-existent-id' })).rejects.toThrow(
			NodeNotFoundError
		);
	});

	it('throws AssertionError when found node is a bookmark', async () => {
		await expect(repository.getFolderBy({ id: '6' })).rejects.toThrow(AssertionError);
	});

	it('throws InvalidSearchQueryError when query is empty', async () => {
		await expect(repository.getFolderBy({})).rejects.toThrow(InvalidSearchQueryError);
	});
});

describe('getBookmarkBy', () => {
	it('returns bookmark when found by id', async () => {
		expect(await repository.getBookmarkBy({ id: '6' })).toEqual({
			dateAdded: 1768201707926,
			id: '6',
			index: 0,
			parentId: '5',
			syncing: false,
			title: 'updateRaindrops',
			url: 'https://raindrop.io/'
		});
	});

	it('throws NodeNotFoundError when searching bookmark by path', async () => {
		await expect(
			repository.getBookmarkBy({
				path: new Path({
					segments: ['Bookmarks bar', 'updateRaindrops', 'updateRaindrops']
				})
			})
		).rejects.toThrow(NodeNotFoundError);
	});

	it('throws AssertionError when found node is a folder', async () => {
		await expect(repository.getBookmarkBy({ id: '5' })).rejects.toThrow(AssertionError);
	});

	it('throws InvalidSearchQueryError when query is empty', async () => {
		await expect(repository.getBookmarkBy({})).rejects.toThrow(InvalidSearchQueryError);
	});
});

describe('createFolderByPath', () => {
	it('creates folder and parent folders if not present', async () => {
		await repository.createFolderByPath(
			new Path({
				segments: ['Bookmarks bar', 'New Parent Folder', 'New Folder']
			}),
			{ createParentsIfNotExists: true }
		);
		expect(chrome.bookmarks.create).toHaveBeenCalledTimes(2);
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: '1',
			title: 'New Parent Folder'
		});
		expect(chrome.bookmarks.create).toHaveBeenCalledWith({
			parentId: expect.any(String),
			title: 'New Folder'
		});
	});

	it('throws NodeNotFoundError when parent folder is missing and auto-create is disabled', async () => {
		await expect(
			repository.createFolderByPath(
				new Path({
					segments: ['Bookmarks bar', 'NonExistentParent', 'New Folder']
				}),
				{ createParentsIfNotExists: false }
			)
		).rejects.toThrow(NodeNotFoundError);
		expect(chrome.bookmarks.create).not.toHaveBeenCalled();
	});
});

describe('createBookmarkByPath', () => {
	it('creates bookmark and parent folder if not present', async () => {
		await repository.createBookmarkByPath(
			new Path({
				segments: ['Bookmarks bar', 'New Parent Folder', 'New Bookmark']
			}),
			{ url: 'https://example.com' },
			{ createParentsIfNotExists: true }
		);
		expect(chrome.bookmarks.create).toHaveBeenCalledTimes(2);
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

	it('throws NodeNotFoundError when parent folder is missing and auto-create is disabled', async () => {
		await expect(
			repository.createBookmarkByPath(
				new Path({
					segments: ['Bookmarks bar', 'NonExistentParent', 'New Bookmark']
				}),
				{ url: 'https://example.com' },
				{ createParentsIfNotExists: false }
			)
		).rejects.toThrow(NodeNotFoundError);
		expect(chrome.bookmarks.create).not.toHaveBeenCalled();
	});
});

describe('delete', () => {
	it('deletes node when found by id', async () => {
		await repository.delete('6');
		expect(chrome.bookmarks.remove).toHaveBeenCalledWith('6');
	});

	it('throws NodeNotFoundError when target does not exist', async () => {
		await expect(repository.delete('non-existent-id')).rejects.toThrow(NodeNotFoundError);
	});
});

describe('updateFolder', () => {
	it('updates folder when found by id', async () => {
		await repository.updateFolder('5', { title: 'Updated Folder' });
		expect(chrome.bookmarks.update).toHaveBeenCalledWith('5', {
			title: 'Updated Folder'
		});
	});

	it('throws AssertionError when target is not a folder', async () => {
		await expect(repository.updateFolder('6', { title: 'Updated Folder' })).rejects.toThrow(
			AssertionError
		);
	});
});

describe('updateBookmark', () => {
	it('updates bookmark when found by id', async () => {
		await repository.updateBookmark('6', {
			title: 'Updated Title',
			url: 'https://updated-url.com'
		});
		expect(chrome.bookmarks.update).toHaveBeenCalledWith('6', {
			title: 'Updated Title',
			url: 'https://updated-url.com'
		});
	});

	it('throws AssertionError when target is not a bookmark', async () => {
		await expect(
			repository.updateBookmark('5', {
				title: 'Updated Title',
				url: 'https://updated-url.com'
			})
		).rejects.toThrow(AssertionError);
		expect(chrome.bookmarks.update).not.toHaveBeenCalled();
	});
});

describe('move', () => {
	it('moves node to new parent folder', async () => {
		await repository.move('6', { parentId: '1' });
		expect(chrome.bookmarks.move).toHaveBeenCalledWith('6', { parentId: '1' });
	});

	it('throws NodeNotFoundError when target node does not exist', async () => {
		await expect(repository.move('non-existent-id', { parentId: '1' })).rejects.toThrow(
			NodeNotFoundError
		);
		expect(chrome.bookmarks.move).not.toHaveBeenCalled();
	});
});
