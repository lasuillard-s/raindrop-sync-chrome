import getAllRaindrops from '@fixtures/raindrop/getAllRaindrops.json';
import getChildCollections from '@fixtures/raindrop/getChildCollections.json';
import getRootCollections from '@fixtures/raindrop/getRootCollections.json';
import type { Raindrop } from '@lib/raindrop/client';
import { vi } from 'vitest';

export const mockRaindropClient = (raindropClient: Raindrop) => {
	const mocked = vi.mockObject(raindropClient);
	// @ts-expect-error Ignore type mismatch for mocks
	mocked.getAllRaindrops = vi.fn(() => getAllRaindrops);
	// @ts-expect-error Ignore type mismatch for mocks
	mocked.collection.getRootCollections = vi.fn(() => getRootCollections);
	// @ts-expect-error Ignore type mismatch for mocks
	mocked.collection.getChildCollections = vi.fn(() => getChildCollections);
	return mocked;
};
