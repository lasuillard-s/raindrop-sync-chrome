import { beforeEach, describe, expect, it } from 'vitest';
import { ChromeBookmarkRepository } from '~/lib/browser/repository';
import { ChromeBookmarkTreeBuilder } from '~/lib/browser/sync';

let repository: ChromeBookmarkRepository;

beforeEach(() => {
	repository = new ChromeBookmarkRepository();
});

describe('ChromeBookmarkTreeBuilder', () => {
	it('should create a tree structure from Chrome bookmarks', async () => {
		// Arrange
		const paths: string[] = [];
		const builder = new ChromeBookmarkTreeBuilder();

		// Act
		const root = await builder.build();
		root.dfs((node) => {
			paths.push(node.getFullPath().toString() || '');
		});

		// Assert
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
		// Arrange
		const baseNode = await repository.getFolderById('5'); // 'updateRaindrops' folder
		const paths: string[] = [];
		const builder = new ChromeBookmarkTreeBuilder();

		// Act
		const base = await builder.build({
			baseNodeId: baseNode.id,
			missingBaseMessage: `Failed to locate the base node (${baseNode.id}) in the created tree`
		});
		base.dfs((node) => {
			paths.push(node.getFullPath().toString() || '');
		});

		// Assert
		expect(paths).toEqual([
			'/Bookmarks bar/updateRaindrops',
			'/Bookmarks bar/updateRaindrops/updateRaindrops'
		]);
	});
});
