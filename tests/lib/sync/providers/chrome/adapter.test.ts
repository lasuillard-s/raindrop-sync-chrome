import { describe, expect, it, vi } from 'vitest';
import {
	SyncActionCreateBookmark,
	SyncActionCreateFolder,
	SyncActionDelete,
	SyncActionUpdateBookmark,
	SyncActionUpdateFolder
} from '~/lib/sync';
import { ChromeAdapter } from '~/lib/sync/providers/chrome';
import { Path } from '~/lib/util/path';

describe('ChromeAdapter', () => {
	it('builds a tree from repository subtree and supports non-root base id', async () => {
		const repository = {
			getFolderBy: vi.fn(async ({ id }: { id: string }) => ({
				id,
				title: 'updateRaindrops',
				parentId: '1',
				children: [
					{
						id: '6',
						title: 'updateRaindrops',
						parentId: id,
						url: 'https://raindrop.io/'
					}
				]
			}))
		} as any;

		const adapter = new ChromeAdapter(repository);
		const root = await adapter.getTree('5');
		const paths: string[] = [];
		root.dfs((node) => {
			paths.push(node.getPath().toString());
		});

		expect(repository.getFolderBy).toHaveBeenCalledWith({ id: '5' });
		expect(paths).toEqual(['/updateRaindrops', '/updateRaindrops/updateRaindrops']);
	});

	it('routes actions to repository methods', async () => {
		const repository = {
			getFolderBy: vi.fn(),
			createBookmarkByPath: vi.fn(async () => undefined),
			createFolderByPath: vi.fn(async () => undefined),
			updateBookmark: vi.fn(async () => undefined),
			updateFolder: vi.fn(async () => undefined),
			delete: vi.fn(async () => undefined)
		} as any;
		const adapter = new ChromeAdapter(repository);

		await adapter.applyAction(
			new SyncActionCreateBookmark({
				path: new Path({ pathString: '/Synced/Bookmark' }),
				url: 'https://example.com'
			})
		);
		await adapter.applyAction(
			new SyncActionCreateFolder({
				path: new Path({ pathString: '/Synced/Folder' })
			})
		);
		await adapter.applyAction(
			new SyncActionUpdateBookmark({
				id: 'bookmark-id',
				title: 'Updated bookmark',
				url: 'https://updated.example'
			})
		);
		await adapter.applyAction(
			new SyncActionUpdateFolder({
				id: 'folder-id',
				title: 'Updated folder'
			})
		);
		await adapter.applyAction(new SyncActionDelete({ id: 'delete-id' }));

		expect(repository.createBookmarkByPath).toHaveBeenCalledWith(
			new Path({ pathString: '/Synced/Bookmark' }),
			{ url: 'https://example.com' },
			{ createParentsIfNotExists: true }
		);
		expect(repository.createFolderByPath).toHaveBeenCalledWith(
			new Path({ pathString: '/Synced/Folder' }),
			{ createParentsIfNotExists: true }
		);
		expect(repository.updateBookmark).toHaveBeenCalledWith('bookmark-id', {
			title: 'Updated bookmark',
			url: 'https://updated.example'
		});
		expect(repository.updateFolder).toHaveBeenCalledWith('folder-id', {
			title: 'Updated folder'
		});
		expect(repository.delete).toHaveBeenCalledWith('delete-id');
	});
});
