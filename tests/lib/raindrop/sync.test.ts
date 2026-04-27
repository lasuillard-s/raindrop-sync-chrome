import { mockRaindropClient } from '@test-helpers/raindrop';
import { beforeEach, describe, expect, it } from 'vitest';
import { getClient, type Raindrop } from '~/lib/raindrop/client';
import { RaindropTreeBuilder } from '~/lib/raindrop/sync';

let raindropClient: Raindrop;

beforeEach(() => {
	raindropClient = mockRaindropClient(getClient());
});

describe('RaindropTreeBuilder', () => {
	it('should create a tree structure from Raindrop.io collections', async () => {
		// Arrange
		const paths: string[] = [];
		const builder = new RaindropTreeBuilder(raindropClient);

		// Act
		const root = await builder.build();
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
