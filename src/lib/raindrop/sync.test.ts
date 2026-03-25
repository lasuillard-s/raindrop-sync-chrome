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
