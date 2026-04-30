import { RaindropAdapter } from '@lib/sync/providers/raindrop';
import { describe, expect, it, vi } from 'vitest';

describe('RaindropAdapter', () => {
	it('loads root-level data and deduplicates nodes by id', async () => {
		const client = {
			collection: {
				getRootCollections: vi.fn(async () => ({
					data: {
						items: [
							{
								_id: 10,
								title: 'Collection',
								parent: null
							}
						]
					}
				})),
				getChildCollections: vi.fn(async () => ({ data: { items: [] } }))
			},
			getAllRaindrops: vi.fn(async () => [
				{
					_id: 20,
					title: 'Bookmark',
					link: 'https://example.com',
					collection: { $id: 10 }
				},
				{
					_id: 20,
					title: 'Bookmark duplicate',
					link: 'https://example.com',
					collection: { $id: 10 }
				},
				{
					_id: 30,
					title: 'Unsorted',
					link: 'https://unsorted.example',
					collection: { $id: -1 }
				}
			])
		} as any;

		const adapter = new RaindropAdapter(client);
		const root = await adapter.getTree();
		const paths: string[] = [];
		root.dfs((node) => {
			paths.push(node.getPath().toString());
		});

		expect(client.collection.getRootCollections).toHaveBeenCalledOnce();
		expect(client.collection.getChildCollections).toHaveBeenCalledOnce();
		expect(client.getAllRaindrops).toHaveBeenCalledWith(0);
		expect(paths).toEqual([
			'/Raindrop.io',
			'/Raindrop.io/Collection',
			'/Raindrop.io/Collection/Bookmark',
			'/Raindrop.io/Unsorted'
		]);
	});

	it('loads subtree when base node id is provided', async () => {
		const client = {
			collection: {
				getRootCollections: vi.fn(),
				getChildCollections: vi.fn()
			},
			getAllRaindrops: vi.fn(async (collectionId: number) => [
				{
					_id: 99,
					title: `Bookmark-${collectionId}`,
					link: 'https://example.com',
					collection: { $id: collectionId }
				}
			])
		} as any;

		const adapter = new RaindropAdapter(client);
		const root = await adapter.getTree('42');
		const paths: string[] = [];
		root.dfs((node) => {
			paths.push(node.getPath().toString());
		});

		expect(client.getAllRaindrops).toHaveBeenCalledWith(42);
		expect(client.collection.getRootCollections).not.toHaveBeenCalled();
		expect(paths).toEqual(['/Raindrop.io', '/Raindrop.io/Bookmark-42']);
	});
});
