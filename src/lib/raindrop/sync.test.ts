import { mockRaindropClient } from '@test-helpers/raindrop';
import { beforeEach, describe, expect, it } from 'vitest';
import { getClient, type Raindrop } from './client';
import { createTreeFromRaindrops } from './sync';

let raindropClient: Raindrop;

beforeEach(() => {
	raindropClient = mockRaindropClient(getClient());
});

describe('createTreeFromRaindrops', () => {
	it('should create a tree structure from Raindrop.io collections', async () => {
		// Arrange
		const paths: string[] = [];

		// Act
		const root = await createTreeFromRaindrops(raindropClient);
		root.dfs((node) => {
			paths.push(node.getFullPath().toString() || '');
		});

		// Assert
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
