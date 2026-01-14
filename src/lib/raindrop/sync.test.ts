import { describe, expect, it, vi } from 'vitest';
import { getClient } from './client';
import { createTreeFromRaindrops } from './sync';

describe('createTreeFromRaindrops', () => {
	it('should create a tree structure from Raindrop.io collections', async () => {
		const raindropClient = getClient();
		const mockedRaindropClient = vi.mockObject(raindropClient);
		mockedRaindropClient.getAllRaindrops.mockResolvedValue([
			{
				_id: 1491378920,
				collection: {
					$id: -1,
					$ref: 'collections',
					oid: -1
				},
				collectionId: -1,
				cover:
					'https://images.ctfassets.net/8aevphvgewt8/4pe4eOtUJ0ARpZRE4fNekf/f52b1f9c52f059a33170229883731ed0/GH-Homepage-Universe-img.png',
				created: '2025-12-16T05:32:04.883Z',
				creatorRef: {
					_id: 2067190,
					avatar: '',
					email: '',
					name: 'miyil99106'
				},
				domain: 'github.com',
				excerpt:
					"Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.",
				highlights: [],
				lastUpdate: '2025-12-16T05:32:06.197Z',
				link: 'https://github.com',
				media: [
					{
						link: 'https://images.ctfassets.net/8aevphvgewt8/4pe4eOtUJ0ARpZRE4fNekf/f52b1f9c52f059a33170229883731ed0/GH-Homepage-Universe-img.png',
						type: 'image'
					}
				],
				note: '',
				removed: false,
				sort: 1491378920,
				tags: [],
				title: 'GitHub · Change is constant. GitHub keeps you ahead.',
				type: 'link',
				user: {
					$id: 2067190,
					$ref: 'users'
				}
			},
			{
				_id: 1210279722,
				collection: {
					$id: -1,
					$ref: 'collections',
					oid: -1
				},
				collectionId: -1,
				cover:
					'https://t3.ftcdn.net/jpg/00/92/53/56/360_F_92535664_IvFsQeHjBzfE6sD4VHdO8u5OHUSc6yHF.jpg',
				created: '2025-07-02T07:15:40.097Z',
				creatorRef: {
					_id: 2067190,
					avatar: '',
					email: '',
					name: 'miyil99106'
				},
				domain: 'raindrop.io',
				excerpt: '',
				highlights: [],
				lastUpdate: '2025-07-02T07:15:40.098Z',
				link: 'https://raindrop.io',
				media: [
					{
						link: 'https://t3.ftcdn.net/jpg/00/92/53/56/360_F_92535664_IvFsQeHjBzfE6sD4VHdO8u5OHUSc6yHF.jpg',
						type: 'image'
					}
				],
				note: '',
				removed: false,
				sort: 1210279722,
				tags: ['raindrop'],
				title: 'https://raindrop.io',
				type: 'link',
				user: {
					$id: 2067190,
					$ref: 'users'
				}
			},
			{
				_id: 1210279712,
				collection: {
					$id: -1,
					$ref: 'collections',
					oid: -1
				},
				collectionId: -1,
				cover: '',
				created: '2025-07-02T07:15:37.885Z',
				creatorRef: {
					_id: 2067190,
					avatar: '',
					email: '',
					name: 'miyil99106'
				},
				domain: 'raindrop.io',
				excerpt: '',
				highlights: [
					{
						_id: '6864dc99f9cbdb7d1ee0f3ae',
						created: '2025-07-02T07:15:37.884Z',
						creatorRef: 2067190,
						lastUpdate: '2025-07-02T07:15:37.885Z',
						note: '',
						text: 'ignore'
					}
				],
				lastUpdate: '2025-07-02T07:15:37.885Z',
				link: 'https://raindrop.io',
				media: [],
				note: '',
				removed: false,
				sort: 1210279712,
				tags: [],
				title: 'getAllHighlights',
				type: 'link',
				user: {
					$id: 2067190,
					$ref: 'users'
				}
			}
		]);
		// @ts-expect-error Ignore type mismatch for mocks
		mockedRaindropClient.collection.getRootCollections.mockImplementation(() => ({
			data: {
				items: [
					{
						_id: 57172486,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 1,
						cover: [],
						created: '2025-07-02T07:15:37.776Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-07-02T07:15:38.746Z',
						lastUpdate: '2025-07-02T07:15:38.746Z',
						parent: null,
						public: false,
						slug: 'update-raindrops',
						sort: 0,
						title: 'updateRaindrops',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					},
					{
						_id: 57172489,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 0,
						cover: [],
						created: '2025-07-02T07:15:38.506Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-12-16T05:30:15.443Z',
						lastUpdate: '2025-12-16T05:30:15.444Z',
						parent: null,
						public: false,
						slug: 'get-highlights-in-collection',
						sort: 0,
						title: 'getHighlightsInCollection',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					},
					{
						_id: 57172499,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 0,
						cover: [],
						created: '2025-07-02T07:15:46.143Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-07-02T07:15:46.143Z',
						lastUpdate: '2025-07-02T07:15:46.143Z',
						parent: null,
						public: false,
						slug: 'share-collection',
						sort: 0,
						title: 'shareCollection',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					}
				],
				result: true
			}
		}));
		// @ts-expect-error Ignore type mismatch for mocks
		mockedRaindropClient.collection.getChildCollections.mockImplementation(() => ({
			data: {
				items: [
					{
						_id: 57172486,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 1,
						cover: [],
						created: '2025-07-02T07:15:37.776Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-07-02T07:15:38.746Z',
						lastUpdate: '2025-07-02T07:15:38.746Z',
						parent: null,
						public: false,
						slug: 'update-raindrops',
						sort: 0,
						title: 'updateRaindrops',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					},
					{
						_id: 57172489,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 0,
						cover: [],
						created: '2025-07-02T07:15:38.506Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-12-16T05:30:15.443Z',
						lastUpdate: '2025-12-16T05:30:15.444Z',
						parent: null,
						public: false,
						slug: 'get-highlights-in-collection',
						sort: 0,
						title: 'getHighlightsInCollection',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					},
					{
						_id: 57172499,
						access: {
							draggable: true,
							for: 2067190,
							level: 4,
							root: false
						},
						author: true,
						count: 0,
						cover: [],
						created: '2025-07-02T07:15:46.143Z',
						creatorRef: {
							_id: 2067190,
							email: '',
							name: 'miyil99106'
						},
						description: '',
						expanded: true,
						lastAction: '2025-07-02T07:15:46.143Z',
						lastUpdate: '2025-07-02T07:15:46.143Z',
						parent: null,
						public: false,
						slug: 'share-collection',
						sort: 0,
						title: 'shareCollection',
						user: {
							$id: 2067190,
							$ref: 'users'
						},
						view: 'list'
					}
				],
				result: true
			}
		}));

		const root = await createTreeFromRaindrops(mockedRaindropClient);
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
