import { expect, test } from '^/e2e/fixtures';
import { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import { Path } from '~/lib/util/path';

test.describe('getFolderById', async () => {
	test('should create a bookmark', async ({ serviceWorker }) => {
		const returnValue: string = await serviceWorker.evaluate(async () => {
			const repository = new ChromeBookmarkRepository();
			const path = new Path({ segments: ['Bookmarks bar', 'test'] });
			const bookmark = await repository.createBookmark(path, {
				title: 'Test',
				url: 'https://example.com'
			});
			return bookmark.title;
		});
		expect(returnValue).toEqual('Test');
	});
});
