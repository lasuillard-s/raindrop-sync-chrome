import { beforeEach, describe, expect, it } from 'vitest';
import { createTreeFromRaindrops } from './sync';
import { mockRaindropClient } from '@test-helpers/raindrop';
import { getClient, type Raindrop } from './client';

let raindropClient: Raindrop;

beforeEach(() => {
	raindropClient = mockRaindropClient(getClient());
});

describe('createTreeFromRaindrops', () => {
	it('should create a tree structure from Raindrop.io collections', async () => {
		const root = await createTreeFromRaindrops(raindropClient);
		const paths: string[] = [];
		root.dfs((node) => {
			paths.push(node.getFullPath().toString() || '');
		});
		expect(paths).toEqual([
			'/',
			'/updateRaindrops',
			'/getHighlightsInCollection',
			'/shareCollection',
			'/GitHub · Change is constant. GitHub keeps you ahead.',
			'/https://raindrop.io',
			'/getAllHighlights'
		]);
	});
});
