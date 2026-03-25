import { describe, expect, it, vi } from 'vitest';
import type { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import { Path } from '~/lib/util/path';
import { SyncOpAdd, SyncOpDelete, SyncOpNoop, SyncOpUpdate } from './op';

/**
 * Creates a minimal repository double for sync operation tests.
 * @returns A repository-like object with bookmark mutator spies.
 */
function createRepository() {
	return {
		createBookmark: vi.fn(async () => undefined),
		updateBookmark: vi.fn(async () => undefined),
		deleteBookmark: vi.fn(async () => undefined)
	} as unknown as ChromeBookmarkRepository;
}

describe('SyncOpAdd', () => {
	it('creates a bookmark and allows parent folder creation', async () => {
		// Arrange
		const repository = createRepository();
		const path = new Path({ pathString: '/Synced/Collection/Bookmark' });
		const op = new SyncOpAdd({
			path,
			title: 'Bookmark',
			url: 'https://example.com'
		});

		// Act
		await op.apply(repository);

		// Assert
		expect(repository.createBookmark).toHaveBeenCalledWith(
			path,
			{
				title: 'Bookmark',
				url: 'https://example.com'
			},
			{
				createParentIfNotExists: true
			}
		);
	});
});

describe('SyncOpUpdate', () => {
	it('updates the existing bookmark at the target path', async () => {
		// Arrange
		const repository = createRepository();
		const path = new Path({ pathString: '/Chrome/Bookmark' });
		const op = new SyncOpUpdate({
			path,
			title: 'Updated title',
			url: 'https://updated.example'
		});

		// Act
		await op.apply(repository);

		// Assert
		expect(repository.updateBookmark).toHaveBeenCalledWith(path, {
			title: 'Updated title',
			url: 'https://updated.example'
		});
	});
});

describe('SyncOpDelete', () => {
	it('deletes the bookmark at the target path', async () => {
		// Arrange
		const repository = createRepository();
		const path = new Path({ pathString: '/Chrome/Bookmark' });
		const op = new SyncOpDelete({ path });

		// Act
		await op.apply(repository);

		// Assert
		expect(repository.deleteBookmark).toHaveBeenCalledWith(path);
	});
});

describe('SyncOpNoop', () => {
	it('does not call repository mutators', async () => {
		// Arrange
		const repository = createRepository();
		const op = new SyncOpNoop({
			path: new Path({ pathString: '/Chrome/Bookmark' })
		});

		// Act
		await op.apply(repository);

		// Assert
		expect(repository.createBookmark).not.toHaveBeenCalled();
		expect(repository.updateBookmark).not.toHaveBeenCalled();
		expect(repository.deleteBookmark).not.toHaveBeenCalled();
	});
});
