import { beforeEach, describe, expect, it } from 'vitest';
import { createTreeFromChromeBookmarks } from './sync';
import { ChromeBookmarkRepository } from './repository';

let repository: ChromeBookmarkRepository;

beforeEach(() => {
	repository = new ChromeBookmarkRepository();
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
