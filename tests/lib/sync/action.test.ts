import { describe, expect, it } from 'vitest';
import {
	SyncActionCreateBookmark,
	SyncActionCreateFolder,
	SyncActionDelete,
	SyncActionType,
	SyncActionUpdateBookmark,
	SyncActionUpdateFolder
} from '~/lib/sync';
import { Path } from '~/lib/util/path';

describe('Sync actions', () => {
	it('stores create bookmark args and type', () => {
		const action = new SyncActionCreateBookmark({
			path: new Path({ pathString: '/Synced/Bookmark' }),
			url: 'https://example.com'
		});

		expect(action.type).toBe(SyncActionType.CreateBookmark);
		expect(action.args.path.toString()).toBe('/Synced/Bookmark');
		expect(action.args.url).toBe('https://example.com');
	});

	it('stores create folder args and type', () => {
		const action = new SyncActionCreateFolder({
			path: new Path({ pathString: '/Synced/Folder' })
		});

		expect(action.type).toBe(SyncActionType.CreateFolder);
		expect(action.args.path.toString()).toBe('/Synced/Folder');
	});

	it('stores update bookmark args and type', () => {
		const action = new SyncActionUpdateBookmark({
			id: 'bookmark-id',
			title: 'Updated title',
			url: 'https://updated.example'
		});

		expect(action.type).toBe(SyncActionType.UpdateBookmark);
		expect(action.args).toEqual({
			id: 'bookmark-id',
			title: 'Updated title',
			url: 'https://updated.example'
		});
	});

	it('stores update folder args and type', () => {
		const action = new SyncActionUpdateFolder({
			id: 'folder-id',
			title: 'Updated folder'
		});

		expect(action.type).toBe(SyncActionType.UpdateFolder);
		expect(action.args).toEqual({
			id: 'folder-id',
			title: 'Updated folder'
		});
	});

	it('stores delete args and type', () => {
		const action = new SyncActionDelete({ id: 'delete-id' });

		expect(action.type).toBe(SyncActionType.Delete);
		expect(action.args).toEqual({ id: 'delete-id' });
	});
});
